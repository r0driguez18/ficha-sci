# Guia de Migração para SQL Server

## ⚠️ AVISO IMPORTANTE

Migrar de Supabase/PostgreSQL para SQL Server **requer alterações SIGNIFICATIVAS** na aplicação. Este não é um simples "copiar e colar" de código.

---

## 📋 O Que Vai Perder

### 1. **Autenticação Integrada do Supabase**
   - Todo o sistema `supabase.auth` deixará de funcionar
   - Terá de implementar autenticação do ZERO (JWT, bcrypt, etc.)
   - Ficheiros afetados: todos os que usam `supabase.auth`

### 2. **Row Level Security (RLS)**
   - SQL Server não tem RLS nativo como PostgreSQL
   - Toda a lógica de segurança terá de ser na aplicação
   - **RISCO DE SEGURANÇA**: Facilmente pode expor dados se não implementar corretamente

### 3. **Storage de Ficheiros**
   - O storage do Supabase (`shift-maps` bucket) deixa de funcionar
   - Terá de usar Azure Blob Storage, AWS S3, ou sistema de ficheiros local

### 4. **Realtime Subscriptions**
   - Não existem no SQL Server
   - Se usar realtime, terá de implementar via SignalR ou WebSockets

---

## 🔧 Alterações Necessárias no Código

### **Passo 1: Base de Dados**

Execute o ficheiro `sql-server-schema.sql` no SQL Management Studio.

---

### **Passo 2: Remover Dependência do Supabase**

#### 2.1. Desinstalar pacote Supabase
```bash
npm uninstall @supabase/supabase-js
```

#### 2.2. Instalar biblioteca SQL Server
```bash
npm install mssql
npm install @types/mssql --save-dev
```

---

### **Passo 3: Criar Cliente SQL Server**

Criar ficheiro `src/lib/sqlServerClient.ts`:

```typescript
import sql from 'mssql';

const config: sql.config = {
  server: 'SEU_SERVIDOR.database.windows.net', // ou localhost
  database: 'NOME_DA_BASE_DADOS',
  user: 'SEU_UTILIZADOR',
  password: 'SUA_PASSWORD',
  options: {
    encrypt: true, // Para Azure
    trustServerCertificate: false
  }
};

export const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Conectado ao SQL Server');
    return pool;
  })
  .catch(err => {
    console.error('Erro ao conectar SQL Server:', err);
    throw err;
  });
```

---

### **Passo 4: Substituir TODAS as Queries**

#### ❌ **ANTES (Supabase):**
```typescript
const { data, error } = await supabase
  .from('file_processes')
  .select('*')
  .eq('is_salary', true);
```

#### ✅ **DEPOIS (SQL Server):**
```typescript
import { poolPromise } from '@/lib/sqlServerClient';

const pool = await poolPromise;
const result = await pool.request()
  .input('is_salary', sql.Bit, 1)
  .query('SELECT * FROM file_processes WHERE is_salary = @is_salary');

const data = result.recordset;
```

---

### **Passo 5: Implementar Autenticação**

Terá de criar **do ZERO**:

1. **Sistema de hash de passwords** (bcrypt)
2. **Geração e validação de JWT tokens**
3. **Middleware de autenticação**
4. **Páginas de login/registo**
5. **Gestão de sessões**

Exemplo básico:

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Registo
const hashedPassword = await bcrypt.hash(password, 10);
await pool.request()
  .input('email', sql.NVarChar, email)
  .input('password_hash', sql.NVarChar, hashedPassword)
  .query('INSERT INTO users (email, password_hash) VALUES (@email, @password_hash)');

// Login
const user = await pool.request()
  .input('email', sql.NVarChar, email)
  .query('SELECT * FROM users WHERE email = @email');

const isValid = await bcrypt.compare(password, user.recordset[0].password_hash);
const token = jwt.sign({ userId: user.recordset[0].id }, 'SECRET_KEY');
```

---

### **Passo 6: Implementar Controlo de Acesso (substituir RLS)**

Terá de validar **manualmente** em cada query que o utilizador só acede aos seus dados:

```typescript
// Exemplo: Buscar taskboards do utilizador
const result = await pool.request()
  .input('user_id', sql.NVarChar, currentUserId) // Obtido do token JWT
  .query('SELECT * FROM taskboard_data WHERE user_id = @user_id');
```

**⚠️ CRÍTICO**: Se esquecer este filtro numa query, TODOS os dados ficam expostos!

---

## 📂 Ficheiros Que TEM de Alterar

### **Autenticação:**
- `src/components/auth/AuthProvider.tsx` - Reescrever completamente
- `src/components/auth/PrivateRoute.tsx` - Adaptar para novo sistema
- `src/pages/auth/Login.tsx` - Alterar chamadas de API

### **Services (TODOS):**
- `src/services/alertsService.ts`
- `src/services/cobrancasRetornoService.ts`
- `src/services/exportedTaskboardService.ts`
- `src/services/fileProcessService.ts`
- `src/services/taskboardService.ts`

### **Componentes com queries:**
- `src/components/alerts/DailyAlertsWidget.tsx`
- `src/pages/sci/*.tsx` (todos os taskboards)
- Qualquer componente que use `supabase.from()`

---

## 🚨 Riscos de Segurança

1. **Sem RLS**: Fácil esquecer validação e expor dados
2. **SQL Injection**: Tem de usar **sempre** parameterized queries
3. **Gestão de passwords**: Precisa implementar corretamente (bcrypt, argon2)
4. **JWT Secrets**: Guardar em variáveis de ambiente, NUNCA no código
5. **HTTPS**: Obrigatório em produção

---

## ⏱️ Estimativa de Tempo

- **Setup inicial**: 2-4 horas
- **Migração de queries**: 8-16 horas
- **Implementação de autenticação**: 16-24 horas
- **Testes e debug**: 8-16 horas
- **TOTAL**: **34-60 horas** de trabalho

---

## 💡 Recomendação Final

**Considere seriamente manter o Supabase** porque:
- ✅ Autenticação já implementada e segura
- ✅ RLS protege dados automaticamente
- ✅ Storage de ficheiros incluído
- ✅ Menos código para manter
- ✅ Menos riscos de segurança

Se **MESMO ASSIM** quiser SQL Server, esteja preparado para:
- Reescrever grande parte da aplicação
- Implementar segurança manualmente
- Maior tempo de desenvolvimento e manutenção

---

## 📞 Próximos Passos

1. Execute `sql-server-schema.sql` no SQL Management Studio
2. Confirme se quer mesmo prosseguir
3. Começarei a ajudar na migração do código (será um processo longo)
