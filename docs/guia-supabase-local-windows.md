# 🪟 Guia Rápido: Supabase Self-Hosted no Windows com Docker

## ✅ Pré-requisitos

1. **Docker Desktop para Windows** instalado e a correr
   - Download: https://www.docker.com/products/docker-desktop
   - Certifique-se que o WSL 2 backend está ativo (normalmente já vem por defeito)

2. **Git para Windows** instalado
   - Download: https://git-scm.com/download/win

3. **Node.js** (opcional, para gerar chaves)
   - Download: https://nodejs.org/

---

## 📝 Passo a Passo

### 1. Abrir PowerShell

- Pressione `Win + X` e escolha **Windows PowerShell** ou **Terminal**
- Navegue para onde quer instalar (exemplo: `C:\Supabase`)

```powershell
# Criar pasta e entrar nela
mkdir C:\Supabase
cd C:\Supabase
```

---

### 2. Clonar o Repositório Supabase

```powershell
git clone --depth 1 https://github.com/supabase/supabase
cd supabase\docker
```

---

### 3. Criar o Ficheiro de Configuração

```powershell
# Copiar o ficheiro exemplo
copy .env.example .env

# Abrir o ficheiro para editar (pode usar notepad ou outro editor)
notepad .env
```

---

### 4. Configurar Variáveis Essenciais no `.env`

**IMPORTANTE:** Edite estas variáveis no ficheiro `.env`:

```env
# Endereço IP da sua máquina Windows (não use localhost se quiser aceder de outras máquinas)
# Descubra seu IP: ipconfig (procure por IPv4 Address)
SUPABASE_PUBLIC_URL=http://192.168.1.XXX:8000

# Porta do Supabase Studio (Dashboard Web)
STUDIO_PORT=3000

# Porta do Kong Gateway (API Gateway)
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

# POSTGRES - Base de dados
POSTGRES_PASSWORD=sua_senha_super_segura_aqui

# JWT Secret (gerar abaixo)
JWT_SECRET=sua_chave_jwt_aqui

# ANON e SERVICE_ROLE Keys (gerar abaixo)
ANON_KEY=sua_anon_key_aqui
SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Dashboard - Credenciais de acesso ao Supabase Studio
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=admin_password_aqui
```

---

### 5. Gerar Chaves Seguras

#### Opção A: Usar Node.js (script que criei anteriormente)

Crie o ficheiro `gerar-chaves.js` no diretório `C:\Supabase\supabase\docker`:

```javascript
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Gerar JWT Secret (256 bits = 32 bytes)
const jwtSecret = crypto.randomBytes(32).toString('base64');

console.log('=== CHAVES GERADAS ===\n');
console.log('JWT_SECRET:');
console.log(jwtSecret);
console.log('\n---\n');

// Gerar ANON_KEY
const anonPayload = {
  role: 'anon',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 anos
};

const anonKey = jwt.sign(anonPayload, jwtSecret);

console.log('ANON_KEY:');
console.log(anonKey);
console.log('\n---\n');

// Gerar SERVICE_ROLE_KEY
const servicePayload = {
  role: 'service_role',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 anos
};

const serviceKey = jwt.sign(servicePayload, jwtSecret);

console.log('SERVICE_ROLE_KEY:');
console.log(serviceKey);
console.log('\n=== FIM ===');
```

**Instalar dependência e executar:**

```powershell
npm install jsonwebtoken
node gerar-chaves.js
```

Copie as chaves geradas e cole no seu `.env`.

---

#### Opção B: Usar PowerShell (sem Node.js)

```powershell
# Gerar JWT Secret
$bytes = New-Object Byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$jwtSecret = [System.Convert]::ToBase64String($bytes)
Write-Host "JWT_SECRET: $jwtSecret"
```

Para as chaves ANON_KEY e SERVICE_ROLE_KEY, é mais fácil usar ferramentas online (procure "JWT Generator") ou usar o script Node.js acima.

---

### 6. Descobrir o IP da Sua Máquina Windows

```powershell
ipconfig
```

Procure por **IPv4 Address** na secção da sua conexão de rede ativa (exemplo: `192.168.1.100`).

Use este IP no `SUPABASE_PUBLIC_URL` do `.env`:

```env
SUPABASE_PUBLIC_URL=http://192.168.1.100:8000
```

---

### 7. Iniciar o Supabase

```powershell
# Certifique-se que está no diretório supabase\docker
cd C:\Supabase\supabase\docker

# Iniciar todos os containers
docker-compose up -d
```

**O que vai acontecer:**
- Docker vai fazer download das imagens (primeira vez demora mais)
- Vários containers serão iniciados (Postgres, Kong, GoTrue, PostgREST, etc.)

---

### 8. Verificar se Está a Funcionar

```powershell
# Ver status dos containers
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f
```

**Todos os containers devem mostrar status "Up" ou "healthy".**

---

### 9. Aceder ao Supabase Studio (Dashboard)

Abra o browser e aceda a:

```
http://localhost:3000
```

**Credenciais de login:**
- Username: `admin` (ou o que definiu em `DASHBOARD_USERNAME`)
- Password: `admin_password_aqui` (ou o que definiu em `DASHBOARD_PASSWORD`)

---

### 10. Testar a API

A API está disponível em:

```
http://localhost:8000
```

Ou usando o IP da máquina:

```
http://192.168.1.XXX:8000
```

---

## 🔧 Atualizar a Aplicação BCA

Depois do Supabase self-hosted estar a funcionar, você precisa atualizar 2 ficheiros:

### 1. `src/integrations/supabase/client.ts`

```typescript
const SUPABASE_URL = "http://192.168.1.XXX:8000"; // Seu IP e porta Kong
const SUPABASE_PUBLISHABLE_KEY = "sua_anon_key_aqui";
```

### 2. `.env` (raiz do projeto)

```env
VITE_SUPABASE_PROJECT_ID="local"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_anon_key_aqui"
VITE_SUPABASE_URL="http://192.168.1.XXX:8000"
```

---

## 🛑 Parar o Supabase

```powershell
cd C:\Supabase\supabase\docker
docker-compose down
```

---

## 🔄 Reiniciar o Supabase

```powershell
cd C:\Supabase\supabase\docker
docker-compose restart
```

---

## 📊 Comandos Úteis

```powershell
# Ver logs de um serviço específico
docker-compose logs -f postgres

# Ver uso de recursos
docker stats

# Remover tudo (CUIDADO: apaga dados!)
docker-compose down -v

# Atualizar imagens
docker-compose pull
docker-compose up -d
```

---

## ⚠️ Troubleshooting

### Erro: "Port 3000 is already in use"
- Algum outro serviço está a usar a porta 3000
- Mude `STUDIO_PORT=3001` no `.env` e reinicie

### Erro: "Port 8000 is already in use"
- Mude `KONG_HTTP_PORT=8001` no `.env` e reinicie
- Não esqueça de atualizar `SUPABASE_PUBLIC_URL`

### Docker Desktop não inicia
- Verifique se o WSL 2 está instalado: `wsl --status`
- Reinicie o Windows
- Reinstale o Docker Desktop se necessário

### Containers não ficam "healthy"
- Aguarde 2-3 minutos (primeira inicialização demora)
- Verifique logs: `docker-compose logs -f`

### Não consigo aceder de outra máquina
- Verifique Firewall do Windows (permita portas 3000 e 8000)
- Use o IP correto (não use `localhost` ou `127.0.0.1`)

---

## 🔐 Segurança (Produção)

Se for usar em produção:

1. **HTTPS obrigatório** (use Nginx ou Caddy como proxy reverso)
2. **Passwords fortes** para Postgres e Dashboard
3. **Firewall configurado** (apenas portas necessárias abertas)
4. **Backups automáticos** da base de dados
5. **Não exponha na internet** sem proteção adequada

---

## 📚 Próximos Passos

Após ter o Supabase self-hosted a funcionar:

1. ✅ **Migrar dados** do Supabase Cloud (se aplicável)
2. ✅ **Configurar backups automáticos**
3. ✅ **Integração com Active Directory** (SAML/LDAP)
4. ✅ **Configurar email** (SMTP para autenticação)
5. ✅ **Monitorização** (logs, alertas, métricas)

---

## 🆘 Suporte

- Documentação oficial: https://supabase.com/docs/guides/self-hosting/docker
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase/issues

---

**✨ Criado para o projeto BCA - SCI Sistema de Controle Interno**
