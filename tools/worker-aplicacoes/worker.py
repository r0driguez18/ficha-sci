"""
Worker das «Aplicações do dia».

Corre num computador com o driver ODBC do iSeries e acesso ao core. Fica a perguntar à app «há algum pedido?»; quando
alguém carrega em «Gerar aplicações do dia» na ficha, corre a query no core e entrega as linhas à app (que gera o
Excel e mostra as operações). Não precisa de abrir o VS Code nem de correr nada à mão.

Configuração: variáveis de ambiente ou o ficheiro .env ao lado deste (ver .env.example). A palavra-passe do core e o
token do worker NUNCA vão para o código nem para o repositório.

  python worker.py                       corre sempre (fica a perguntar de 3 em 3 s)
  python worker.py --uma-vez             pergunta uma só vez e sai (para testar)
  python worker.py --simular ficheiro.xlsx   em vez do core, lê este Excel (para testar sem core)
"""
from __future__ import annotations

import argparse
import codecs
import datetime as dt
import decimal
import logging
import logging.handlers
import os
import sys
import time
from pathlib import Path

import requests
import urllib3
from requests.adapters import HTTPAdapter

AQUI = Path(__file__).resolve().parent


def carregar_env() -> None:
    """Lê o .env ao lado do script (CHAVE=valor, # para comentários). Não substitui o que já está no ambiente."""
    f = AQUI / '.env'
    if not f.exists():
        return
    for linha in f.read_text(encoding='utf-8').splitlines():
        linha = linha.strip()
        if not linha or linha.startswith('#') or '=' not in linha:
            continue
        k, v = linha.split('=', 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def exigir(nome: str) -> str:
    v = os.environ.get(nome, '').strip()
    if not v:
        sys.exit(f'Falta a configuração {nome} (ver .env.example).')
    return v


def configurar_log() -> logging.Logger:
    log = logging.getLogger('worker')
    log.setLevel(logging.INFO)
    fmt = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
    for h in (
        logging.StreamHandler(),
        logging.handlers.RotatingFileHandler(AQUI / 'worker.log', maxBytes=500_000, backupCount=3, encoding='utf-8'),
    ):
        h.setFormatter(fmt)
        log.addHandler(h)
    return log


def json_seguro(v):
    """Valores do ODBC -> JSON: Decimal/data/bytes não serializam sozinhos."""
    if v is None or isinstance(v, (str, bool, int, float)):
        return v
    if isinstance(v, decimal.Decimal):
        return int(v) if v == v.to_integral_value() else float(v)
    if isinstance(v, (dt.datetime, dt.date, dt.time)):
        return v.isoformat()
    if isinstance(v, (bytes, bytearray)):
        return bytes(v).hex()
    return str(v)


def ler_core(query: str) -> tuple[list[str], list[list]]:
    """Corre a query no core (o mesmo que o script antigo) e devolve (colunas, linhas)."""
    import pyodbc  # só é preciso para o core real

    ligacao = pyodbc.connect(
        driver='{iSeries Access ODBC Driver}',
        system=exigir('CORE_SISTEMA'),
        uid=exigir('CORE_UTILIZADOR'),
        pwd=exigir('CORE_SENHA'),
        timeout=30,
    )
    try:
        cur = ligacao.cursor()
        cur.execute(query)
        colunas = [str(c[0]) for c in cur.description]
        linhas = [list(r) for r in cur.fetchall()]
    finally:
        ligacao.close()

    # O script antigo descodificava a coluna PERC (hex em EBCDIC cp500); mantém-se se ela existir.
    if 'PERC' in colunas:
        i = colunas.index('PERC')
        for l in linhas:
            if isinstance(l[i], str):
                try:
                    l[i] = codecs.decode(bytes.fromhex(l[i]), 'cp500')
                except ValueError:
                    pass
    return colunas, [[json_seguro(c) for c in l] for l in linhas]


def ler_excel(caminho: str) -> tuple[list[str], list[list]]:
    """Modo de teste: em vez do core, lê o Excel que o script antigo gerava."""
    import openpyxl

    ws = openpyxl.load_workbook(caminho, read_only=True, data_only=True).worksheets[0]
    todas = [list(r) for r in ws.iter_rows(values_only=True)]
    colunas = [str(c) if c is not None else '' for c in todas[0]]
    linhas = [[json_seguro(c) for c in r] for r in todas[1:] if any(c not in (None, '') for c in r)]
    return colunas, linhas


class _AdaptadorImpressao(HTTPAdapter):
    """Só aceita o servidor cujo certificado tem esta impressão digital (SHA-256).

    Serve para certificados autoassinados sem «subjectAltName» (só CN=IP), que o Python recusa por nome: em vez de
    desligar a verificação, fica-se preso a ESTE certificado exato. Se o certificado do servidor mudar, volta a falhar.
    """

    def __init__(self, impressao: str, **kw) -> None:
        self._impressao = impressao
        super().__init__(**kw)

    def init_poolmanager(self, *a, **kw):
        kw['assert_fingerprint'] = self._impressao
        super().init_poolmanager(*a, **kw)


class App:
    """Fala com a app (Supabase) só pelas 2 funções worker_*, com o token. Sem conta e sem chave de serviço."""

    def __init__(self) -> None:
        base = exigir('SUPABASE_URL').rstrip('/')
        self.url = f'{base}/rest/v1/rpc/'
        self.token = exigir('WORKER_TOKEN')
        chave = exigir('SUPABASE_ANON_KEY')
        self.http = requests.Session()
        self.http.headers.update({'apikey': chave, 'Authorization': f'Bearer {chave}', 'Content-Type': 'application/json'})
        impressao = os.environ.get('SERVER_CERT_SHA256', '').replace(':', '').strip()
        ca = os.environ.get('CA_BUNDLE', '').strip()
        if impressao:
            # A cadeia não é validada pelo nome; quem decide é a impressão digital do certificado.
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            self.http.verify = False
            self.http.mount('https://', _AdaptadorImpressao(impressao))
        else:
            self.http.verify = ca if ca else True  # certificado interno: aponta CA_BUNDLE para o .pem da empresa

    def chamar(self, funcao: str, corpo: dict):
        r = self.http.post(self.url + funcao, json=corpo, timeout=30)
        if r.status_code >= 400:
            raise RuntimeError(f'{funcao}: HTTP {r.status_code} {r.text[:200]}')
        return r.json() if r.text else None

    def reclamar(self):
        p = self.chamar('worker_reclamar_pedido', {'p_token': self.token})
        # uma função que devolve NULL pode chegar como objeto com tudo a null
        return p if isinstance(p, dict) and p.get('id') else None

    def entregar(self, pedido: str, colunas, linhas, erro: str | None) -> None:
        self.chamar(
            'worker_entregar_aplicacoes',
            {'p_token': self.token, 'p_pedido': pedido, 'p_colunas': colunas or [], 'p_linhas': linhas or [], 'p_erro': erro},
        )


def tratar_pedido(app: App, pedido: dict, ler, log: logging.Logger) -> None:
    pid = pedido['id']
    log.info('Pedido %s (ficha de %s) de %s', pid, pedido.get('data'), pedido.get('pedido_por_nome'))
    try:
        colunas, linhas = ler()
        log.info('Core devolveu %d registos, %d colunas', len(linhas), len(colunas))
        app.entregar(pid, colunas, linhas, None)
        log.info('Entregue.')
    except Exception as e:  # noqa: BLE001 — qualquer falha vai como erro para a ficha, sem expor a palavra-passe
        msg = str(e).replace(os.environ.get('CORE_SENHA', '\0'), '***')[:300]
        log.exception('Falhou o pedido %s', pid)
        try:
            app.entregar(pid, [], [], f'Falhou a leitura do core: {msg}')
        except Exception:  # noqa: BLE001
            log.exception('Também não foi possível comunicar o erro')


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--uma-vez', action='store_true', help='pergunta uma vez e sai')
    ap.add_argument('--simular', metavar='XLSX', help='em vez do core, lê este Excel')
    args = ap.parse_args()

    carregar_env()
    log = configurar_log()
    app = App()
    query = os.environ.get('CORE_QUERY', 'SELECT * from GBANCA0003.GBAPL')
    intervalo = max(1, int(os.environ.get('POLL_SEGUNDOS', '3')))
    ler = (lambda: ler_excel(args.simular)) if args.simular else (lambda: ler_core(query))
    log.info('Worker a correr (%s). Intervalo %ss.', 'SIMULADO' if args.simular else 'core real', intervalo)

    while True:
        try:
            pedido = app.reclamar()
            if pedido:
                tratar_pedido(app, pedido, ler, log)
        except Exception:  # noqa: BLE001 — rede em baixo, servidor a reiniciar…: tenta de novo
            log.exception('Erro a falar com a app')
        if args.uma_vez:
            return
        time.sleep(intervalo)


if __name__ == '__main__':
    main()
