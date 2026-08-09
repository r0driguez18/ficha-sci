# Migrar dados do Supabase Cloud para o Supabase local (self-hosted)

Objetivo: copiar o esquema e os dados do projeto Supabase Cloud (`tapajmlapibpfopbqkgv`) para o Supabase self-hosted em Docker, sem alterar a aplicação.

## Resumo do processo

```text
Supabase Cloud  --(pg_dump)-->  ficheiros .sql  --(psql)-->  Supabase local (Docker)
   roles.sql / schema.sql / data.sql
```

O esquema já existe em `supabase/migrations/`, por isso na prática só é preciso trazer os **dados**. O guia cobre as duas opções.

## O que vai ser criado

1. `GUIA_MIGRACAO_CLOUD_PARA_LOCAL.md` — guia passo a passo em português:
   - Como obter a connection string do Cloud (Dashboard → Project Settings → Database → Connection string, modo Session).
   - Exportar com o Supabase CLI:
     - `supabase db dump --db-url "<cloud_url>" -f schema.sql`
     - `supabase db dump --db-url "<cloud_url>" --data-only -f data.sql`
     - `supabase db dump --db-url "<cloud_url>" --role-only -f roles.sql` (utilizadores/roles)
   - Importar no local (`postgresql://postgres:<PASS>@localhost:5432/postgres`):
     - Opção A (recomendada): aplicar as migrações existentes (`supabase db reset` no local) e depois só `data.sql`.
     - Opção B: restaurar `roles.sql` + `schema.sql` + `data.sql` numa base vazia.
   - Migração dos utilizadores de autenticação (tabela `auth.users`) e nota sobre o `JWT_SECRET`: as passwords continuam válidas, mas as sessões existentes expiram.
   - Migração dos ficheiros do bucket `shift-maps` (download via Storage do Cloud e upload no Studio local).
   - Verificação final: contagem de linhas por tabela (`file_processes`, `daily_alerts`, `taskboard_data`, `exported_taskboards`, `cobrancas_retornos`) e confirmação de que as políticas RLS ficaram ativas.
   - Troubleshooting: erros de owner/role, extensões em falta, `--no-owner`/`--no-privileges`.

2. `production/scripts/migrar-cloud-para-local.ps1` — script PowerShell para Windows que:
   - Recebe a URL do Cloud e a password local como parâmetros.
   - Faz os três dumps para `C:\Producao\migracao\`.
   - Pede confirmação antes de importar para o local.
   - Mostra no fim a contagem de linhas de cada tabela.

## Notas técnicas

- Nenhum ficheiro de aplicação (`src/`) é alterado; nenhuma migração nova é criada.
- Os dumps são feitos com `pg_dump` via Supabase CLI para garantir compatibilidade com os esquemas `auth` e `storage`.
- As credenciais nunca ficam escritas nos ficheiros do repositório — são passadas como parâmetro ao script.
