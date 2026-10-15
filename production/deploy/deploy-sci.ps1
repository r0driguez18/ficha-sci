<#
  Deploy do SCI para o servidor de producao (Ubuntu + nginx + Supabase em Docker).

  Corre-se na maquina que alcanca o servidor, a partir da pasta do projeto:

      .\production\deploy\deploy-sci.ps1

  Duas redes: o GitHub so se alcanca na rede com Internet (WiFi) e o servidor so na rede interna
  (cabo). O script aguenta as duas: sem acesso ao GitHub usa a versao que ja esta nesta pasta
  (aviso no ecra) e so o envio precisa do cabo. Para ter a versao mais recente, faz o git pull
  uma vez no WiFi (ou deixa o script faze-lo la), e depois liga o cabo e corre o deploy.

  O que faz (por ordem; pede confirmacao antes de mexer no servidor):
    0. confirma que o servidor esta ao alcance (senao pede para ligar o cabo)
    1. git pull da main, se houver acesso ao GitHub (recusa se houver alteracoes locais por guardar)
    2. npm install (so se for preciso) + npm run build
    3. verifica que o build aponta para o servidor certo (e nao para localhost)
    4. limpa ~/sci-novo no servidor e envia o dist, as migracoes e o script do servidor
    5. corre o script do servidor: backup, migracoes EM FALTA, publica, recarrega o nginx, confirma

  As migracoes: o servidor guarda quais ja aplicou e so aplica as que faltam. Nao ha lista
  para manter a mao.

  Opcoes:
    -SoVerificar            so faz os passos 1 a 3 (nao toca no servidor)
    -SemMigracoes           nao envia nem aplica migracoes
    -BaselineAte <nome>     So conta na PRIMEIRA vez neste servidor (depois o servidor ignora): nome
                            (sem .sql) da ultima migracao que JA estava aplicada em producao. Por
                            omissao ja vem preenchido com a de 2026-09-14 - normalmente nao se mexe.
    -AdminEmail <email>     So se for preciso: email da conta que passa a administrador (operador
                            nalves). Por omissao o deploy promove sozinho o operador nalves, se ainda
                            nao houver nenhum administrador.
    -AdminCodigo <codigo>   Operador a promover com -AdminEmail (por omissao: nalves).
    -Utilizador dis         utilizador de SSH no servidor (por omissao: dis)
    -Servidor ...           endereco do servidor (por omissao: 172.20.11.54)

  Dica: com uma chave SSH instalada no servidor deixa de pedir a palavra-passe a cada passo
  (ver "Deploy para producao" no README).

  Este ficheiro so tem ASCII de proposito (o PowerShell 5 le mal acentos sem BOM).
#>
param(
  [string]$Servidor = '172.20.11.54',
  [string]$Utilizador = 'dis',
  [string]$BaselineAte = '20260912090000_renovacao_cartoes_audit_fixes',
  [string]$AdminEmail = '',
  [string]$AdminCodigo = 'nalves',
  [switch]$SoVerificar,
  [switch]$SemMigracoes
)

$ErrorActionPreference = 'Stop'

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

# Corre um comando externo com tempo limite (segundos); devolve $true se terminou bem a tempo.
function ComTempoLimite([string]$exe, [string[]]$argumentos, [int]$segundos) {
  $env:GIT_TERMINAL_PROMPT = '0'   # nunca ficar parado a pedir credenciais
  $proc = Start-Process -FilePath $exe -ArgumentList $argumentos -NoNewWindow -PassThru
  $null = $proc.Handle   # sem isto o ExitCode pode vir vazio no PowerShell 5
  if (-not $proc.WaitForExit($segundos * 1000)) {
    try { $proc.Kill() } catch { }
    return $false
  }
  $proc.WaitForExit()
  return ($proc.ExitCode -eq 0)
}

# O servidor so se alcanca na rede interna (cabo). Falha logo, antes de perder tempo no build.
if (-not $SoVerificar) {
  Passo '0. O servidor esta ao alcance?'
  $tcp = New-Object System.Net.Sockets.TcpClient
  $alcanca = $false
  try {
    $r = $tcp.BeginConnect($Servidor, 22, $null, $null)
    $alcanca = $r.AsyncWaitHandle.WaitOne(6000, $false) -and $tcp.Connected
  } catch { $alcanca = $false }
  finally { $tcp.Close() }
  if (-not $alcanca) {
    Parar "nao consigo chegar ao servidor $Servidor (porta 22). Liga o cabo de rede (rede interna) e tenta de novo. No WiFi so se chega ao GitHub, nao ao servidor."
  }
  Write-Host "Servidor $Servidor alcancavel." -ForegroundColor Green
}

# ------------------------------------------------------------------ 1. codigo
Passo '1. Codigo (git)'
$sujo = git status --short
if ($sujo) { Write-Host $sujo; Parar 'ha alteracoes locais por guardar - resolve isso antes (git status).' }
Correr 'git checkout main' { git checkout main }

# Atualizar a partir do GitHub so se houver Internet. Na rede do cabo nao ha: usa a versao desta pasta.
Write-Host ''
Write-Host '== a ver se ha versao mais recente no GitHub (30 s no maximo)' -ForegroundColor Cyan
$temGit = ComTempoLimite 'git' @('fetch', 'origin', 'main') 30
if ($temGit) {
  & git merge --ff-only origin/main
  if ($LASTEXITCODE -ne 0) { Parar 'a main desta pasta divergiu do GitHub - resolve com git status / git log.' }
} else {
  Write-Host 'Sem acesso ao GitHub (normal na rede do cabo): a usar a versao que ja esta nesta pasta.' -ForegroundColor Yellow
}
$versao = (git log --oneline -1)
Write-Host "Versao: $versao" -ForegroundColor Green

# ------------------------------------------------------------------ 2. build
if (-not (Test-Path '.env.production.local')) {
  Parar 'falta o ficheiro .env.production.local (tem o endereco do servidor; nao vai para o git).'
}
if (-not (Select-String -Path '.env.production.local' -SimpleMatch $Servidor -Quiet)) {
  Parar ".env.production.local nao tem o endereco $Servidor - o build ficaria a apontar para outro sitio."
}
# npm install precisa de Internet: so se as dependencias mudaram desde a ultima instalacao.
$precisaInstalar = $true
if ((Test-Path 'node_modules\.package-lock.json') -and (Test-Path 'package-lock.json')) {
  $precisaInstalar = (Get-Item 'package-lock.json').LastWriteTime -gt (Get-Item 'node_modules\.package-lock.json').LastWriteTime
}
if ($precisaInstalar) {
  Correr 'npm install (as dependencias mudaram; precisa de Internet)' { npm install --no-audit --no-fund }
} else {
  Passo 'npm install: nao e preciso (dependencias iguais as da ultima instalacao)'
}
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
# Todas as migracoes do projeto, por ordem: o servidor decide quais faltam.
$migs = @()
if (-not $SemMigracoes) {
  $migs = @(Get-ChildItem -Path 'supabase\migrations' -Filter '*.sql' | Sort-Object Name | ForEach-Object { $_.BaseName })
}
if ($BaselineAte -and $migs.Count -gt 0 -and ($migs -notcontains $BaselineAte)) {
  Parar "-BaselineAte $BaselineAte nao e o nome de nenhuma migracao em supabase\migrations."
}

Write-Host ''
Write-Host "Vou enviar para $Destino :" -ForegroundColor Yellow
Write-Host "  versao : $versao"
Write-Host "  dist   : $principal"
if ($migs.Count -gt 0) {
  Write-Host "  migracoes: $($migs.Count) no projeto (o servidor aplica so as que faltam)"
  if ($BaselineAte) { Write-Host "  (so na 1.a vez neste servidor: ja aplicadas ate $BaselineAte)" }
} else {
  Write-Host '  migracoes: nenhuma'
}
$r = Read-Host 'Continuar? (s/n)'
if ($r -notmatch '^[sSyY]') { Write-Host 'Cancelado.'; exit 0 }

Passo '4. Enviar para o servidor'
Correr 'limpar ~/sci-novo no servidor' { ssh -t $Destino 'sudo rm -rf ~/sci-novo && mkdir -p ~/sci-novo/functions' }
Correr 'enviar dist' { scp -r dist "${Destino}:~/sci-novo/" }
# todas as funcoes do projeto (admin-utilizadores, repor-senha, ...)
if (Test-Path 'supabase/functions') {
  foreach ($pastaFn in (Get-ChildItem 'supabase/functions' -Directory)) {
    $caminhoFn = 'supabase/functions/' + $pastaFn.Name
    Correr ('enviar funcao ' + $pastaFn.Name) { scp -r $caminhoFn "${Destino}:~/sci-novo/functions/" }
  }
}

if ($migs.Count -gt 0) {
  $lista = Join-Path $env:TEMP 'todas.txt'
  [System.IO.File]::WriteAllText($lista, (($migs -join "`n") + "`n"), (New-Object System.Text.UTF8Encoding $false))
  $ficheiros = @($migs | ForEach-Object { "supabase\migrations\$_.sql" })
  Correr 'enviar migracoes' { scp @ficheiros "${Destino}:~/sci-novo/" }
  Correr 'enviar lista de migracoes' { scp $lista "${Destino}:~/sci-novo/todas.txt" }
}

$ver = Join-Path $env:TEMP 'versao.txt'
[System.IO.File]::WriteAllText($ver, ($versao + "`n"), (New-Object System.Text.UTF8Encoding $false))
Correr 'enviar versao' { scp $ver "${Destino}:~/sci-novo/versao.txt" }

# o script do servidor tem de ter fins de linha do Linux (LF), mesmo que o git tenha posto CRLF
$sh = Join-Path $env:TEMP 'aplicar-no-servidor.sh'
$txt = (Get-Content -Raw (Join-Path $PSScriptRoot 'aplicar-no-servidor.sh')) -replace "`r`n", "`n"
[System.IO.File]::WriteAllText($sh, $txt, (New-Object System.Text.UTF8Encoding $false))
Correr 'enviar script do servidor' { scp $sh "${Destino}:~/sci-novo/aplicar-no-servidor.sh" }

# auxiliar que faz o nginx encaminhar /functions/v1/ (tambem com fins de linha LF)
$shNginx = Join-Path $env:TEMP 'nginx-funcoes.sh'
$txtNginx = (Get-Content -Raw (Join-Path $PSScriptRoot 'nginx-funcoes.sh')) -replace "`r`n", "`n"
[System.IO.File]::WriteAllText($shNginx, $txtNginx, (New-Object System.Text.UTF8Encoding $false))
Correr 'enviar auxiliar do nginx' { scp $shNginx "${Destino}:~/sci-novo/nginx-funcoes.sh" }

# auxiliar que define a validade dos links de definir senha (LF tambem)
$shAuth = Join-Path $env:TEMP 'auth-validade-link.sh'
$txtAuth = (Get-Content -Raw (Join-Path $PSScriptRoot 'auth-validade-link.sh')) -replace "`r`n", "`n"
[System.IO.File]::WriteAllText($shAuth, $txtAuth, (New-Object System.Text.UTF8Encoding $false))
Correr 'enviar auxiliar da validade dos links' { scp $shAuth "${Destino}:~/sci-novo/auth-validade-link.sh" }

# ------------------------------------------------------------------ 5. aplicar no servidor
Passo '5. Aplicar no servidor (backup, migracoes em falta, publicar, recarregar nginx)'
$cmd = 'bash ~/sci-novo/aplicar-no-servidor.sh'
if ($BaselineAte) { $cmd = "BASELINE=$BaselineAte $cmd" }
if ($AdminEmail) {
  if ($AdminEmail -notmatch '^[A-Za-z0-9._%+@-]+$') { Parar '-AdminEmail com caracteres invalidos.' }
  if ($AdminCodigo -notmatch '^[a-z][a-z0-9_]{2,19}$') { Parar '-AdminCodigo invalido.' }
  $cmd = "ADMIN_EMAIL=$AdminEmail ADMIN_CODIGO=$AdminCodigo $cmd"
}
ssh -t $Destino $cmd
if ($LASTEXITCODE -ne 0) { Parar 'o script do servidor terminou com erro - le as mensagens acima. Nada foi publicado depois do erro.' }

Write-Host ''
Write-Host "Feito. Ficheiro principal esperado no servidor: $principal" -ForegroundColor Green
Write-Host 'No navegador: abre em janela privada (ou F12 > Application > Service Workers > Unregister + Clear site data).' -ForegroundColor Yellow
