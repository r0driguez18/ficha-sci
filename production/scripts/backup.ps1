# ============================================
# Script de Backup Automático - BCA SCI
# Agendar no Task Scheduler do Windows
# ============================================

$date = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupDir = "C:\Producao\backups"
$dockerDir = "C:\Producao\supabase\docker"
$retentionDays = 30

# Criar pasta de backups se não existir
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

Write-Host "[$date] Iniciando backup da base de dados..." -ForegroundColor Cyan

# Backup da base de dados PostgreSQL
try {
    docker exec -t supabase-db pg_dumpall -c -U postgres | Out-File "$backupDir\backup_$date.sql" -Encoding UTF8
    Write-Host "Backup guardado: $backupDir\backup_$date.sql" -ForegroundColor Green
} catch {
    Write-Host "ERRO ao criar backup: $_" -ForegroundColor Red
    exit 1
}

# Limpar backups antigos
$deleted = Get-ChildItem "$backupDir\*.sql" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$retentionDays) }
if ($deleted) {
    $deleted | Remove-Item
    Write-Host "Removidos $($deleted.Count) backups com mais de $retentionDays dias" -ForegroundColor Yellow
}

Write-Host "Backup concluido com sucesso!" -ForegroundColor Green
