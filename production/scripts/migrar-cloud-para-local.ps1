# ============================================
# Migracao Supabase Cloud -> Supabase Local
# BCA SCI
#
# Exemplo:
#   .\migrar-cloud-para-local.ps1 `
#       -CloudUrl "postgresql://postgres.tapajmlapibpfopbqkgv:PASS@aws-0-eu-central-1.pooler.supabase.com:5432/postgres" `
#       -LocalPassword "minha_password_postgres"
# ============================================

param(
    [Parameter(Mandatory = $true)]
    [string]$CloudUrl,

    [Parameter(Mandatory = $true)]
    [string]$LocalPassword,

    [string]$LocalHost = "localhost",
    [int]$LocalPort = 5432,
    [string]$WorkDir = "C:\Producao\migracao",

    # Se indicado, importa tambem roles.sql e schema.sql (restauro completo).
    # Por defeito importa apenas os dados, assumindo que o esquema ja foi
    # aplicado com as migracoes do repositorio.
    [switch]$RestauroCompleto,

    # Salta a fase de exportacao e usa os ficheiros ja existentes em $WorkDir
    [switch]$SkipDump
)

$ErrorActionPreference = "Stop"

$LocalUrl = "postgresql://postgres:$LocalPassword@${LocalHost}:$LocalPort/postgres"

function Write-Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Err($msg)  { Write-Host "  ERRO  $msg" -ForegroundColor Red }

# --- Verificacoes iniciais -------------------------------------------------
Write-Step "Verificar pre-requisitos"

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Err "Supabase CLI nao encontrado. Instale com: npm install -g supabase"
    exit 1
}
Write-Ok "Supabase CLI encontrado"

$usePsqlDocker = $false
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host "  psql nao encontrado no Windows - sera usado o container supabase-db" -ForegroundColor Yellow
    $usePsqlDocker = $true
} else {
    Write-Ok "psql encontrado"
}

New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null
Write-Ok "Pasta de trabalho: $WorkDir"

$rolesFile  = Join-Path $WorkDir "roles.sql"
$schemaFile = Join-Path $WorkDir "schema.sql"
$dataFile   = Join-Path $WorkDir "data.sql"

# --- 1. Exportar do Cloud --------------------------------------------------
if ($SkipDump) {
    Write-Step "Exportacao ignorada (-SkipDump)"
} else {
    Write-Step "Exportar do Supabase Cloud"

    Write-Host "  A exportar roles..."
    supabase db dump --db-url $CloudUrl --role-only -f $rolesFile
    Write-Ok "roles.sql"

    Write-Host "  A exportar esquema..."
    supabase db dump --db-url $CloudUrl -f $schemaFile
    Write-Ok "schema.sql"

    Write-Host "  A exportar dados..."
    supabase db dump --db-url $CloudUrl --data-only --use-copy -f $dataFile
    Write-Ok "data.sql"
}

foreach ($f in @($dataFile)) {
    if (-not (Test-Path $f) -or (Get-Item $f).Length -eq 0) {
        Write-Err "Ficheiro em falta ou vazio: $f"
        exit 1
    }
}

Get-ChildItem "$WorkDir\*.sql" | Select-Object Name, @{N='KB';E={[math]::Round($_.Length/1KB,1)}} | Format-Table

# --- 2. Confirmacao --------------------------------------------------------
Write-Step "Importar para o Supabase local"
Write-Host "  Destino: ${LocalHost}:$LocalPort/postgres" -ForegroundColor Yellow
if ($RestauroCompleto) {
    Write-Host "  Modo: RESTAURO COMPLETO (roles + schema + dados)" -ForegroundColor Yellow
} else {
    Write-Host "  Modo: apenas DADOS (o esquema deve ja estar aplicado)" -ForegroundColor Yellow
}
Write-Host "  Esta operacao escreve na base de dados local." -ForegroundColor Yellow

$resp = Read-Host "Continuar? (s/N)"
if ($resp -ne "s" -and $resp -ne "S") {
    Write-Host "Cancelado pelo utilizador." -ForegroundColor Yellow
    exit 0
}

# --- 3. Importar -----------------------------------------------------------
function Invoke-Sql-File($file) {
    if ($usePsqlDocker) {
        Get-Content $file | docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=0
    } else {
        psql $LocalUrl -v ON_ERROR_STOP=0 -f $file
    }
}

function Invoke-Sql-Cmd($sql) {
    if ($usePsqlDocker) {
        docker exec -i supabase-db psql -U postgres -d postgres -c $sql
    } else {
        psql $LocalUrl -c $sql
    }
}

if ($RestauroCompleto) {
    Write-Host "  A importar roles..."
    Invoke-Sql-File $rolesFile
    Write-Ok "roles importados"

    Write-Host "  A importar esquema..."
    Invoke-Sql-File $schemaFile
    Write-Ok "esquema importado"
}

Write-Host "  A importar dados (triggers desativados)..."
Invoke-Sql-Cmd "SET session_replication_role = replica;"
Invoke-Sql-File $dataFile
Invoke-Sql-Cmd "SET session_replication_role = origin;"
Write-Ok "dados importados"

# --- 4. Verificacao --------------------------------------------------------
Write-Step "Verificacao - contagem de linhas"

$countSql = @"
SELECT 'file_processes' AS tabela, count(*) AS linhas FROM public.file_processes
UNION ALL SELECT 'daily_alerts', count(*) FROM public.daily_alerts
UNION ALL SELECT 'taskboard_data', count(*) FROM public.taskboard_data
UNION ALL SELECT 'exported_taskboards', count(*) FROM public.exported_taskboards
UNION ALL SELECT 'cobrancas_retornos', count(*) FROM public.cobrancas_retornos
UNION ALL SELECT 'auth.users', count(*) FROM auth.users;
"@

Invoke-Sql-Cmd $countSql

Write-Step "Verificacao - RLS ativo"
Invoke-Sql-Cmd "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"

Write-Host "`nMigracao concluida." -ForegroundColor Green
Write-Host "Lembre-se: os ficheiros do bucket 'shift-maps' tem de ser carregados manualmente no Studio local." -ForegroundColor Yellow
