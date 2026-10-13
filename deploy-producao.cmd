@echo off
rem Deploy do SCI para producao. Duplo-clique neste ficheiro (ou corre-o num terminal).
rem A janela fica aberta no fim para se poder ler o resultado.
rem Opcoes (so a partir de um terminal), por exemplo:
rem     deploy-producao.cmd -SoVerificar
rem     deploy-producao.cmd -BaselineAte 20260912090000_renovacao_cartoes_audit_fixes
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "production\deploy\deploy-sci.ps1" %*
set CODIGO=%ERRORLEVEL%
echo.
if "%CODIGO%"=="0" (
  echo Terminou sem erros.
) else (
  echo TERMINOU COM ERRO ^(codigo %CODIGO%^) - le as mensagens acima.
)
echo.
pause
exit /b %CODIGO%
