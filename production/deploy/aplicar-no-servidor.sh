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
echo "== 2b. Administracao de utilizadores (funcao no servidor + administrador)"
# Nada daqui para o deploy: se algo falhar, avisa e o front-end publica-se na mesma.

# --- as funcoes (admin-utilizadores, repor-senha, ...), so as que vieram no deploy
if ls "$PASTA"/functions/*/index.ts >/dev/null 2>&1; then
  if sudo docker inspect supabase-edge-functions >/dev/null 2>&1; then
    DESTINO_FN="$(sudo docker inspect supabase-edge-functions \
      --format '{{range .Mounts}}{{if eq .Destination "/home/deno/functions"}}{{.Source}}{{end}}{{end}}' 2>/dev/null)"
    if [ -n "$DESTINO_FN" ] && [ -d "$DESTINO_FN" ]; then
      for FN_IDX in "$PASTA"/functions/*/index.ts; do
        FN_NOME="$(basename "$(dirname "$FN_IDX")")"
        sudo mkdir -p "$DESTINO_FN/$FN_NOME" \
          && sudo cp "$FN_IDX" "$DESTINO_FN/$FN_NOME/index.ts" \
          && echo "Funcao instalada: $FN_NOME (em $DESTINO_FN)" \
          || echo "AVISO: nao consegui copiar a funcao $FN_NOME para $DESTINO_FN"
      done
    else
      echo "AVISO: nao encontrei a pasta de funcoes do contentor supabase-edge-functions (montagem em /home/deno/functions)."
    fi
  else
    echo "AVISO: nao existe o contentor supabase-edge-functions - a administracao de utilizadores nao vai funcionar."
  fi

  # A rota tem de chegar ao Kong. Se o nginx devolver a pagina da app (HTML), 404 ou 405 (um POST a um
  # ficheiro estatico), nao esta a encaminhar /functions/v1/.
  rota_ok() {
    RESP="$(curl -sk --max-time 10 -o - -w '\n%{http_code}' -X POST -H 'Content-Type: application/json' -d '{}' \
              https://127.0.0.1:8443/functions/v1/admin-utilizadores 2>/dev/null || true)"
    CODIGO_HTTP="$(printf '%s' "$RESP" | tail -n1)"
    if printf '%s' "$RESP" | grep -qi '<html\|<!doctype' || [ -z "$CODIGO_HTTP" ] \
       || [ "$CODIGO_HTTP" = "404" ] || [ "$CODIGO_HTTP" = "405" ]; then
      return 1
    fi
    return 0
  }

  if rota_ok; then
    echo "Rota /functions/v1/ OK (resposta $CODIGO_HTTP)."
  else
    echo "O nginx NAO encaminha /functions/v1/ para o Supabase (resposta $CODIGO_HTTP). A tentar corrigir o vhost..."
    if [ -f "$PASTA/nginx-funcoes.sh" ] && bash "$PASTA/nginx-funcoes.sh" "${NGINX_VHOST:-/etc/nginx/sites-available/sci}"; then
      sleep 1
      if rota_ok; then
        echo "Rota /functions/v1/ OK depois da correcao (resposta $CODIGO_HTTP)."
      else
        echo "AVISO: corrigi o nginx mas a rota continua sem responder bem (resposta $CODIGO_HTTP)."
        echo "       Confirma que o contentor supabase-edge-functions esta a correr: sudo docker ps | grep functions"
      fi
    else
      echo "AVISO: nao consegui corrigir o nginx sozinho. No vhost do SCI (/etc/nginx/sites-available/sci),"
      echo "       junto das rotas /auth/v1/ e /rest/v1/, acrescenta um location /functions/v1/ com o mesmo"
      echo "       proxy_pass, e faz: sudo nginx -t && sudo systemctl reload nginx"
    fi
  fi
fi

# --- primeiro administrador (so se ainda nao houver nenhum)
if [ -n "${ADMIN_EMAIL:-}" ]; then
  # So valores simples: vao dentro de SQL.
  [[ "$ADMIN_EMAIL" =~ ^[A-Za-z0-9._%+@-]+$ ]] || fim "ADMIN_EMAIL com caracteres invalidos"
  AC="${ADMIN_CODIGO:-nalves}"
  [[ "$AC" =~ ^[a-z][a-z0-9_]{2,19}$ ]] || fim "ADMIN_CODIGO invalido"
  RES="$(psql_db -tA -v ON_ERROR_STOP=1 <<SQL
UPDATE public.operators
   SET papel = 'administrador',
       user_id = (SELECT id FROM auth.users WHERE lower(email) = lower('$ADMIN_EMAIL') LIMIT 1)
 WHERE value = '$AC'
   AND EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('$ADMIN_EMAIL'))
RETURNING value;
SQL
)" || fim "nao consegui definir o administrador"
  if [ -n "$RES" ]; then echo "Administrador: operador $RES ligado a $ADMIN_EMAIL."; else echo "AVISO: nao existe a conta $ADMIN_EMAIL (ou o operador $AC)."; fi
else
  TEM_ADMIN="$(psql_db -tA -c "select count(*) from public.operators where papel='administrador' and ativo and user_id is not null" </dev/null | tr -d '[:space:]')"
  if [ "$TEM_ADMIN" = "0" ]; then
    RES="$(psql_db -tA -v ON_ERROR_STOP=1 <<'SQL'
UPDATE public.operators SET papel = 'administrador'
 WHERE value = 'nalves' AND user_id IS NOT NULL
RETURNING value;
SQL
)" || fim "nao consegui definir o administrador"
    if [ -n "$RES" ]; then
      echo "Ainda nao havia administrador: o operador $RES passou a administrador."
    else
      echo "AVISO: ainda nao ha administrador e o operador nalves nao tem conta ligada."
      echo "       Corre o deploy uma vez com: -AdminEmail <o email da tua conta>"
    fi
  else
    echo "Administrador(es) ja definido(s): $TEM_ADMIN."
  fi
fi

echo
echo "== 2c. Validade dos links de definir senha (24 h)"
if [ -f "$PASTA/auth-validade-link.sh" ]; then
  bash "$PASTA/auth-validade-link.sh" 24 || echo "AVISO: nao consegui alterar a validade dos links (ficam com a que ja tinham, 1 h por omissao)."
else
  echo "(auxiliar nao enviado)"
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
