# ============================================
# Health Check - BCA SCI
# Verifica se todos os servicos estao online
# ============================================

param(
    [string]$SupabaseUrl = "http://192.168.X.X:8000",  # ALTERAR
    [string]$AppUrl = "http://192.168.X.X",              # ALTERAR
    [string]$AnonKey = "ALTERAR_ANON_KEY"
)

Write-Host "=== BCA SCI - Health Check ===" -ForegroundColor Cyan
Write-Host ""

$allOk = $true

# 1. Docker containers
Write-Host "[1] Docker containers..." -NoNewline
try {
    $containers = docker ps --format "{{.Status}}" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FALHOU" -ForegroundColor Red
        $allOk = $false
    }
} catch {
    Write-Host " FALHOU - Docker nao acessivel" -ForegroundColor Red
    $allOk = $false
}

# 2. Supabase API
Write-Host "[2] Supabase API..." -NoNewline
try {
    $response = Invoke-WebRequest "$SupabaseUrl/rest/v1/" -Headers @{"apikey"=$AnonKey} -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FALHOU ($($response.StatusCode))" -ForegroundColor Red
        $allOk = $false
    }
} catch {
    Write-Host " FALHOU" -ForegroundColor Red
    $allOk = $false
}

# 3. Frontend
Write-Host "[3] Frontend..." -NoNewline
try {
    $response = Invoke-WebRequest $AppUrl -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FALHOU ($($response.StatusCode))" -ForegroundColor Red
        $allOk = $false
    }
} catch {
    Write-Host " FALHOU" -ForegroundColor Red
    $allOk = $false
}

# 4. Auth
Write-Host "[4] Supabase Auth..." -NoNewline
try {
    $response = Invoke-WebRequest "$SupabaseUrl/auth/v1/settings" -Headers @{"apikey"=$AnonKey} -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FALHOU ($($response.StatusCode))" -ForegroundColor Red
        $allOk = $false
    }
} catch {
    Write-Host " FALHOU" -ForegroundColor Red
    $allOk = $false
}

Write-Host ""
if ($allOk) {
    Write-Host "=== Todos os servicos ONLINE ===" -ForegroundColor Green
} else {
    Write-Host "=== ATENÇÃO: Alguns servicos com problemas ===" -ForegroundColor Red
}
