<#
  Deploy do SCI para o servidor de producao (Ubuntu + nginx + Supabase em Docker).

  Corre-se na maquina que alcanca o servidor, a partir da pasta do projeto:

      .\production\deploy\deploy-sci.ps1

  O que faz (por ordem; pede confirmacao antes de mexer no servidor):
    1. git pull da main (recusa se houver alteracoes locais por guardar)
    2. npm install + npm run build
    3. verifica que o build aponta para o servidor certo (e nao para localhost)
    4. limpa ~/sci-novo no servidor e envia o dist, as migracoes e o script do servidor
    5. corre o script do servidor: backup, migracoes, publica, recarrega o nginx, confirma

  Opcoes:
    -SoVerificar     so faz os passos 1 a 3 (nao toca no servidor)
    -SemMigracoes    nao envia nem aplica migracoes
    -Utilizador dis  utilizador de SSH no servidor (por omissao: dis)
    -Servidor ...    endereco do servidor (por omissao: 172.20.11.54)

  ANTES DE CADA DEPLOY: rever a lista $MigracoesPendentes aqui em baixo (so as que ainda
  NAO foram aplicadas em producao, por ordem). O script do servidor mostra o que ja la esta.

  Este ficheiro so tem ASCII de proposito (o PowerShell 5 le mal acentos sem BOM).
#>
param(
  [string]$Servidor = '172.20.11.54',
  [string]$Utilizador = 'dis',
  [switch]$SoVerificar,
  [switch]$SemMigracoes
)

$ErrorActionPreference = 'Stop'

# --- Migracoes a aplicar neste deploy (sem .sql, por ordem). Atualizar a cada deploy. ---
$MigracoesPendentes = @(
  '20260917090000_card_renewal_cards_insert_scope',
  '20260920100000_handover_historico',
  '20260920140000_handover_arquivar',
  '20260920160000_daily_alerts_horarios',
  '20260924100000_alerta_etr_1330'
)

$Raiz = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $Raiz
$Destino = "$Utilizador@$Servidor"

function Passo([string]$t) { Write-Host ''; Write-Host "== $t" -ForegroundColor Cyan }
function Parar([string]$t) { Write-Host "ERRO: $t" -ForegroundColor Red; exit 1 }
function Correr([string]$desc, [scriptblock]$bloco) {
  Passo $desc
  & $bloco
  if ($LASTEXITCODE -ne 0) { Parar "$desc falhou (codigo $LASTEXITCODE)" }
}

# ------------------------------------------------------------------ 1. codigo
Passo '1. Codigo (git)'
$sujo = git status --short
if ($sujo) { Write-Host $sujo; Parar 'ha alteracoes locais por guardar - resolve isso antes (git status).' }
Correr 'git checkout main' { git checkout main }
Correr 'git pull origin main' { git pull origin main }
$versao = (git log --oneline -1)
Write-Host "Versao: $versao" -ForegroundColor Green

# ------------------------------------------------------------------ 2. build
if (-not (Test-Path '.env.production.local')) {
  Parar 'falta o ficheiro .env.production.local (tem o endereco do servidor; nao vai para o git).'
}
if (-not (Select-String -Path '.env.production.local' -SimpleMatch $Servidor -Quiet)) {
  Parar ".env.production.local nao tem o endereco $Servidor - o build ficaria a apontar para outro sitio."
}
Correr 'npm install' { npm install }
Correr 'npm run build' { npm run build }

# ------------------------------------------------------------------ 3. verificar o build
Passo '3. Verificar o build'
$comIp = Select-String -Path 'dist\assets\*.js' -SimpleMatch $Servidor -List | Select-Object -ExpandProperty Filename
$comLocal = Select-String -Path 'dist\assets\*.js' -SimpleMatch 'localhost:8000' -List | Select-Object -ExpandProperty Filename
if (-not $comIp) { Parar "o build NAO tem o endereco $Servidor." }
if ($comLocal) { Parar "o build ainda tem localhost:8000 em: $($comLocal -join ', ')" }
$principal = (Select-String -Path 'dist\index.html' -Pattern 'assets/index-[^"]+\.js').Matches[0].Value
Write-Host "Build OK: tem $Servidor, sem localhost:8000. Ficheiro principal: $principal" -ForegroundColor Green

if ($SoVerificar) { Write-Host ''; Write-Host 'Modo -SoVerificar: nao toquei no servidor.' -ForegroundColor Yellow; exit 0 }

# ------------------------------------------------------------------ 4. enviar
$migs = @()
if (-not $SemMigracoes) { $migs = $MigracoesPendentes }
foreach ($m in $migs) {
  if (-not (Test-Path "supabase\migrations\$m.sql")) { Parar "nao existe supabase\migrations\$m.sql" }
}

Write-Host ''
Write-Host "Vou enviar para $Destino :" -ForegroundColor Yellow
Write-Host "  versao : $versao"
Write-Host "  dist   : $principal"
Write-Host "  migracoes ($($migs.Count)) : $($migs -join ', ')"
$r = Read-Host 'Continuar? (s/n)'
if ($r -notmatch '^[sSyY]') { Write-Host 'Cancelado.'; exit 0 }

Passo '4. Enviar para o servidor (pede a palavra-passe do utilizador do servidor)'
Correr 'limpar ~/sci-novo no servidor' { ssh -t $Destino 'sudo rm -rf ~/sci-novo && mkdir -p ~/sci-novo' }
Correr 'enviar dist' { scp -r dist "${Destino}:~/sci-novo/" }

if ($migs.Count -gt 0) {
  $lista = Join-Path $env:TEMP 'migracoes.txt'
  [System.IO.File]::WriteAllText($lista, (($migs -join "`n") + "`n"), (New-Object System.Text.UTF8Encoding $false))
  $ficheiros = @($migs | ForEach-Object { "supabase\migrations\$_.sql" })
  Correr 'enviar migracoes' { scp @ficheiros "${Destino}:~/sci-novo/" }
  Correr 'enviar lista de migracoes' { scp $lista "${Destino}:~/sci-novo/migracoes.txt" }
}

# o script do servidor tem de ter fins de linha do Linux (LF), mesmo que o git tenha posto CRLF
$sh = Join-Path $env:TEMP 'aplicar-no-servidor.sh'
$txt = (Get-Content -Raw (Join-Path $PSScriptRoot 'aplicar-no-servidor.sh')) -replace "`r`n", "`n"
[System.IO.File]::WriteAllText($sh, $txt, (New-Object System.Text.UTF8Encoding $false))
Correr 'enviar script do servidor' { scp $sh "${Destino}:~/sci-novo/aplicar-no-servidor.sh" }

# ------------------------------------------------------------------ 5. aplicar no servidor
Passo '5. Aplicar no servidor (backup, migracoes, publicar, recarregar nginx)'
ssh -t $Destino 'bash ~/sci-novo/aplicar-no-servidor.sh'
if ($LASTEXITCODE -ne 0) { Parar 'o script do servidor terminou com erro - le as mensagens acima. Nada foi publicado depois do erro.' }

Write-Host ''
Write-Host "Feito. Ficheiro principal esperado no servidor: $principal" -ForegroundColor Green
Write-Host 'No navegador: abre em janela privada (ou F12 > Application > Service Workers > Unregister + Clear site data).' -ForegroundColor Yellow
