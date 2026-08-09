# 🔄 Migrar dados do Supabase Cloud para o Supabase Local (Self-Hosted)

Este guia explica como copiar o **esquema, os dados, os utilizadores e os ficheiros** do projeto Supabase Cloud (`tapajmlapibpfopbqkgv`) para o Supabase self-hosted em Docker.

```text
Supabase Cloud  --(pg_dump)-->  roles.sql / schema.sql / data.sql  --(psql)-->  Supabase Local (Docker)
```

---

## 0. Pré-requisitos

| Requisito | Verificação |
|---|---|
| Supabase CLI instalado | `supabase --version` |
| Docker do Supabase local a correr | `docker ps` (containers "Up") |
| Acesso à internet para o Cloud | — |
| Pasta de trabalho | `C:\Producao\migracao` |

---

## 1. Obter a connection string do Cloud

1. Abra https://supabase.com/dashboard/project/tapajmlapibpfopbqkgv/settings/database
2. Secção **Connection string** → separador **URI**
3. Escolha o modo **Session pooler** (porta `5432`)
4. Copie a string e substitua `[YOUR-PASSWORD]` pela password da base de dados

Fica no formato:

```
postgresql://postgres.tapajmlapibpfopbqkgv:SUA_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

> 🔒 Nunca guarde esta string em ficheiros do repositório. Use-a apenas na linha de comandos.

---

## 2. Exportar do Cloud (3 dumps)

```powershell
mkdir C:\Producao\migracao -Force
cd C:\Producao\migracao

$CLOUD = "postgresql://postgres.tapajmlapibpfopbqkgv:SUA_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# 1) Roles (utilizadores de base de dados)
supabase db dump --db-url $CLOUD --role-only -f roles.sql

# 2) Esquema (tabelas, políticas RLS, funções, triggers)
supabase db dump --db-url $CLOUD -f schema.sql

# 3) Dados (inclui auth.users e storage.objects)
supabase db dump --db-url $CLOUD --data-only --use-copy -f data.sql
```

Confirme que os três ficheiros existem e não estão vazios:

```powershell
Get-ChildItem C:\Producao\migracao\*.sql | Select-Object Name, Length
```

---

## 3. Importar no Supabase local

A connection string local (Docker) é:

```
postgresql://postgres:SUA_POSTGRES_PASSWORD@localhost:5432/postgres
```

> A password é a que definiu em `POSTGRES_PASSWORD` no `.env` do Docker.

### Opção A — Recomendada (esquema pelas migrações + só dados)

O esquema já está versionado em `supabase/migrations/`, por isso basta aplicá-lo e importar apenas os dados.

```powershell
cd C:\Producao\ficha-sci

# Aplica as migrações do repositório (ATENÇÃO: apaga os dados locais atuais)
supabase db reset --db-url "postgresql://postgres:SUA_POSTGRES_PASSWORD@localhost:5432/postgres"

# Importa os dados
psql "postgresql://postgres:SUA_POSTGRES_PASSWORD@localhost:5432/postgres" -f C:\Producao\migracao\data.sql
```

### Opção B — Restauro completo numa base vazia

Use quando quer replicar exatamente o Cloud, incluindo roles e objetos que não estão nas migrações.

```powershell
$LOCAL = "postgresql://postgres:SUA_POSTGRES_PASSWORD@localhost:5432/postgres"

psql $LOCAL -f C:\Producao\migracao\roles.sql
psql $LOCAL -f C:\Producao\migracao\schema.sql
psql $LOCAL -f C:\Producao\migracao\data.sql
```

Se o `psql` não estiver instalado no Windows, use o container:

```powershell
Get-Content C:\Producao\migracao\data.sql | docker exec -i supabase-db psql -U postgres -d postgres
```

---

## 4. Utilizadores de autenticação (`auth.users`)

- Os dumps com `--data-only` **incluem** a tabela `auth.users`, por isso os logins são migrados.
- As **passwords continuam a funcionar** (o hash bcrypt é copiado tal e qual).
- As **sessões antigas expiram**: o `JWT_SECRET` local é diferente do Cloud, logo todos os utilizadores têm de fazer login outra vez.
- Depois da importação, confirme no Studio local (`http://localhost:3000` → Authentication → Users) que os utilizadores aparecem.

Verificação rápida:

```sql
SELECT email, created_at, last_sign_in_at FROM auth.users ORDER BY created_at;
```

---

## 5. Ficheiros do Storage (bucket `shift-maps`)

As linhas da tabela `storage.objects` são copiadas pelo dump, mas **os ficheiros físicos não**. É preciso transferi-los à parte.

1. No Cloud: https://supabase.com/dashboard/project/tapajmlapibpfopbqkgv/storage/buckets/shift-maps → selecionar os ficheiros → **Download**
2. No Studio local (`http://localhost:3000` → Storage):
   - Criar o bucket `shift-maps` como **público** (se ainda não existir após o restauro do esquema)
   - Fazer **Upload** dos ficheiros mantendo exatamente os mesmos nomes e pastas

> Se os nomes não coincidirem, os links guardados na base de dados devolvem 404.

---

## 6. Verificação final

```sql
SELECT 'file_processes'      AS tabela, count(*) FROM public.file_processes
UNION ALL SELECT 'daily_alerts',        count(*) FROM public.daily_alerts
UNION ALL SELECT 'taskboard_data',      count(*) FROM public.taskboard_data
UNION ALL SELECT 'exported_taskboards', count(*) FROM public.exported_taskboards
UNION ALL SELECT 'cobrancas_retornos',  count(*) FROM public.cobrancas_retornos;
```

Confirmar que o RLS ficou ativo:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Todas as tabelas devem ter `rowsecurity = true`.

E as políticas:

```sql
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
```

Por fim, abra a aplicação, faça login e confirme que o histórico de fichas e os processamentos aparecem.

---

## 7. Checklist

- [ ] `roles.sql`, `schema.sql` e `data.sql` exportados e não vazios
- [ ] Esquema aplicado no local (migrações ou `schema.sql`)
- [ ] `data.sql` importado sem erros
- [ ] Utilizadores visíveis em Authentication → Users
- [ ] Bucket `shift-maps` criado e ficheiros carregados
- [ ] Contagens de linhas coincidem com o Cloud
- [ ] RLS ativo em todas as tabelas `public`
- [ ] Login e histórico a funcionar na aplicação

---

## 8. Troubleshooting

### `role "supabase_admin" does not exist`
Importe primeiro o `roles.sql`, ou repita o dump com:
```powershell
supabase db dump --db-url $CLOUD --data-only --use-copy -f data.sql
psql $LOCAL -c "SET session_replication_role = replica;" -f data.sql
```

### `must be owner of table ...`
Volte a exportar ignorando donos e privilégios:
```powershell
pg_dump $CLOUD --data-only --no-owner --no-privileges -f data.sql
```

### `extension "pg_graphql" is not available`
Extensões do Cloud que não existem no self-hosted. Comente ou remova essas linhas `CREATE EXTENSION` do `schema.sql`, ou use a **Opção A** (as migrações do repositório não dependem delas).

### Erros de chaves estrangeiras durante a importação
Desative temporariamente os triggers:
```powershell
psql $LOCAL -c "SET session_replication_role = replica;"
psql $LOCAL -f data.sql
psql $LOCAL -c "SET session_replication_role = origin;"
```

### `duplicate key value violates unique constraint`
A base local já tinha dados. Faça `supabase db reset` (Opção A) antes de importar.

### A importação demora muito
Normal em tabelas grandes. Acompanhe com:
```powershell
docker logs -f supabase-db
```

---

**✨ BCA — SCI Sistema de Controlo Interno**
