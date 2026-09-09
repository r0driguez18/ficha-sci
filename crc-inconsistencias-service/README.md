# CRC — Fecho de Inconsistências (serviço local)

Serviço HTTP local que executa o fecho de inconsistências do CRC (o que antes
era um script de terminal) e é comandado pela página **CRC** da aplicação SCI:
arranque, progresso ao vivo, paragem e histórico.

Corre na máquina onde se faz o tratamento do CRC. Abre o Chrome para o
**login manual** no CRC; a partir daí sincroniza os cookies e confirma as
inconsistências em paralelo, exatamente como o script original.

No fim de cada passagem o Chrome **fica aberto**: pode-se **Repetir** (com o
mesmo código de inconsistência ou outro — o código é um campo na página) ou
**Terminar** (fecha o Chrome).

## Requisitos

- Python 3.10+
- Google Chrome + `chromedriver` compatível
  - por omissão procura em `C:\WebDriver\chromedriver-win64\chromedriver.exe`
    e `C:\Program Files\Google\Chrome\Application\chrome.exe`

## Correr em desenvolvimento

```bat
cd crc-inconsistencias-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Fica em `http://localhost:8765`. Deixa esta janela aberta enquanto usas a
página CRC da SCI.

## Gerar o executável (.exe) para distribuir

```bat
pip install pyinstaller
pyinstaller --onefile --name crc-inconsistencias main.py
```

O `.exe` fica em `dist\crc-inconsistencias.exe`. Copia-o para a máquina do
operador; basta fazer duplo-clique (mantém a janela aberta).

## Configuração (variáveis de ambiente)

| Variável | Omissão | Descrição |
|---|---|---|
| `CRC_SERVICE_PORT` | `8765` | Porta local |
| `CRC_ALLOW_ORIGINS` | `http://localhost:8080,http://localhost:5173,http://localhost:4173` | Origens da SCI autorizadas (CORS). **Acrescentar aqui o endereço de produção da SCI.** |
| `CRC_BASE` | `https://bcvnet/CRCFRONTOFFICE` | Base do CRC |
| `CRC_CHROMEDRIVER` | `C:\WebDriver\chromedriver-win64\chromedriver.exe` | Caminho do chromedriver |
| `CRC_CHROME` | `C:\Program Files\Google\Chrome\Application\chrome.exe` | Caminho do Chrome |
| `CRC_INCONSISTENCY_CODE` | `51269` | Valor **por omissão** do código (editável na página a cada passagem) |
| `CRC_INCONSISTENCY_STATE` | `225` | Valor **por omissão** do estado (editável na página) |
| `CRC_PARTICIPANT_ID` / `CRC_REPRESENTANT_ID` / `CRC_CTX_OBSERVED` / `CRC_CTX_REPORTED` | `3` | Filtros da pesquisa |
| `CRC_LOG_DIR` | `logs` | Pasta dos logs por passagem (`bcv_<codigo>_<ts>.log` + `resultados_<codigo>_<ts>.json`) |
| `CRC_PAUSA_PAGINA` | `1` | Pausa em segundos entre páginas |

Exemplo (`run.bat`):

```bat
set CRC_ALLOW_ORIGINS=https://sci.bcv.local
set CRC_SERVICE_PORT=8765
crc-inconsistencias.exe
```

## API (usada pela SCI)

| Método | Rota | Efeito |
|---|---|---|
| `GET` | `/health` | Serviço vivo + execução atual |
| `POST` | `/runs` | Abre o Chrome; fica em `aguarda_login` |
| `POST` | `/runs/{id}/login-feito` | Sincroniza cookies e arranca a 1.ª passagem |
| `GET` | `/runs/{id}` | Progresso (polling) |
| `POST` | `/runs/{id}/parar` | Cancela a passagem a decorrer (Chrome fica aberto) |
| `POST` | `/runs/{id}/repetir` | Nova passagem (novo `RunParams` no corpo) sem fechar o Chrome |
| `POST` | `/runs/{id}/terminar` | Fecha o Chrome e limpa a sessão |

Estados: `aguarda_login` → `a_processar` → `concluido` \| `parado` \| `erro`.
De `concluido`/`parado`/`erro` volta-se a `a_processar` com `repetir`.
Só há uma sessão de cada vez — para começar do zero, `terminar` primeiro.
