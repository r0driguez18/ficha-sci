# 🚀 Guia de Deployment para Produção — BCA SCI

Este guia cobre todo o processo de colocar a aplicação em produção num servidor Windows interno do banco, incluindo Frontend, Supabase (Docker), Edge Functions e configurações de segurança.

---

## 📋 Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Supabase Self-Hosted (Docker)](#2-supabase-self-hosted-docker)
3. [Base de Dados — Migrações](#3-base-de-dados--migrações)
4. [Edge Functions](#4-edge-functions)
5. [Frontend — Build de Produção](#5-frontend--build-de-produção)
6. [Servidor Web (IIS / NGINX)](#6-servidor-web-iis--nginx)
7. [Variáveis de Ambiente e Secrets](#7-variáveis-de-ambiente-e-secrets)
8. [Backups e Manutenção](#8-backups-e-manutenção)
9. [Verificação Final](#9-verificação-final)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Pré-requisitos

| Software | Versão Mínima | Link |
|---|---|---|
| Docker Desktop (Windows) | 4.x+ | https://www.docker.com/products/docker-desktop |
| Git | 2.x+ | https://git-scm.com/download/win |
| Node.js | 18.x+ | https://nodejs.org/ |
| Supabase CLI | Latest | `npm install -g supabase` |
| Bun (opcional, build mais rápido) | Latest | https://bun.sh/ |

**Requisitos de Sistema:**
- Windows Server 2019+ ou Windows 10/11 Pro
- WSL 2 ativo (para Docker)
- Mínimo 8GB RAM, 4 cores CPU
- 50GB disco livre

---

## 2. Supabase Self-Hosted (Docker)

### 2.1 Clonar e Configurar

```powershell
cd C:\Producao
git clone --depth 1 https://github.com/supabase/supabase
cd supabase\docker
copy .env.example .env
```

### 2.2 Editar `.env`

Edite o ficheiro `C:\Producao\supabase\docker\.env`:

```env
# IP do servidor na rede interna
SUPABASE_PUBLIC_URL=http://192.168.X.X:8000

# Portas
STUDIO_PORT=3000
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

# Credenciais seguras (GERAR NOVAS!)
POSTGRES_PASSWORD=<senha_forte_gerada>
JWT_SECRET=<jwt_secret_gerado>
ANON_KEY=<anon_key_gerada>
SERVICE_ROLE_KEY=<service_role_key_gerada>

# Dashboard
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=<senha_forte_dashboard>
```

> ⚠️ **NUNCA use as chaves de desenvolvimento em produção.** Use o script `gerar-chaves.js` do `GUIA_WINDOWS_SUPABASE_DOCKER.md` para gerar novas chaves.

### 2.3 Iniciar Supabase

```powershell
cd C:\Producao\supabase\docker
docker-compose up -d
```

Verificar que todos os containers estão saudáveis:

```powershell
docker-compose ps
```

---

## 3. Base de Dados — Migrações

### 3.1 Aplicar Schema

As migrações estão consolidadas na pasta `supabase/migrations/`. Use o Supabase CLI:

```powershell
cd C:\Producao\ficha-sci

# Configurar ligação ao Supabase local de produção
# Editar supabase/config.toml se necessário

supabase db reset
```

Ou, para aplicar manualmente via SQL Editor (http://localhost:3000):

1. Abra o Supabase Studio → SQL Editor
2. Cole o conteúdo do ficheiro de migração consolidado
3. Execute

### 3.2 Verificar Tabelas

Confirme que as seguintes tabelas existem:
- `file_processes`
- `daily_alerts`
- `taskboard_data`
- `exported_taskboards`
- `cobrancas_retornos`

E que as políticas RLS estão ativas em todas.

---

## 4. Edge Functions

### 4.1 Estrutura

As Edge Functions estão em `supabase/functions/`:

```
supabase/functions/
└── telegram-notify/
    └── index.ts
```

### 4.2 Configurar Secrets

As Edge Functions precisam de secrets configurados. Crie o ficheiro `.env.local` (NÃO comitar):

```env
TELEGRAM_BOT_TOKEN=<seu_bot_token>
TELEGRAM_CHAT_ID=<seu_chat_id>
SUPABASE_URL=http://192.168.X.X:8000
SUPABASE_ANON_KEY=<anon_key_producao>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key_producao>
```

### 4.3 Deploy via CLI

```powershell
# Servir localmente para teste
supabase functions serve --env-file .env.local

# Deploy para o Supabase self-hosted
supabase functions deploy telegram-notify --env-file .env.local
```

> ⚠️ Edge Functions **não podem** ser criadas/editadas pelo Studio GUI. Devem ser geridas exclusivamente via CLI.

### 4.4 Verificar config.toml

Certifique-se que `supabase/config.toml` tem a configuração correta:

```toml
[functions.telegram-notify]
verify_jwt = false
```

---

## 5. Frontend — Build de Produção

### 5.1 Configurar Variáveis

Edite `src/integrations/supabase/client.ts`:

```typescript
const SUPABASE_URL = "http://192.168.X.X:8000";
const SUPABASE_PUBLISHABLE_KEY = "<anon_key_producao>";
```

### 5.2 Build

```powershell
cd C:\Producao\ficha-sci

# Instalar dependências
npm install
# ou
bun install

# Build de produção
npm run build
# ou
bun run build
```

O output fica na pasta `dist/`.

### 5.3 Testar Build Localmente

```powershell
npx serve dist
```

Aceda a `http://localhost:3000` para verificar.

---

## 6. Servidor Web (IIS / NGINX)

### Opção A: IIS (Windows nativo)

1. **Instalar IIS** via "Funcionalidades do Windows"
2. **Criar Site:**
   - Abra o IIS Manager
   - Clique direito em "Sites" → "Adicionar Website"
   - Nome: `BCA-SCI`
   - Caminho físico: `C:\Producao\ficha-sci\dist`
   - Porta: `80` (ou `443` com certificado)

3. **Configurar URL Rewrite** (necessário para React Router):
   
   Crie `web.config` na pasta `dist/`:

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <configuration>
     <system.webServer>
       <rewrite>
         <rules>
           <rule name="React Routes" stopProcessing="true">
             <match url=".*" />
             <conditions logicalGrouping="MatchAll">
               <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
               <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
             </conditions>
             <action type="Rewrite" url="/" />
           </rule>
         </rules>
       </rewrite>
     </system.webServer>
   </configuration>
   ```

### Opção B: NGINX (via Docker ou Windows)

Ficheiro `nginx.conf`:

```nginx
server {
    listen 80;
    server_name 192.168.X.X;
    root C:/Producao/ficha-sci/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy reverso para Supabase API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 7. Variáveis de Ambiente e Secrets

### Resumo de Secrets Necessários

| Secret | Onde é usado | Como configurar |
|---|---|---|
| `POSTGRES_PASSWORD` | Docker `.env` | Ficheiro `.env` do Docker |
| `JWT_SECRET` | Docker `.env` | Ficheiro `.env` do Docker |
| `ANON_KEY` | Docker `.env` + Frontend | Docker `.env` + `client.ts` |
| `SERVICE_ROLE_KEY` | Docker `.env` + Edge Functions | Docker `.env` + `.env.local` |
| `TELEGRAM_BOT_TOKEN` | Edge Functions | `.env.local` (CLI) |
| `TELEGRAM_CHAT_ID` | Edge Functions | `.env.local` (CLI) |

> 🔒 **NUNCA** comitar ficheiros `.env` ou `.env.local` no Git. Estão no `.gitignore`.

---

## 8. Backups e Manutenção

### 8.1 Backup da Base de Dados

```powershell
# Backup completo
docker exec -t supabase-db pg_dumpall -c -U postgres > backup_$(Get-Date -Format 'yyyyMMdd').sql

# Restaurar
Get-Content backup.sql | docker exec -i supabase-db psql -U postgres
```

### 8.2 Agendar Backups Automáticos

Crie uma Tarefa Agendada no Windows:

```powershell
# Script: C:\Producao\scripts\backup.ps1
$date = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupDir = "C:\Producao\backups"
New-Item -ItemType Directory -Force -Path $backupDir
docker exec -t supabase-db pg_dumpall -c -U postgres | Out-File "$backupDir\backup_$date.sql" -Encoding UTF8

# Limpar backups com mais de 30 dias
Get-ChildItem "$backupDir\*.sql" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item
```

### 8.3 Atualizar a Aplicação

```powershell
cd C:\Producao\ficha-sci
git pull origin main
npm install
npm run build
# Copiar dist/ para o diretório do IIS/NGINX se necessário
```

### 8.4 Atualizar Supabase Docker

```powershell
cd C:\Producao\supabase\docker
docker-compose pull
docker-compose up -d
```

---

## 9. Verificação Final

### Checklist de Produção

- [ ] Docker Desktop a correr e containers saudáveis
- [ ] Supabase Studio acessível em `http://IP:3000`
- [ ] API Supabase acessível em `http://IP:8000`
- [ ] Tabelas criadas com RLS ativo
- [ ] Edge Functions deployadas e a funcionar
- [ ] Frontend build sem erros
- [ ] Servidor web a servir a aplicação
- [ ] React Router a funcionar (URL rewrite configurado)
- [ ] Autenticação a funcionar (login/logout)
- [ ] Taskboards a guardar e carregar dados
- [ ] PDF a exportar correctamente
- [ ] Backups automáticos configurados
- [ ] Firewall configurado (portas 80, 3000, 8000)
- [ ] Chaves de produção diferentes das de desenvolvimento

### Testar Endpoints

```powershell
# API Health
Invoke-WebRequest http://192.168.X.X:8000/rest/v1/ -Headers @{"apikey"="<anon_key>"}

# Auth
Invoke-WebRequest http://192.168.X.X:8000/auth/v1/settings -Headers @{"apikey"="<anon_key>"}
```

---

## 10. Troubleshooting

### Aplicação não carrega
- Verificar se o build foi feito (`dist/` existe)
- Verificar configuração do URL rewrite no IIS/NGINX
- Verificar console do browser para erros

### Não consegue ligar ao Supabase
- Verificar se os containers Docker estão "Up"
- Confirmar IP e porta no `client.ts`
- Verificar Firewall do Windows

### Edge Functions não respondem
- Verificar logs: `supabase functions logs telegram-notify`
- Confirmar que secrets estão configurados
- Verificar `config.toml`

### Dados não aparecem
- Verificar RLS policies no Supabase Studio
- Confirmar que o utilizador está autenticado
- Verificar logs do Postgres: `docker-compose logs -f postgres`

### Performance lenta
- Verificar índices nas tabelas
- Monitorizar: `docker stats`
- Considerar aumentar recursos do Docker Desktop

---

**✨ BCA — SCI Sistema de Controle Interno — Guia de Produção**
