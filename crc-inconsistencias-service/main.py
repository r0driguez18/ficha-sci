"""
Serviço local — Fecho de inconsistências do CRC.

Faz o que o script de terminal fazia, mas exposto por HTTP para a página
"CRC" da aplicação SCI: abre o Chrome para o login manual, sincroniza os
cookies e corre o ciclo de confirmação paginado, publicando o progresso.

Fluxo:
    POST /runs                  -> abre só o Chrome, fica em "aguarda_login"
    (o operador faz login no CRC, escolhe o código e abre a pesquisa)
    POST /runs/{id}/login-feito -> recebe os params (com o código), sincroniza
                                   cookies e arranca a 1ª passagem
    GET  /runs/{id}             -> progresso (polling)
    POST /runs/{id}/parar       -> cancela a passagem (Chrome fica aberto)
    POST /runs/{id}/repetir     -> nova passagem (novo código, se quiser)
    POST /runs/{id}/terminar    -> fecha o Chrome

Só existe uma sessão de cada vez (um operador, uma sessão do CRC).
Cada passagem escreve logs/bcv_<codigo>_<ts>.log e, se houver IDs
confirmados, logs/resultados_<codigo>_<ts>.json.

Config por variáveis de ambiente (ver README.md).
"""
from __future__ import annotations

import json
import math
import os
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import Any, Optional, TextIO

import requests
import urllib3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from selenium import webdriver
from selenium.webdriver.chrome.service import Service

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ---------------------------------------------------------------- configuração
CAMINHO_DRIVER = os.getenv("CRC_CHROMEDRIVER", r"C:\WebDriver\chromedriver-win64\chromedriver.exe")
CAMINHO_CHROME = os.getenv("CRC_CHROME", r"C:\Program Files\Google\Chrome\Application\chrome.exe")
BASE = os.getenv("CRC_BASE", "https://bcvnet/CRCFRONTOFFICE").rstrip("/")
PORT = int(os.getenv("CRC_SERVICE_PORT", "8765"))
ALLOW_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "CRC_ALLOW_ORIGINS",
        "http://localhost:8080,http://localhost:5173,http://localhost:4173",
    ).split(",")
    if o.strip()
]

SEARCH_URL = f"{BASE}/api/CCR/Inconsistencies/Search"
CONFIRM_URL = f"{BASE}/api/CCR/Inconsistencies/ConfirmInconsistency"
LOGIN_URL = f"{BASE}/CCR/Login/Login"

LOG_DIR = os.getenv("CRC_LOG_DIR", "logs")
PAUSA_PAGINA = float(os.getenv("CRC_PAUSA_PAGINA", "1"))

# Parâmetros da pesquisa que não mudam (mantidos do script). O código e o
# estado da inconsistência vêm em cada execução (RunParams), para se poder
# "mudar de código" sem editar nada.
PARAMS_BASE = {
    "ctxObserved": int(os.getenv("CRC_CTX_OBSERVED", "3")),
    "ctxReported": int(os.getenv("CRC_CTX_REPORTED", "3")),
    "orderBy": "date",
    "orderType": "DESC",
    "participantId": int(os.getenv("CRC_PARTICIPANT_ID", "3")),
    "representantId": int(os.getenv("CRC_REPRESENTANT_ID", "3")),
}
DEFAULT_INCONSISTENCY_CODE = int(os.getenv("CRC_INCONSISTENCY_CODE", "51269"))
DEFAULT_INCONSISTENCY_STATE = int(os.getenv("CRC_INCONSISTENCY_STATE", "225"))

VERSION = "1.1.0"

# ---------------------------------------------------------------- estado global
_lock = threading.Lock()
_cookie_lock = threading.Lock()
_driver: Optional[webdriver.Chrome] = None
_run: Optional[dict[str, Any]] = None  # execução atual (ou None)


class RunParams(BaseModel):
    motivo: str = "Validado"
    pageSize: int = 100
    maxThreads: int = 20
    paginaInicial: int = 1
    inconsistencyCode: int = DEFAULT_INCONSISTENCY_CODE
    inconsistencyState: int = DEFAULT_INCONSISTENCY_STATE


# ---------------------------------------------------------------- browser / http
def _abrir_chrome() -> webdriver.Chrome:
    options = webdriver.ChromeOptions()
    options.binary_location = CAMINHO_CHROME
    options.add_argument("--start-maximized")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--remote-allow-origins=*")
    driver = webdriver.Chrome(service=Service(CAMINHO_DRIVER), options=options)
    driver.get(LOGIN_URL)
    return driver


def _fechar_chrome() -> None:
    global _driver
    if _driver is not None:
        try:
            _driver.quit()
        except Exception:
            pass
        _driver = None


def _nova_sessao() -> requests.Session:
    s = requests.Session()
    s.headers.update(
        {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json, text/plain, */*",
            "Referer": f"{BASE}/",
        }
    )
    return s


def _sincronizar_cookies(sessao: requests.Session) -> None:
    with _cookie_lock:
        if _driver is None:
            return
        sessao.cookies.clear()
        for cookie in _driver.get_cookies():
            sessao.cookies.set(cookie["name"], cookie["value"])


def _buscar_pagina(sessao: requests.Session, page_num: int, rp: "RunParams") -> Optional[dict]:
    """Devolve os dados da página, ou `None` se o CRC não respondeu OK (200).
    Num 401 tenta uma vez renovar os cookies a partir do browser aberto."""
    params = dict(
        PARAMS_BASE,
        inconsistencyCode=rp.inconsistencyCode,
        inconsistencyState=rp.inconsistencyState,
        pageSize=rp.pageSize,
        page=page_num,
    )
    try:
        r = sessao.get(SEARCH_URL, params=params, timeout=30, verify=False)
        if r.status_code == 401:
            _sincronizar_cookies(sessao)
            r = sessao.get(SEARCH_URL, params=params, timeout=30, verify=False)
        if r.status_code != 200:
            return None
        return r.json()
    except (requests.RequestException, ValueError):
        return None


def _confirmar(sessao: requests.Session, inconsistency_id: Any, motivo: str) -> None:
    """Confirma uma inconsistência. Só o 200 conta como sucesso — qualquer
    outro estado levanta exceção e o item é contado como falha."""
    params = {"confirmationReason": motivo, "inconsistencyId": inconsistency_id}
    r = sessao.post(CONFIRM_URL, params=params, timeout=30, verify=False)
    if r.status_code == 401:
        _sincronizar_cookies(sessao)
        r = sessao.post(CONFIRM_URL, params=params, timeout=30, verify=False)
    if r.status_code != 200:
        raise RuntimeError(f"HTTP {r.status_code}")


# ---------------------------------------------------------------- worker
def _progress(**patch: Any) -> None:
    with _lock:
        if _run is not None:
            _run.update(patch)


def _abrir_logs(codigo: int) -> tuple[Optional[TextIO], str, str]:
    """Cria logs/bcv_<codigo>_<ts>.log e devolve (ficheiro, log_path, resultados_path)."""
    try:
        os.makedirs(LOG_DIR, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_path = os.path.join(LOG_DIR, f"bcv_{codigo}_{ts}.log")
        resultados_path = os.path.join(LOG_DIR, f"resultados_{codigo}_{ts}.json")
        f = open(log_path, "w", encoding="utf-8")
        f.write(f"{'=' * 60}\nBCV - Fecho de Inconsistencias\nCodigo: {codigo}\n")
        f.write(f"Inicio: {datetime.now():%Y-%m-%d %H:%M:%S}\n{'=' * 60}\n\n")
        f.flush()
        return f, log_path, resultados_path
    except Exception:  # noqa: BLE001
        return None, "", ""


def _log(f: Optional[TextIO], msg: str, tipo: str = "INFO") -> None:
    linha = f"[{datetime.now():%H:%M:%S}] {tipo}: {msg}"
    print(linha)
    if f is not None:
        try:
            f.write(linha + "\n")
            f.flush()
        except Exception:  # noqa: BLE001
            pass


def _worker(params: RunParams) -> None:
    """Corre uma passagem completa. NÃO fecha o Chrome no fim — a janela fica
    aberta para o operador poder Repetir (mesmo código ou outro) ou Terminar."""
    sessao = _nova_sessao()
    processados = 0
    falhas = 0
    paginas_saltadas = 0
    ids_processados: list[Any] = []
    log_f, log_path, resultados_path = _abrir_logs(params.inconsistencyCode)
    _progress(ficheiroLog=os.path.abspath(log_path) if log_path else None)
    _log(log_f, f"Codigo {params.inconsistencyCode} | estado {params.inconsistencyState} | "
                f"pageSize {params.pageSize} | threads {params.maxThreads}")
    try:
        _sincronizar_cookies(sessao)
        primeira = _buscar_pagina(sessao, params.paginaInicial, params)
        if primeira is None:
            _log(log_f, "O CRC nao respondeu a pesquisa (sessao expirada?)", "ERRO")
            _progress(
                estado="erro",
                erro="O CRC não respondeu à pesquisa. Confirme o login no Chrome e clique em Repetir.",
                terminadoEm=time.time(),
            )
            return

        ctx = primeira.get("pageContext", {})
        total_registos = ctx.get("totalRecords", 0)
        page_size = ctx.get("pageSize", params.pageSize) or params.pageSize
        total_paginas = math.ceil(total_registos / page_size) if page_size else 0

        _progress(
            totalRegistos=total_registos,
            totalPaginas=total_paginas,
            paginaAtual=params.paginaInicial,
        )
        if total_registos == 0:
            _log(log_f, f"Codigo {params.inconsistencyCode}: nenhum registo encontrado", "AVISO")
        else:
            _log(log_f, f"{total_registos} registos em {total_paginas} paginas")

        for pagina in range(params.paginaInicial, total_paginas + 1):
            with _lock:
                if _run is None or _run.get("cancelar"):
                    _log(log_f, "Cancelado pelo operador", "AVISO")
                    _progress(estado="parado", terminadoEm=time.time())
                    _escrever_resultados(resultados_path, params, processados, ids_processados, log_f)
                    return
            _progress(paginaAtual=pagina)
            _log(log_f, f"Pagina {pagina}/{total_paginas}")
            _sincronizar_cookies(sessao)

            dados = primeira if pagina == params.paginaInicial else _buscar_pagina(
                sessao, pagina, params
            )
            if dados is None:
                paginas_saltadas += 1
                _log(log_f, f"Pagina {pagina} sem resposta OK do CRC - saltada", "AVISO")
                continue
            items = dados.get("items", [])

            with ThreadPoolExecutor(max_workers=max(1, params.maxThreads)) as ex:
                futures = {
                    ex.submit(_confirmar, sessao, it.get("inconsistencyId"), params.motivo): it
                    for it in items
                    if it.get("inconsistencyId")
                }
                for fut in as_completed(futures):
                    it = futures[fut]
                    try:
                        fut.result()
                        processados += 1
                        ids_processados.append(it.get("inconsistencyId"))
                    except Exception as exc:  # noqa: BLE001
                        falhas += 1
                        _log(log_f, f"ID {it.get('inconsistencyId')}: {exc}", "ERRO")
                    _progress(processados=processados, falhas=falhas)

            if pagina < total_paginas and PAUSA_PAGINA > 0:
                time.sleep(PAUSA_PAGINA)

        extra = f", {paginas_saltadas} paginas saltadas" if paginas_saltadas else ""
        _log(log_f, f"RESUMO: {processados} processados, {falhas} falhas de {total_registos}{extra}")
        _escrever_resultados(resultados_path, params, processados, ids_processados, log_f)
        _progress(
            estado="concluido",
            paginasSaltadas=paginas_saltadas,
            terminadoEm=time.time(),
        )
    except Exception as exc:  # noqa: BLE001
        _log(log_f, f"Erro geral: {exc}", "ERRO")
        _escrever_resultados(resultados_path, params, processados, ids_processados, log_f)
        _progress(estado="erro", erro=str(exc), terminadoEm=time.time())
    finally:
        if log_f is not None:
            try:
                log_f.close()
            except Exception:  # noqa: BLE001
                pass


def _escrever_resultados(
    path: str,
    params: "RunParams",
    processados: int,
    ids: list[Any],
    log_f: Optional[TextIO],
) -> None:
    if not path or not ids:
        return
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "codigo": params.inconsistencyCode,
                    "timestamp": datetime.now().isoformat(),
                    "total_processados": processados,
                    "ids": ids,
                },
                f,
                indent=2,
                ensure_ascii=False,
            )
        _log(log_f, f"IDs guardados em {os.path.abspath(path)}")
    except Exception as exc:  # noqa: BLE001
        _log(log_f, f"Nao foi possivel guardar resultados: {exc}", "ERRO")


# ---------------------------------------------------------------- API
app = FastAPI(title="CRC — Fecho de Inconsistências", version=VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _snapshot() -> dict[str, Any]:
    with _lock:
        return dict(_run) if _run else {}


@app.get("/health")
def health() -> dict[str, Any]:
    snap = _snapshot()
    return {"ok": True, "version": VERSION, "runId": snap.get("id"), "estado": snap.get("estado")}


@app.post("/runs")
def criar_run(params: RunParams) -> dict[str, Any]:
    global _driver, _run
    with _lock:
        if _run is not None:
            raise HTTPException(
                409, "Já existe uma sessão aberta. Use Repetir ou Terminar."
            )
    try:
        _driver = _abrir_chrome()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(500, f"Não foi possível abrir o Chrome: {exc}") from exc

    run = {
        "id": uuid.uuid4().hex,
        "estado": "aguarda_login",
        "parametros": params.model_dump(),
        "totalRegistos": 0,
        "totalPaginas": 0,
        "paginaAtual": 0,
        "processados": 0,
        "falhas": 0,
        "passagens": 0,
        "erro": None,
        "ficheiroLog": None,
        "paginasSaltadas": 0,
        "cancelar": False,
        "iniciadoEm": time.time(),
        "terminadoEm": None,
    }
    with _lock:
        _run = run
    return run


def _arrancar_worker(params: RunParams) -> None:
    with _lock:
        _run.update(
            estado="a_processar",
            parametros=params.model_dump(),
            cancelar=False,
            erro=None,
            processados=0,
            falhas=0,
            paginaAtual=0,
            totalRegistos=0,
            totalPaginas=0,
            ficheiroLog=None,
            paginasSaltadas=0,
            terminadoEm=None,
            passagens=_run.get("passagens", 0) + 1,
        )
    threading.Thread(target=_worker, args=(params,), daemon=True).start()


@app.post("/runs/{run_id}/login-feito")
def login_feito(run_id: str, params: RunParams) -> dict[str, Any]:
    """O operador já fez login e escolheu o código no CRC. Os `params` (com o
    código de inconsistência) são enviados só agora — depois do login."""
    with _lock:
        if _run is None or _run["id"] != run_id:
            raise HTTPException(404, "Execução não encontrada.")
        if _run["estado"] != "aguarda_login":
            raise HTTPException(409, f"Estado inválido: {_run['estado']}")
    _arrancar_worker(params)
    return _snapshot()


@app.post("/runs/{run_id}/repetir")
def repetir_run(run_id: str, params: RunParams) -> dict[str, Any]:
    """Nova passagem sem fechar o Chrome. O operador pode ter mudado o código
    de inconsistência (nos `params`) ou ajustado a pesquisa no CRC."""
    with _lock:
        if _run is None or _run["id"] != run_id:
            raise HTTPException(404, "Execução não encontrada.")
        if _run["estado"] not in ("concluido", "parado", "erro"):
            raise HTTPException(409, f"Estado inválido: {_run['estado']}")
        if _driver is None:
            raise HTTPException(409, "A janela do Chrome já foi fechada. Inicie de novo.")
    _arrancar_worker(params)
    return _snapshot()


@app.get("/runs/{run_id}")
def estado_run(run_id: str) -> dict[str, Any]:
    snap = _snapshot()
    if not snap or snap.get("id") != run_id:
        raise HTTPException(404, "Execução não encontrada.")
    return snap


@app.post("/runs/{run_id}/parar")
def parar_run(run_id: str) -> dict[str, Any]:
    """Cancela a passagem a decorrer. O Chrome fica aberto (Repetir/Terminar)."""
    with _lock:
        if _run is None or _run["id"] != run_id:
            raise HTTPException(404, "Execução não encontrada.")
        _run["cancelar"] = True
        if _run["estado"] == "aguarda_login":
            _run["estado"] = "parado"
            _run["terminadoEm"] = time.time()
    return _snapshot()


@app.post("/runs/{run_id}/terminar")
def terminar_run(run_id: str) -> dict[str, Any]:
    """Fecha o Chrome e limpa a sessão."""
    global _run
    with _lock:
        if _run is None or _run["id"] != run_id:
            raise HTTPException(404, "Execução não encontrada.")
        _run["cancelar"] = True
    _fechar_chrome()
    with _lock:
        _run = None
    return {"ok": True}


if __name__ == "__main__":
    import uvicorn

    print(f"CRC — Fecho de Inconsistências  ·  http://localhost:{PORT}")
    print(f"Origens permitidas: {', '.join(ALLOW_ORIGINS)}")
    uvicorn.run(app, host="127.0.0.1", port=PORT)
