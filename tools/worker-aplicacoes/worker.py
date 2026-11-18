"""
Worker das «Aplicações do dia».

Corre num computador com o driver ODBC do iSeries e acesso ao core. Faz duas coisas:

  1. Fica a perguntar à app «há algum pedido?»; quando alguém carrega em «Gerar aplicações do dia» na ficha, lê o registo
     de ficheiros processados (PLOGITF, sem os DC) e entrega as linhas à app.
  2. Copia as aplicações DC (débitos/créditos por lotes) da tabela «em curso» (GBAPL) para a app, de 10 em 10 minutos e às
     23:55 e 23:59. A GBAPL só guarda o dia atual (à meia-noite esvazia-se) e é a única que tem o nº de operação, a empresa
     e os movimentos: sem esta cópia perdiam-se os DC de cada dia.

A app junta as duas fontes (DC da cópia, o resto do PLOGITF) e gera o Excel. Não precisa de abrir o VS Code nem de correr
nada à mão.

Configuração: variáveis de ambiente ou o ficheiro .env ao lado deste (ver .env.example). A palavra-passe do core e o
token do worker NUNCA vão para o código nem para o repositório.

  python worker.py                       corre sempre (fica a perguntar de 3 em 3 s)
  python worker.py --uma-vez             pergunta uma só vez e sai (para testar)
  python worker.py --simular ficheiro.xlsx   em vez do core, lê este Excel (para testar sem core)
  python worker.py --datas               só mostra que dias há no registo do core e quantos registos (não entrega nada)
  python worker.py --copiar              faz já uma cópia dos DC (GBAPL) para a app e sai (para testar)
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


TABELA_LOG = 'PROMOF0003.$PLOGITF'  # Log de ficheiros processados (guarda o histórico, ao contrário da GBAPL)


TABELA_DC = 'GBANCA0003.GBAPL'  # aplicações em curso: só o dia atual, mas tem nº de operação, empresa e movimentos
INTERVALO_COPIA_MIN = 10
HORAS_EXTRA_COPIA = ('23:55', '23:59')  # as últimas do dia, antes de a GBAPL se esvaziar

# Campos da GBAPL pela ordem em que o core os devolve (a 1.ª «linha» de dados traz os códigos; se faltar, usa-se esta ordem).
CODIGOS_GBAPL = (
    'ACEMP', 'ACSQAP', 'ACNLOT', 'ACSITU', 'GBACREFEF', 'ACFILI', 'ACFILY', 'ACLIBE', 'ACFILE', 'ACMBR', 'ACTDEB', 'ACTCRE',
    'ACTMVD', 'ACTMVC', 'ACTSER', 'ACCOPD', 'ACCOPC', 'ACHORA', 'ACDTIN', 'ACHORF', 'ACDATF', 'ACSEQF', 'ACREFC', 'ACNMOV',
    'ACTAPL', 'ACTPND', 'ACTDEV', 'ACTTRT', 'ACEXCT', 'ACTLAY', 'ACCODC', 'ACCOAP', 'ACVAUD', 'ACFACT', 'ACDLIM', 'ACCNLE',
    'ACCNLM', 'GBACTPNTE', 'GBACTPNTM', 'ACDSNE', 'ACDSNM', 'ACUSER', 'ACBYPA', 'ACNOPR', 'ACPRCP', 'ACBALM', 'ACCOMS',
    'ACTCST', 'ACSCST', 'ACTIVA', 'ACDMVE', 'ACDMVM', 'ACFRES', 'ACMOED',
)


def _inteiro(v) -> int | None:
    """Um número do ODBC (int, Decimal já convertido, texto) -> int; None se não for um número."""
    try:
        return int(float(str(v).strip()))
    except ValueError:
        return None


def registos_dc(linhas: list[list]) -> list[dict]:
    """As operações reais da GBAPL, prontas a gravar: {data, empresa, seq, n_operacao, linha}.

    Só entram os registos com nº de operação numérico > 0 e data de início válida (fica de fora o registo de códigos, as
    linhas de documentação e os pendentes a zeros). A linha vai em bruto, para a app a ler como sempre.
    """
    codigos = CODIGOS_GBAPL
    for l in linhas:
        if len(l) > 1 and str(l[0]).strip() == 'ACEMP' and str(l[1]).strip() == 'ACSQAP':
            codigos = tuple(str(c).strip() for c in l)
            break
    ix: dict[str, int] = {}
    for i, c in enumerate(codigos):
        if c and c not in ix:
            ix[c] = i
    falta = [c for c in ('ACEMP', 'ACSQAP', 'ACDTIN', 'ACNOPR') if c not in ix]
    if falta:
        raise ValueError(f'A estrutura da tabela mudou: faltam as colunas {", ".join(falta)}.')
    ultimo = max(ix['ACEMP'], ix['ACSQAP'], ix['ACDTIN'], ix['ACNOPR'])
    out: list[dict] = []
    for l in linhas:
        if len(l) <= ultimo:
            continue
        nop = _inteiro(l[ix['ACNOPR']])
        d = _inteiro(l[ix['ACDTIN']])
        seq = _inteiro(l[ix['ACSQAP']])
        if not nop or nop <= 0 or seq is None or d is None:
            continue
        try:
            data = dt.date(d // 10000, d // 100 % 100, d % 100).isoformat()
        except ValueError:
            continue
        out.append({'data': data, 'empresa': str(l[ix['ACEMP']] or '').strip(), 'seq': seq, 'n_operacao': str(nop), 'linha': l})
    return out


def slot_da_copia(agora: dt.datetime) -> str | None:
    """A «hora marcada» da cópia a que `agora` pertence (de 10 em 10 minutos e às HORAS_EXTRA_COPIA), ou None."""
    if agora.minute % INTERVALO_COPIA_MIN == 0 or agora.strftime('%H:%M') in HORAS_EXTRA_COPIA:
        return agora.strftime('%Y-%m-%d %H:%M')
    return None


def copiar_dc(app, log: logging.Logger, ler=None) -> int | None:
    """Lê a GBAPL e grava as operações na app. Nunca levanta erro (o worker não pára por causa da cópia); devolve o nº gravado."""
    try:
        _, linhas = (ler or ler_core)(f'SELECT * FROM {TABELA_DC}')
        registos = registos_dc(linhas)
        gravadas = 0
        for i in range(0, len(registos), 1000):
            gravadas += int(app.guardar_dc(registos[i : i + 1000]) or 0)
        log.info('Cópia DC: %d operações na %s, %d gravadas.', len(registos), TABELA_DC, gravadas)
        return gravadas
    except Exception as e:  # noqa: BLE001
        msg = str(e).replace(os.environ.get('CORE_SENHA', '\0'), '***')[:300]
        log.error('Cópia DC falhou: %s', msg)
        return None


def consulta_do_pedido(data_iso: str | None, personalizada: str = '') -> tuple[str, str | None]:
    """A query a correr para um pedido, e (se for por datas) a descrição dos dias para as mensagens.

    A ficha do dia D cobre das 07:00 de D às 07:00 de D+1, por isso pedem-se os registos de D e de D+1
    ($PLODTPR = AAAAMMDD, a data do processamento). Os DC (módulo DC) ficam de fora: vêm da cópia da GBAPL, que tem o nº de
    operação. Com CORE_QUERY definida corre-se essa query tal e qual.
    Um pedido sem data válida é um erro (não se lê a tabela inteira por engano: cresce todos os dias).
    """
    if personalizada.strip():
        return personalizada.strip(), None
    try:
        d1 = dt.date.fromisoformat(str(data_iso)[:10])
    except ValueError:
        raise ValueError('O pedido não tem uma data válida.') from None
    d2 = d1 + dt.timedelta(days=1)
    q = f"SELECT * FROM {TABELA_LOG} WHERE $PLODTPR IN ({d1:%Y%m%d}, {d2:%Y%m%d}) AND $PLOMOD <> 'DC'"
    return q, f'{d1.isoformat()} e {d2.isoformat()}'


def ler_do_pedido(pedido: dict, personalizada: str = '') -> tuple[list[str], list[list], str | None]:
    """Corre no core a query do pedido e devolve (colunas, linhas, dias)."""
    query, dias = consulta_do_pedido(pedido.get('data'), personalizada)
    logging.getLogger('worker').info('Consulta: %s', query)
    colunas, linhas = ler_core(query)
    return colunas, linhas, dias


def ler_core(query: str) -> tuple[list[str], list[list]]:
    """Corre a query no core e devolve (colunas, linhas)."""
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

    def guardar_dc(self, registos: list[dict]) -> int:
        return self.chamar('worker_guardar_dc', {'p_token': self.token, 'p_registos': registos})

    def entregar(self, pedido: str, colunas, linhas, erro: str | None) -> None:
        self.chamar(
            'worker_entregar_aplicacoes',
            {'p_token': self.token, 'p_pedido': pedido, 'p_colunas': colunas or [], 'p_linhas': linhas or [], 'p_erro': erro},
        )


def tratar_pedido(app: App, pedido: dict, ler, log: logging.Logger, copiar=None) -> None:
    pid = pedido['id']
    log.info('Pedido %s (ficha de %s) de %s', pid, pedido.get('data'), pedido.get('pedido_por_nome'))
    if copiar:
        copiar()  # os DC de hoje ficam atualizados antes de a ficha os ler (nunca levanta erro)
    try:
        colunas, linhas, dias = ler(pedido)
        log.info('Core devolveu %d registos, %d colunas', len(linhas), len(colunas))
        if not linhas and dias:
            # Nada para esses dias: avisa em vez de entregar vazio (que substituiria um Excel bom já guardado para a data).
            app.entregar(pid, [], [], f'O core não tem aplicações para {dias} (a tabela só guarda o que ainda não foi limpo). Usa «Carregar Excel».')
            log.info('Sem registos para %s: pedido terminado com aviso.', dias)
            return
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
    ap.add_argument('--datas', action='store_true', help='mostra os dias que o registo do core tem (diagnóstico)')
    ap.add_argument('--copiar', action='store_true', help='copia já os DC (GBAPL) para a app e sai (teste)')
    args = ap.parse_args()

    carregar_env()
    if args.datas:
        # Só leitura: que dias ($PLODTPR, AAAAMMDD) há no registo e quantos registos cada um. Não fala com a app.
        _, linhas = ler_core(f'SELECT $PLODTPR, COUNT(*) FROM {TABELA_LOG} GROUP BY $PLODTPR ORDER BY $PLODTPR')
        print(f'{len(linhas)} dias no registo, de {linhas[0][0] if linhas else "-"} a {linhas[-1][0] if linhas else "-"}. Os últimos 15:')
        print('Data ($PLODTPR)  Registos')
        for d, n in linhas[-15:]:
            print(f'{str(d):<16} {n}')
        return
    log = configurar_log()
    app = App()
    personalizada = os.environ.get('CORE_QUERY', '')
    intervalo = max(1, int(os.environ.get('POLL_SEGUNDOS', '3')))
    ler = (lambda p: (*ler_excel(args.simular), None)) if args.simular else (lambda p: ler_do_pedido(p, personalizada))
    if args.copiar:
        n = copiar_dc(app, log)
        print('Cópia DC falhou (ver worker.log).' if n is None else f'Cópia DC feita: {n} operações gravadas.')
        return
    copiar = None if args.simular else (lambda: copiar_dc(app, log))
    log.info('Worker a correr (%s). Intervalo %ss. Tabela: %s%s', 'SIMULADO' if args.simular else 'core real', intervalo, TABELA_LOG,
             ' (CORE_QUERY definida: ignora a data)' if personalizada.strip() else '')
    ultimo_slot = None
    if copiar:
        log.info('Cópia dos DC (%s) de %d em %d minutos e às %s.', TABELA_DC, INTERVALO_COPIA_MIN, INTERVALO_COPIA_MIN, ' e '.join(HORAS_EXTRA_COPIA))
        copiar()  # ao arrancar, para não esperar pela próxima hora marcada
        ultimo_slot = slot_da_copia(dt.datetime.now())

    while True:
        try:
            slot = slot_da_copia(dt.datetime.now())
            if copiar and slot and slot != ultimo_slot:
                ultimo_slot = slot
                copiar()
            pedido = app.reclamar()
            if pedido:
                tratar_pedido(app, pedido, ler, log, copiar)
        except Exception:  # noqa: BLE001 — rede em baixo, servidor a reiniciar…: tenta de novo
            log.exception('Erro a falar com a app')
        if args.uma_vez:
            return
        time.sleep(intervalo)


if __name__ == '__main__':
    main()
