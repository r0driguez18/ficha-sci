# Guia de Migração para Nova Base de Dados Supabase

## 📋 O que Precisa de Fazer

### 1. **Criar Novo Projeto Supabase**
   - Aceda a [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Aguarde até o projeto estar totalmente inicializado

### 2. **Executar SQL Schema**
   - No dashboard do novo projeto, vá a **SQL Editor**
   - Copie todo o conteúdo do ficheiro `supabase/full_database_schema.sql`
   - Cole no SQL Editor e execute
   - Verifique se não há erros

### 3. **Configurar Authentication**
   - Vá a **Authentication** > **Providers**
   - Configure os providers de autenticação que usa (Email/Password, etc.)
   - Configure as URLs de redirect se necessário

### 4. **Obter Credenciais do Novo Projeto**
   Vá a **Settings** > **API** e copie:
   - **Project URL** (formato: `https://xxxxxxxx.supabase.co`)
   - **Project ID** (exemplo: `xxxxxxxx`)
   - **anon/public key** (chave pública)
   - **service_role key** (chave privada - apenas para backend)

---

## 🔧 Alterações no Código

### **Ficheiros que DEVE EDITAR:**

#### 1. `src/integrations/supabase/client.ts`
```typescript
// Linha 5: Substituir o URL
const SUPABASE_URL = "https://SEU_NOVO_PROJECT_ID.supabase.co";

// Linha 6: Substituir a chave pública
const SUPABASE_PUBLISHABLE_KEY = "SUA_NOVA_ANON_KEY";
```

#### 2. `.env`
```env
VITE_SUPABASE_PROJECT_ID="SEU_NOVO_PROJECT_ID"
VITE_SUPABASE_PUBLISHABLE_KEY="SUA_NOVA_ANON_KEY"
VITE_SUPABASE_URL="https://SEU_NOVO_PROJECT_ID.supabase.co"
```

#### 3. `supabase/config.toml` (se existir)
Atualize o `project_id` na primeira linha:
```toml
project_id = "SEU_NOVO_PROJECT_ID"
```

---

## 📦 Migração de Dados (Opcional)

Se precisar migrar dados do projeto antigo:

### Opção A: Export/Import via Dashboard
1. No projeto antigo: **Database** > **Backups** > Export
2. No projeto novo: Import o ficheiro

### Opção B: Script SQL
1. Exporte dados como INSERT statements
2. Execute no novo projeto

---

## ✅ Checklist Final

- [ ] Novo projeto Supabase criado
- [ ] SQL schema executado sem erros
- [ ] Authentication configurado
- [ ] `client.ts` atualizado com novas credenciais
- [ ] `.env` atualizado com novas credenciais
- [ ] `config.toml` atualizado (se aplicável)
- [ ] Aplicação testada localmente
- [ ] Login/autenticação funciona
- [ ] Dados são guardados corretamente
- [ ] RLS policies funcionam (utilizadores só veem seus dados)

---

## 🚨 Notas Importantes

1. **NÃO PARTILHE** a `service_role_key` publicamente
2. **Teste TUDO** antes de desativar o projeto antigo
3. **Guarde** as credenciais antigas temporariamente como backup
4. **Verifique** se todas as funcionalidades funcionam:
   - Login/Logout
   - Criação de taskboards
   - Exportação de PDFs
   - Alertas de cobranças
   - Histórico de procedimentos

---

## 📞 Suporte

Se encontrar erros ao executar o SQL:
- Verifique se todas as tabelas foram criadas
- Verifique se as políticas RLS foram aplicadas
- Consulte os logs do Supabase em **Logs** > **Postgres Logs**
