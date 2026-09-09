"""
Serviço local — Fecho de inconsistências do CRC.

Faz o que o script de terminal fazia, mas exposto por HTTP para a página
"CRC" da aplicação SCI: abre o Chrome para o login manual, sincroniza os
cookies e corre o ciclo de confirmação paginado, publicando o progresso.

Fluxo:
    POST /runs                -> abre o Chrome, fica em "aguarda_login"
    (o operador faz login no CRC e abre a pesquisa correta)
    POST /runs/{id}/login-feito -> sincroniza cookies e arranca o processamento
    GET  /runs/{id}            -> progresso (polling)
    POST /runs/{id}/parar      -> cancela

Só existe uma execução de cada vez (um operador, uma sessão do CRC).

Config por variáveis de ambiente (ver README.md).
"""
from __future__ import annotations

import math
import os
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Optional

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

# Parâmetros da pesquisa que não mudam entre execuções (mantidos do script).
PARAMS_FIXOS = {
    "ctxObserved": int(os.getenv("CRC_CTX_OBSERVED", "3")),
    "ctxReported": int(os.getenv("CRC_CTX_REPORTED", "3")),
    "inconsistencyCode": int(os.getenv("CRC_INCONSISTENCY_CODE", "51269")),
    "inconsistencyState": int(os.getenv("CRC_INCONSISTENCY_STATE", "225")),
    "orderBy": "date",
    "orderType": "DESC",
    "participantId": int(os.getenv("CRC_PARTICIPANT_ID", "3")),
    "representantId": int(os.getenv("CRC_REPRESENTANT_ID", "3")),
}

VERSION = "1.0.0"

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


def _buscar_pagina(sessao: requests.Session, page_num: int, page_size: int) -> dict:
    params = dict(PARAMS_FIXOS, pageSize=page_size, page=page_num)
    r = sessao.get(SEARCH_URL, params=params, timeout=30, verify=False)
    if r.status_code == 401:
        _sincronizar_cookies(sessao)
        r = sessao.get(SEARCH_URL, params=params, timeout=30, verify=False)
    r.raise_for_status()
    return r.json()


def _confirmar(sessao: requests.Session, inconsistency_id: Any, motivo: str) -> int:
    params = {"confirmationReason": motivo, "inconsistencyId": inconsistency_id}
    r = sessao.post(CONFIRM_URL, params=params, timeout=30, verify=False)
    if r.status_code == 401:
        _sincronizar_cookies(sessao)
        r = sessao.post(CONFIRM_URL, params=params, timeout=30, verify=False)
    r.raise_for_status()
    return r.status_code


# ---------------------------------------------------------------- worker
def _progress(**patch: Any) -> None:
    with _lock:
        if _run is not None:
            _run.update(patch)


def _worker(params: RunParams) -> None:
    sessao = _nova_sessao()
    processados = 0
    falhas = 0
    try:
        _sincronizar_cookies(sessao)
        primeira = _buscar_pagina(sessao, params.paginaInicial, params.pageSize)
        ctx = primeira.get("pageContext", {})
        total_registos = ctx.get("totalRecords", 0)
        page_size = ctx.get("pageSize", params.pageSize) or params.pageSize
        total_paginas = math.ceil(total_registos / page_size) if page_size else 0

        _progress(
            totalRegistos=total_registos,
            totalPaginas=total_paginas,
            paginaAtual=params.paginaInicial,
        )

        for pagina in range(params.paginaInicial, total_paginas + 1):
            with _lock:
                if _run is None or _run.get("cancelar"):
                    _progress(estado="parado")
                    return
            _progress(paginaAtual=pagina)
            _sincronizar_cookies(sessao)

            dados = primeira if pagina == params.paginaInicial else _buscar_pagina(
                sessao, pagina, params.pageSize
            )
            items = dados.get("items", [])

            with ThreadPoolExecutor(max_workers=max(1, params.maxThreads)) as ex:
                futures = {
                    ex.submit(_confirmar, sessao, it.get("inconsistencyId"), params.motivo): it
                    for it in items
                    if it.get("inconsistencyId")
                }
                for fut in as_completed(futures):
                    try:
                        fut.result()
                        processados += 1
                    except Exception:
                        falhas += 1
                    _progress(processados=processados, falhas=falhas)

        _progress(estado="concluido", terminadoEm=time.time())
    except Exception as exc:  # noqa: BLE001
        _progress(estado="erro", erro=str(exc), terminadoEm=time.time())
    finally:
        _fechar_chrome()


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
        if _run is not None and _run["estado"] in ("aguarda_login", "a_processar"):
            raise HTTPException(409, "Já existe uma execução em curso.")
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
        "erro": None,
        "cancelar": False,
        "iniciadoEm": time.time(),
        "terminadoEm": None,
    }
    with _lock:
        _run = run
    return run


@app.post("/runs/{run_id}/login-feito")
def login_feito(run_id: str) -> dict[str, Any]:
    with _lock:
        if _run is None or _run["id"] != run_id:
            raise HTTPException(404, "Execução não encontrada.")
        if _run["estado"] != "aguarda_login":
            raise HTTPException(409, f"Estado inválido: {_run['estado']}")
        _run["estado"] = "a_processar"
        params = RunParams(**_run["parametros"])
    threading.Thread(target=_worker, args=(params,), daemon=True).start()
    return _snapshot()


@app.get("/runs/{run_id}")
def estado_run(run_id: str) -> dict[str, Any]:
    snap = _snapshot()
    if not snap or snap.get("id") != run_id:
        raise HTTPException(404, "Execução não encontrada.")
    return snap


@app.post("/runs/{run_id}/parar")
def parar_run(run_id: str) -> dict[str, Any]:
    with _lock:
        if _run is None or _run["id"] != run_id:
            raise HTTPException(404, "Execução não encontrada.")
        _run["cancelar"] = True
        if _run["estado"] == "aguarda_login":
            _run["estado"] = "parado"
            _run["terminadoEm"] = time.time()
            fechar = True
        else:
            fechar = False
    if fechar:
        _fechar_chrome()
    return _snapshot()


if __name__ == "__main__":
    import uvicorn

    print(f"CRC — Fecho de Inconsistências  ·  http://localhost:{PORT}")
    print(f"Origens permitidas: {', '.join(ALLOW_ORIGINS)}")
    uvicorn.run(app, host="127.0.0.1", port=PORT)
