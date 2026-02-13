# ============================================
# Script de Deploy - BCA SCI
# Executa build e copia para o servidor web
# ============================================

param(
    [string]$ProjectDir = "C:\Producao\ficha-sci",
    [string]$IISDir = "C:\inetpub\wwwroot\bca-sci",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

Write-Host "=== BCA SCI - Deploy de Producao ===" -ForegroundColor Cyan
Write-Host ""

# 1. Pull latest code
Write-Host "[1/5] Atualizando codigo..." -ForegroundColor Yellow
Set-Location $ProjectDir
git pull origin main

# 2. Install dependencies
Write-Host "[2/5] Instalando dependencias..." -ForegroundColor Yellow
npm install

# 3. Build
if (-not $SkipBuild) {
    Write-Host "[3/5] Build de producao..." -ForegroundColor Yellow
    npm run build
} else {
    Write-Host "[3/5] Build ignorado (SkipBuild)" -ForegroundColor Gray
}

# 4. Copy dist to IIS
Write-Host "[4/5] Copiando ficheiros para $IISDir..." -ForegroundColor Yellow
if (Test-Path $IISDir) {
    Remove-Item "$IISDir\*" -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $IISDir | Out-Null
Copy-Item "$ProjectDir\dist\*" $IISDir -Recurse

# 5. Copy web.config
Write-Host "[5/5] Copiando web.config..." -ForegroundColor Yellow
Copy-Item "$ProjectDir\production\web.config" "$IISDir\web.config" -Force

Write-Host ""
Write-Host "=== Deploy concluido com sucesso! ===" -ForegroundColor Green
Write-Host "Aceda a aplicacao no browser para verificar." -ForegroundColor Cyan
