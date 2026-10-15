#!/bin/bash
# Faz o nginx encaminhar /functions/v1/ para o Supabase (Kong), seguindo o que o proprio vhost
# ja faz para /auth/, /rest/, /storage/ e /realtime/. Corre NO SERVIDOR (chamado pelo deploy).
#
#   bash nginx-funcoes.sh [ficheiro-do-vhost]      (por omissao: /etc/nginx/sites-available/sci)
#
# Dois formatos reconhecidos:
#   1) uma rota por expressao regular, ex.:  location ~ ^/(rest|auth|storage|realtime)/ { ... }
#      -> acrescenta "functions" ao grupo (a mesma rota passa a servir tambem /functions/).
#   2) rotas por prefixo, ex.:  location /auth/v1/ { proxy_pass http://127.0.0.1:8000/auth/v1/; }
#      -> acrescenta um bloco novo, com o mesmo destino, antes da primeira.
#
# - Se /functions ja estiver encaminhado, nao faz nada.
# - Faz copia de seguranca, altera, corre "nginx -t"; se falhar, repoe o ficheiro como estava.
# - So recarrega o nginx se o teste passar.
#
# Variaveis (so para testes): SUDO (por omissao "sudo"), NGINX_TESTE, NGINX_RECARREGAR.
set -u

CONF="${1:-/etc/nginx/sites-available/sci}"
SUDO="${SUDO-sudo}"
NGINX_TESTE="${NGINX_TESTE:-$SUDO nginx -t}"
NGINX_RECARREGAR="${NGINX_RECARREGAR:-$SUDO systemctl reload nginx}"

say() { echo "nginx-funcoes: $*"; }

[ -f "$CONF" ] || { say "nao encontro $CONF"; exit 10; }

# Ja encaminha? (uma "location" sem comentario que mencione functions)
if grep -qE '^[[:space:]]*location[^#]*functions' "$CONF"; then
  say "ja encaminha /functions/ (nada a fazer)."
  exit 0
fi

NOVO="$(mktemp)"
trap 'rm -f "$NOVO"' EXIT
DESCRICAO=""

# --- formato 1: uma regex com grupo (rest|auth|storage|realtime), sem "v1" no texto
LINHA_RE="$(grep -nE '^[[:space:]]*location[[:space:]]+~\*?[[:space:]]+[^#{]*\([^)]*(auth|rest|storage|realtime)[^)]*\)' "$CONF" | head -n1 | cut -d: -f1)"
if [ -n "$LINHA_RE" ] && ! sed -n "${LINHA_RE}p" "$CONF" | grep -q 'v1'; then
  sed -E "${LINHA_RE}s/\(([^)]*(auth|rest|storage|realtime)[^)]*)\)/(\1|functions)/" "$CONF" > "$NOVO"
  DESCRICAO="rota por expressao regular da linha ${LINHA_RE}: acrescentado 'functions'"
fi

# --- formato 2: rotas por prefixo/regex com /v1
if [ -z "$DESCRICAO" ]; then
  LINHA="$(grep -nE '^[[:space:]]*location[^#]*(auth|rest|storage|realtime)[^#]*v1' "$CONF" | head -n1 | cut -d: -f1)"
  if [ -z "$LINHA" ]; then
    say "nao encontrei no vhost nenhuma rota /auth/, /rest/, /storage/ ou /realtime/ para seguir."
    exit 11
  fi

  # O destino (proxy_pass) dessa location: do inicio do bloco ao fecho da chave.
  DESTINO="$(awk -v n="$LINHA" '
    NR < n { next }
    {
      linha = $0
      sub(/#.*/, "", linha)
      if (match(linha, /proxy_pass[[:space:]]+[^;]+;/)) {
        v = substr(linha, RSTART, RLENGTH)
        sub(/proxy_pass[[:space:]]+/, "", v); sub(/;.*/, "", v)
        print v; exit
      }
      abre += gsub(/\{/, "{", linha); fecha += gsub(/\}/, "}", linha)
      if (abre > 0 && abre == fecha) exit
    }' "$CONF")"

  # So esquema://servidor[:porta] — o caminho (/auth/v1/…) nao se copia.
  BASE="$(printf '%s' "$DESTINO" | sed -nE 's#^(https?://[^/[:space:]]+).*#\1#p')"
  if [ -z "$BASE" ]; then
    say "nao consegui ler o proxy_pass da rota encontrada (encontrei: '${DESTINO:-nada}')."
    exit 12
  fi

  INDENT="$(sed -n "${LINHA}p" "$CONF" | sed -E 's/^([[:space:]]*).*/\1/')"
  {
    head -n $((LINHA - 1)) "$CONF"
    cat <<EOF
${INDENT}# Funcoes do Supabase (administracao de utilizadores)
${INDENT}location /functions/v1/ {
${INDENT}    proxy_pass ${BASE};
${INDENT}    proxy_http_version 1.1;
${INDENT}    proxy_set_header Host \$host;
${INDENT}    proxy_set_header X-Real-IP \$remote_addr;
${INDENT}    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
${INDENT}    proxy_set_header X-Forwarded-Proto \$scheme;
${INDENT}    proxy_read_timeout 60s;
${INDENT}    client_max_body_size 1m;
${INDENT}}

EOF
    tail -n +"$LINHA" "$CONF"
  } > "$NOVO"
  DESCRICAO="bloco novo /functions/v1/ -> ${BASE}"
fi

COPIA="${CONF}.antes-funcoes.$(date +%Y%m%d%H%M%S)"
$SUDO cp -p "$CONF" "$COPIA" || { say "nao consegui fazer a copia de seguranca"; exit 13; }
$SUDO cp "$NOVO" "$CONF" || { say "nao consegui escrever $CONF"; exit 14; }

if $NGINX_TESTE >/dev/null 2>&1; then
  if $NGINX_RECARREGAR; then
    say "OK: $DESCRICAO (copia de seguranca: $COPIA)"
    exit 0
  fi
  say "o teste passou mas nao consegui recarregar o nginx (copia: $COPIA)"
  exit 15
fi

say "o nginx -t falhou com a alteracao: a repor o ficheiro original."
$SUDO cp -p "$COPIA" "$CONF"
$NGINX_TESTE 2>&1 | tail -n 3
exit 16
