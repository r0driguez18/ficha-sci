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

1. Copia a pasta `tools/worker-aplicacoes` para o PC (ex.: `C:\worker-aplicacoes`).
2. Abre a pasta numa linha de comandos e instala as dependências:

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
schtasks /Create /SC ONLOGON /TN "Worker Aplicacoes" /TR "C:\worker-aplicacoes\venv\Scripts\pythonw.exe C:\worker-aplicacoes\worker.py" /F
```

O registo fica em `worker.log` (ao lado do `worker.py`). O PC tem de estar ligado e com sessão iniciada; para não depender
de um PC, o mesmo worker passa para o servidor (precisa do driver ODBC do IBM i para Linux e de chegar ao core).

## `.env`

| Variável | O quê |
| --- | --- |
| `SUPABASE_URL` | Endereço da API da app, sem barra no fim |
| `SUPABASE_ANON_KEY` | A chave `anon` (a mesma `VITE_SUPABASE_PUBLISHABLE_KEY` da app; não é secreta) |
| `WORKER_TOKEN` | O token do passo 4 |
| `CORE_SISTEMA`, `CORE_UTILIZADOR`, `CORE_SENHA` | Ligação ao core |
| `CORE_QUERY` | Opcional; por omissão `SELECT * from GBANCA0003.GBAPL` |
| `CA_BUNDLE` | Opcional: `.pem` da empresa, se o servidor usa certificado interno |

## Se algo falhar

- A ficha diz **«O worker não respondeu»**: o worker não está a correr (ou não chega à app). Vê o `worker.log`.
- A ficha mostra **«Falhou a leitura do core: …»**: o worker correu mas o ODBC falhou (rede, palavra-passe, driver).
- Sem worker, dá sempre para correr o script antigo e usar **«Carregar Excel»** na ficha.
