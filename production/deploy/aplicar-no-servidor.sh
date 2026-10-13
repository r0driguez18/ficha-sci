#!/bin/bash
# Corre NO SERVIDOR (chamado por deploy-sci.ps1 via "ssh -t"). Assume:
#   ~/sci-novo/dist           build novo
#   ~/sci-novo/todas.txt      TODAS as migracoes do projeto, por ordem, uma por linha, sem .sql
#                             (pode nao existir: deploy sem migracoes)
#   ~/sci-novo/<nome>.sql     as migracoes
#   ~/sci-novo/versao.txt     uma linha com a versao (commit) que se esta a publicar
# Variavel opcional: BASELINE=<nome da ultima migracao ja aplicada em producao>, so na 1.a vez.
#
# O servidor guarda que migracoes ja aplicou (deploy.migracoes_aplicadas) e aplica
# so as que faltam, cada uma numa transacao junto com o seu registo.
# Ordem: backup -> migracoes em falta -> publicar -> nginx -> confirmar.
# Para ao primeiro erro; se uma migracao falhar, NAO publica o front-end.
set -u
export LC_ALL=C   # comparacao de nomes de migracoes sempre por ordem de bytes

PASTA="$HOME/sci-novo"
WEB="${WEB:-/var/www/sci}"
DB=supabase-db
BASELINE="${BASELINE:-}"

fim() { echo; echo "ERRO: $1"; exit 1; }
# ATENCAO: o docker exec -i le o stdin. Dentro de um "while read" isso engole o resto da lista,
# por isso as chamadas que nao precisam de stdin levam </dev/null.
psql_db() { sudo docker exec -i "$DB" psql -U postgres "$@"; }

[ -d "$PASTA/dist" ] || fim "nao existe $PASTA/dist"
[ -f "$PASTA/dist/index.html" ] || fim "$PASTA/dist/index.html nao existe"

echo "== 1. Backup da base"
BK="$HOME/backup_antes_$(date +%F_%H%M).sql"
sudo docker exec "$DB" pg_dump -U postgres postgres > "$BK" || fim "o backup falhou"
[ -s "$BK" ] || fim "o backup ficou vazio"
ls -lh "$BK"

echo
echo "== 2. Migracoes"
if [ -s "$PASTA/todas.txt" ]; then
  # Schema proprio (fora do que o PostgREST expoe): a tabela nunca fica acessivel pela API.
  psql_db -v ON_ERROR_STOP=1 -q <<'SQL' || fim "nao consegui preparar o registo de migracoes"
create schema if not exists deploy;
revoke all on schema deploy from public;
create table if not exists deploy.migracoes_aplicadas (
  nome        text primary key,
  aplicada_em timestamptz not null default now(),
  origem      text not null default 'deploy'
);
revoke all on deploy.migracoes_aplicadas from public;
SQL

  N=$(psql_db -tA -c "select count(*) from deploy.migracoes_aplicadas" </dev/null | tr -d '[:space:]')
  if [ "$N" = "0" ]; then
    # Primeira vez neste servidor: nao se sabe o que ja la esta, por isso pede-se a ultima ja aplicada.
    [ -n "$BASELINE" ] || fim "primeira vez: diz qual a ultima migracao JA aplicada (deploy-sci.ps1 -BaselineAte <nome>)"
    echo "Primeira vez: a marcar como ja aplicadas todas as migracoes ate $BASELINE (inclusive)."
    while IFS= read -r M; do
      [ -z "$M" ] && continue
      if [[ "$M" < "$BASELINE" || "$M" == "$BASELINE" ]]; then
        psql_db -q -v ON_ERROR_STOP=1 -c "insert into deploy.migracoes_aplicadas(nome, origem) values ('$M', 'baseline') on conflict do nothing" </dev/null \
          || fim "nao consegui registar $M"
      fi
    done < "$PASTA/todas.txt"
  fi

  psql_db -tA -c "select nome from deploy.migracoes_aplicadas order by 1" </dev/null > "$PASTA/aplicadas.txt" || fim "nao consegui ler as migracoes aplicadas"
  grep -vxFf "$PASTA/aplicadas.txt" "$PASTA/todas.txt" > "$PASTA/em-falta.txt"

  if [ -s "$PASTA/em-falta.txt" ]; then
    echo "Migracoes por aplicar:"; sed 's/^/  - /' "$PASTA/em-falta.txt"
    read -r -p "Aplicar estas migracoes? (s/n) " R
    case "$R" in
      s|S|y|Y) ;;
      *) fim "cancelado antes das migracoes (nada foi publicado)" ;;
    esac
    while IFS= read -r M; do
      [ -z "$M" ] && continue
      echo "-- $M"
      [ -f "$PASTA/$M.sql" ] || fim "falta o ficheiro $M.sql"
      # A migracao e o seu registo na mesma transacao: ou ficam as duas, ou nenhuma.
      { cat "$PASTA/$M.sql"; printf "\ninsert into deploy.migracoes_aplicadas(nome) values ('%s');\n" "$M"; } \
        | psql_db -q -1 -v ON_ERROR_STOP=1 \
        || fim "a migracao $M falhou (nada foi publicado; o backup esta em $BK)"
    done < "$PASTA/em-falta.txt"
  else
    echo "Nenhuma migracao em falta."
  fi
else
  echo "(sem migracoes neste deploy)"
fi

echo
echo "== 3. Publicar o front-end (copia por cima, sem apagar o que la esta)"
sudo cp -r "$PASTA/dist/." "$WEB/" || fim "a copia para $WEB falhou"
sudo chown -R www-data:www-data "$WEB" || fim "o chown falhou"
sudo nginx -t || fim "a configuracao do nginx tem erros (nao recarreguei)"
sudo systemctl reload nginx || fim "nao consegui recarregar o nginx"

echo
echo "== 4. Confirmar"
NOVO=$(grep -o 'assets/index-[^"]*\.js' "$PASTA/dist/index.html" | head -1)
SERVIDO=$(curl -sk https://127.0.0.1:8443/ | grep -o 'assets/index-[^"]*\.js' | head -1)
echo "Build enviado : $NOVO"
echo "Nginx serve   : $SERVIDO"
if [ "$NOVO" = "$SERVIDO" ] && [ -n "$NOVO" ]; then
  echo "OK: o servidor esta a servir a versao nova."
  RESULTADO=ok
else
  echo "ATENCAO: o que o nginx serve nao e o build novo. Ve o 'root' do vhost sci em /etc/nginx/sites-available/sci."
  RESULTADO=verificar
fi

# Registo do que foi publicado e quando (para saber, mais tarde, que versao la esta).
VERSAO="$(cat "$PASTA/versao.txt" 2>/dev/null || echo '?')"
echo "$(date '+%F %H:%M') | $VERSAO | $NOVO | $RESULTADO | backup: $BK" >> "$HOME/sci-versoes.log"

echo
echo "Concluido. Backup: $BK   (registo: ~/sci-versoes.log)"
