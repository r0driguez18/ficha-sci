# ============================================
# Deploy Edge Functions - BCA SCI
# ============================================

param(
    [string]$ProjectDir = "C:\Producao\ficha-sci",
    [string]$EnvFile = "$ProjectDir\.env.local"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Deploy Edge Functions ===" -ForegroundColor Cyan

Set-Location $ProjectDir

# Verificar se .env.local existe
if (-not (Test-Path $EnvFile)) {
    Write-Host "ERRO: Ficheiro $EnvFile nao encontrado!" -ForegroundColor Red
    Write-Host "Crie o ficheiro com TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID" -ForegroundColor Yellow
    exit 1
}

# Deploy telegram-notify
Write-Host "Deployando telegram-notify..." -ForegroundColor Yellow
supabase functions deploy telegram-notify --env-file $EnvFile

Write-Host ""
Write-Host "=== Edge Functions deployadas com sucesso! ===" -ForegroundColor Green
