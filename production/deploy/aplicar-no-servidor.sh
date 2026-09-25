#!/bin/bash
# Corre NO SERVIDOR (chamado por deploy-sci.ps1 via "ssh -t"). Assume:
#   ~/sci-novo/dist            build novo
#   ~/sci-novo/migracoes.txt   migracoes a aplicar, uma por linha, sem .sql (pode nao existir)
#   ~/sci-novo/<nome>.sql      as migracoes
# Ordem: backup -> ver o que ja existe -> aplicar migracoes -> publicar -> nginx -> confirmar.
# Pára ao primeiro erro; se uma migracao falhar, NAO publica o front-end.
set -u

PASTA="$HOME/sci-novo"
WEB=/var/www/sci
DB=supabase-db

fim() { echo; echo "ERRO: $1"; exit 1; }

[ -d "$PASTA/dist" ] || fim "nao existe $PASTA/dist"
[ -f "$PASTA/dist/index.html" ] || fim "$PASTA/dist/index.html nao existe"

echo "== 1. Backup da base"
BK="$HOME/backup_antes_$(date +%F_%H%M).sql"
sudo docker exec "$DB" pg_dump -U postgres postgres > "$BK" || fim "o backup falhou"
[ -s "$BK" ] || fim "o backup ficou vazio"
ls -lh "$BK"

echo
echo "== 2. O que ja esta aplicado (funcoes das migracoes recentes)"
sudo docker exec -i "$DB" psql -U postgres -c "select proname from pg_proc where proname in ('guardar_nota_passagem_turno','criar_lote_renovacao','adicionar_entrada_passagem_turno','arquivar_entradas_passagem_turno') order by 1"

if [ -s "$PASTA/migracoes.txt" ]; then
  echo "Migracoes a aplicar:"; sed 's/^/  - /' "$PASTA/migracoes.txt"
  read -r -p "Aplicar estas migracoes? (s/n) " R
  case "$R" in
    s|S|y|Y) ;;
    *) fim "cancelado antes das migracoes (nada foi publicado)" ;;
  esac
  echo
  echo "== 3. Migracoes"
  while IFS= read -r M; do
    [ -z "$M" ] && continue
    echo "-- $M"
    [ -f "$PASTA/$M.sql" ] || fim "falta o ficheiro $M.sql"
    sudo docker exec -i "$DB" psql -U postgres -v ON_ERROR_STOP=1 < "$PASTA/$M.sql" || fim "a migracao $M falhou (nada foi publicado; o backup esta em $BK)"
  done < "$PASTA/migracoes.txt"
else
  echo "(sem migracoes neste deploy)"
fi

echo
echo "== 4. Publicar o front-end (copia por cima, sem apagar o que la esta)"
sudo cp -r "$PASTA/dist/." "$WEB/" || fim "a copia para $WEB falhou"
sudo chown -R www-data:www-data "$WEB" || fim "o chown falhou"
sudo nginx -t || fim "a configuracao do nginx tem erros (nao recarreguei)"
sudo systemctl reload nginx || fim "nao consegui recarregar o nginx"

echo
echo "== 5. Confirmar"
NOVO=$(grep -o 'assets/index-[^"]*\.js' "$PASTA/dist/index.html" | head -1)
SERVIDO=$(curl -sk https://127.0.0.1:8443/ | grep -o 'assets/index-[^"]*\.js' | head -1)
echo "Build enviado : $NOVO"
echo "Nginx serve   : $SERVIDO"
if [ "$NOVO" = "$SERVIDO" ] && [ -n "$NOVO" ]; then
  echo "OK: o servidor esta a servir a versao nova."
else
  echo "ATENCAO: o que o nginx serve nao e o build novo. Ve o 'root' do vhost sci em /etc/nginx/sites-available/sci."
fi
echo
echo "Alertas de hora certa ativos:"
sudo docker exec -i "$DB" psql -U postgres -c "select alert_time, alert_name from daily_alerts where is_active order by 1"
echo
echo "Concluido. Backup: $BK"
