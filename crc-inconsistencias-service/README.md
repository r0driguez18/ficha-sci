# CRC — Fecho de Inconsistências (serviço local)

Serviço HTTP local que executa o fecho de inconsistências do CRC (o que antes
era um script de terminal) e é comandado pela página **CRC** da aplicação SCI:
arranque, progresso ao vivo, paragem e histórico.

Corre na máquina onde se faz o tratamento do CRC. O login no CRC pode ser de
duas formas:

- **Manual (omissão):** abre o Chrome para o operador fazer login à vista;
  a partir daí sincroniza os cookies e confirma as inconsistências em
  paralelo, exatamente como o script original. No fim de cada passagem o
  Chrome **fica aberto**: pode-se **Repetir** (com o mesmo código de
  inconsistência ou outro — o código é um campo na página) ou **Terminar**
  (fecha o Chrome).
- **Automático (`CRC_USERNAME` + `CRC_PASSWORD` definidos):** login por
  pedido HTTP direto, sem abrir nenhum browser — o serviço lê a página de
  login, apanha o token anti-falsificação e submete as credenciais, tal como
  o browser faria. Mais rápido a arrancar e não precisa de Chrome/chromedriver
  de todo. Usa as **credenciais do operador no CRC**: cada um define as suas
  próprias, nunca partilhadas.

## Requisitos

- Python 3.10+
- Com login **automático** (recomendado): só o Python e a dependência
  `requests` (já em `requirements.txt`) — sem Chrome nem chromedriver.
- Com login **manual**:
  - Google Chrome instalado (por omissão em
    `C:\Program Files\Google\Chrome\Application\chrome.exe`)
  - `chromedriver` — por omissão **não é preciso instalar nem atualizar à
    mão**: o Selenium (4.6+) resolve e guarda em cache sozinho a versão certa
    para o Chrome instalado, da primeira vez que o serviço arranca depois de
    cada atualização do Chrome (precisa de internet nessa máquina nesse
    momento). Numa máquina sem internet, define `CRC_CHROMEDRIVER` com um
    caminho fixo (ver tabela de configuração) e atualiza-o à mão quando o
    Chrome mudar.

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
| `CRC_USERNAME` | *(vazio — login manual)* | Utilizador do CRC para login automático (junto com `CRC_PASSWORD`, liga as duas) |
| `CRC_PASSWORD` | *(vazio — login manual)* | Password do CRC para login automático. **Cada operador define a sua própria, nesta máquina; nunca partilhada nem no código.** |
| `CRC_CHROMEDRIVER` | *(vazio — Selenium escolhe sozinho)* | Só interessa em login manual. Opcional: fixa um chromedriver específico, só precisa numa máquina sem internet |
| `CRC_CHROME` | `C:\Program Files\Google\Chrome\Application\chrome.exe` | Caminho do Chrome |
| `CRC_INCONSISTENCY_CODE` | `51269` | Valor **por omissão** do código (editável na página a cada passagem) |
| `CRC_INCONSISTENCY_STATE` | `225` | Valor **por omissão** do estado (editável na página) |
| `CRC_PARTICIPANT_ID` / `CRC_REPRESENTANT_ID` / `CRC_CTX_OBSERVED` / `CRC_CTX_REPORTED` | `3` | Filtros da pesquisa |
| `CRC_LOG_DIR` | `logs` | Pasta dos logs por passagem (`bcv_<codigo>_<ts>.log` + `resultados_<codigo>_<ts>.json`) |
| `CRC_PAUSA_PAGINA` | `1` | Pausa em segundos entre páginas |

Exemplo (`run.bat`), login manual:

```bat
set CRC_ALLOW_ORIGINS=https://sci.bcv.local
set CRC_SERVICE_PORT=8765
crc-inconsistencias.exe
```

Exemplo (`run.bat`), login automático — cada operador com o seu, nunca
partilhado nem commitado:

```bat
set CRC_ALLOW_ORIGINS=https://sci.bcv.local
set CRC_USERNAME=nalves
set CRC_PASSWORD=a-tua-password-do-crc
crc-inconsistencias.exe
```

## API (usada pela SCI)

| Método | Rota | Efeito |
|---|---|---|
| `GET` | `/health` | Serviço vivo + execução atual |
| `POST` | `/runs` | Login manual: abre o Chrome, fica em `aguarda_login`. Login automático: autentica por HTTP e já arranca a 1.ª passagem (`a_processar`) |
| `POST` | `/runs/{id}/login-feito` | Só no login manual — sincroniza cookies e arranca a 1.ª passagem |
| `GET` | `/runs/{id}` | Progresso (polling) |
| `POST` | `/runs/{id}/parar` | Cancela a passagem a decorrer (sessão/Chrome fica aberta) |
| `POST` | `/runs/{id}/repetir` | Nova passagem (novo `RunParams` no corpo) sem repetir o login |
| `POST` | `/runs/{id}/terminar` | Fecha o Chrome (ou a sessão automática) e limpa a execução |

Estados: `aguarda_login` → `a_processar` → `concluido` \| `parado` \| `erro`
(no login automático começa logo em `a_processar`, sem passar por
`aguarda_login`). De `concluido`/`parado`/`erro` volta-se a `a_processar`
com `repetir`. Um 401 a meio de uma passagem tenta renovar a sessão uma vez
sozinho (repetir o login automático, ou reler os cookies do Chrome) antes de
desistir dessa página/confirmação. Só há uma sessão de cada vez — para
começar do zero, `terminar` primeiro.
