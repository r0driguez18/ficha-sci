# Worker das «Aplicações do dia»

Pequeno programa que corre num computador com acesso ao core bancário. Na ficha há o botão **«Gerar aplicações do dia»**:
quando alguém carrega, a app regista um pedido; este worker vê-o em poucos segundos, corre a query no core e entrega o
resultado. A app guarda-o, mostra as operações e dá o Excel para descarregar. Já não é preciso abrir o VS Code.

```
ficha (botão) ──pedido──► base de dados ◄──pergunta de 3 em 3 s── worker (PC com o driver) ──ODBC──► core
                                ▲                                         │
                                └──────────────── entrega as linhas ──────┘
```

O worker **não tem conta nem chave de serviço**: só pode chamar duas funções (`worker_reclamar_pedido` e
`worker_entregar_aplicacoes`), com um token próprio. A palavra-passe do core fica só neste computador, no `.env`.

## Instalar no PC (uma vez)

Requisitos: Windows com o **iSeries Access ODBC Driver** (o mesmo que o script antigo usa) e Python 3.10+.

1. A pasta já vem com o projeto. No PC do core, no clone do projeto (ex.: `C:\fichas\ficha-sci`), atualiza e entra nela:

   ```bat
   cd C:\fichas\ficha-sci
   git pull
   cd tools\worker-aplicacoes
   ```

2. Nessa pasta, instala as dependências:

   ```bat
   python -m venv venv
   venv\Scripts\pip install -r requirements.txt
   ```

3. Copia `.env.example` para `.env` e preenche (ver abaixo). O `.env` nunca vai para o git.
4. Cria o **token** do worker (só um administrador). Na base de dados:

   ```sql
   select criar_token_worker('PC do cabo');
   ```

   Aparece **uma só vez**: copia-o para `WORKER_TOKEN` no `.env`. A base só guarda o hash. Para revogar:
   `update worker_tokens set ativo = false where nome = 'PC do cabo';`
5. Testa sem core (com um Excel que o script antigo gerou), com a app aberta e o botão carregado:

   ```bat
   venv\Scripts\python worker.py --uma-vez --simular C:\caminho\Aplicacoes.xlsx
   ```

6. Testa com o core real: `venv\Scripts\python worker.py --uma-vez` (depois de carregar o botão na ficha).

## Pôr a arrancar sozinho

Para correr sempre que o PC arranca a sessão, sem janela:

```bat
schtasks /Create /SC ONLOGON /TN "Worker Aplicacoes" /TR "C:\fichas\ficha-sci\tools\worker-aplicacoes\venv\Scripts\pythonw.exe C:\fichas\ficha-sci\tools\worker-aplicacoes\worker.py" /F
```

O registo fica em `worker.log`, ao lado do `worker.py` (ex.: `C:\fichas\ficha-sci\tools\worker-aplicacoes\worker.log`), no PC onde o worker corre — não no servidor. O PC tem de estar ligado e com sessão iniciada; para não depender
de um PC, o mesmo worker passa para o servidor (precisa do driver ODBC do IBM i para Linux e de chegar ao core).

## Ver que dias tem a tabela do core

Diagnóstico só de leitura (não entrega nada à app): mostra os dias (`ACDTIN`) que a tabela do core tem e quantos registos cada um.

```bat
venv\Scripts\python worker.py --datas
```

## `.env`

| Variável | O quê |
| --- | --- |
| `SUPABASE_URL` | Endereço da API da app, sem barra no fim |
| `SUPABASE_ANON_KEY` | A chave `anon` (a mesma `VITE_SUPABASE_PUBLISHABLE_KEY` da app; não é secreta) |
| `WORKER_TOKEN` | O token do passo 4 |
| `CORE_SISTEMA`, `CORE_UTILIZADOR`, `CORE_SENHA` | Ligação ao core |
| `CORE_QUERY` | Opcional. Por omissão o worker pede ao core as linhas da data da ficha e do dia seguinte (`... WHERE ACDTIN IN (AAAAMMDD, AAAAMMDD)`), porque a ficha cobre das 07:00 de D às 07:00 de D+1. Se o definires, corre-se essa query tal e qual, sem filtrar por data |
| `CA_BUNDLE` | Opcional: `.pem` da empresa, se o servidor usa certificado interno (com o IP/nome no certificado) |
| `SERVER_CERT_SHA256` | Opcional: impressão digital SHA-256 do certificado do servidor, para certificados autoassinados só com `CN=IP` (erro `IP address mismatch`). Só aceita esse certificado exato. Calcula-a assim, na pasta do worker: `venv\Scripts\python -c "import ssl,hashlib; print(hashlib.sha256(ssl.PEM_cert_to_DER_cert(ssl.get_server_certificate(('IP_DO_SERVIDOR',8443)))).hexdigest())"` |

## Se algo falhar

- A ficha diz **«O worker não respondeu»**: o worker não está a correr (ou não chega à app). Vê o `worker.log`.
- A ficha mostra **«Falhou a leitura do core: …»**: o worker correu mas o ODBC falhou (rede, palavra-passe, driver).
- Sem worker, dá sempre para correr o script antigo e usar **«Carregar Excel»** na ficha.
