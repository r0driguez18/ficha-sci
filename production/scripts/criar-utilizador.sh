#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# SCI - criar utilizador sem que ninguem (nem quem o cria) saiba a palavra-passe.
#
# Corre-se NO SERVIDOR (Ubuntu), por SSH, com o Supabase a funcionar.
#
#   ./criar-utilizador.sh nome@dominio
#       Cria a conta (ou reutiliza-a, se ja existir) com uma palavra-passe
#       aleatoria que nunca e mostrada, e imprime um LINK. A pessoa abre o link
#       no browser e define ela a sua palavra-passe.
#
#   ./criar-utilizador.sh nome@dominio --temporaria
#       Cria a conta com uma palavra-passe temporaria (impressa uma unica vez).
#       No primeiro login a aplicacao obriga a pessoa a trocar a palavra-passe
#       antes de a deixar entrar.
#
# Configuracao (variaveis de ambiente; todas opcionais):
#   SCI_URL_PUBLICA   endereco da aplicacao como os colegas a abrem
#                     (por omissao: https://172.20.11.54:8443)
#   SUPABASE_URL      API do Supabase vista do servidor
#                     (por omissao: http://localhost:8000)
#   SERVICE_ROLE_KEY  chave de administracao. Se nao vier, le-se de SUPABASE_ENV
#                     (ficheiro .env do docker do Supabase) ou do contentor
#                     supabase-kong. Nunca e impressa nem vai na linha de comandos.
# -----------------------------------------------------------------------------
set -euo pipefail
umask 077

SCI_URL_PUBLICA="${SCI_URL_PUBLICA:-https://172.20.11.54:8443}"
SUPABASE_URL="${SUPABASE_URL:-http://localhost:8000}"
SCI_URL_PUBLICA="${SCI_URL_PUBLICA%/}"
SUPABASE_URL="${SUPABASE_URL%/}"

erro() { echo "ERRO: $*" >&2; exit 1; }

uso() {
  awk 'NR > 2 && /^# ---/ { exit } NR > 2 { sub(/^# ?/, ""); print }' "$0" >&2
  exit 2
}

# --- argumentos --------------------------------------------------------------
EMAIL=""
TEMPORARIA=0
for arg in "$@"; do
  case "$arg" in
    --temporaria) TEMPORARIA=1 ;;
    -h|--help) uso ;;
    -*) erro "opcao desconhecida: $arg" ;;
    *) [ -z "$EMAIL" ] || erro "so um email por vez"; EMAIL="$arg" ;;
  esac
done
[ -n "$EMAIL" ] || uso

EMAIL="$(printf '%s' "$EMAIL" | tr '[:upper:]' '[:lower:]')"
# So o utilizador (sem @): usa o endereco interno, como a app faz no login.
[[ "$EMAIL" == *"@"* ]] || EMAIL="$EMAIL@bca.cv"
# Caracteres seguros: assim o email pode ir no JSON sem escapes.
[[ "$EMAIL" =~ ^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$ ]] || erro "email invalido: $EMAIL"

command -v curl >/dev/null || erro "falta o curl"

# --- chave de administracao -------------------------------------------------
chave_service_role() {
  if [ -n "${SERVICE_ROLE_KEY:-}" ]; then printf '%s' "$SERVICE_ROLE_KEY"; return; fi
  if [ -n "${SUPABASE_ENV:-}" ]; then
    [ -r "$SUPABASE_ENV" ] || erro "nao consigo ler SUPABASE_ENV=$SUPABASE_ENV"
    local v
    v="$(sed -n 's/^SERVICE_ROLE_KEY=//p' "$SUPABASE_ENV" | head -n1 | tr -d "\"'\r")"
    [ -n "$v" ] || erro "SERVICE_ROLE_KEY nao encontrada em $SUPABASE_ENV"
    printf '%s' "$v"; return
  fi
  if command -v docker >/dev/null; then
    local v
    v="$(docker exec supabase-kong printenv SUPABASE_SERVICE_KEY 2>/dev/null || sudo docker exec supabase-kong printenv SUPABASE_SERVICE_KEY 2>/dev/null || true)"
    if [ -n "$v" ]; then printf '%s' "$v"; return; fi
  fi
  erro "nao encontrei a chave de administracao. Define SERVICE_ROLE_KEY ou SUPABASE_ENV=/caminho/do/.env"
}
CHAVE="$(chave_service_role)"

# --- ficheiros temporarios (apagados no fim) ---------------------------------
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
CFG="$TMP/curl.cfg"   # cabecalhos com a chave: fora da linha de comandos (nao aparece no ps)
{
  printf 'header = "apikey: %s"\n' "$CHAVE"
  printf 'header = "Authorization: Bearer %s"\n' "$CHAVE"
  printf 'header = "Content-Type: application/json"\n'
} > "$CFG"
unset CHAVE

# POST <caminho> <corpo-json> -> escreve a resposta em $TMP/resp e devolve o codigo HTTP
post() {
  printf '%s' "$2" > "$TMP/body"
  curl -sS --max-time 30 -K "$CFG" -X POST --data-binary "@$TMP/body" \
    -o "$TMP/resp" -w '%{http_code}' "$SUPABASE_URL$1"
}

# palavra-passe aleatoria sem caracteres ambiguos (0/O, 1/l/I)
# (o "|| true" e por causa do SIGPIPE do tr quando o head fecha, com pipefail)
aleatoria() { LC_ALL=C tr -dc 'A-HJ-NP-Za-km-z2-9' < /dev/urandom | head -c "$1" || true; }

# --- 1. criar a conta --------------------------------------------------------
if [ "$TEMPORARIA" -eq 1 ]; then
  SENHA="$(aleatoria 14)"
else
  SENHA="$(aleatoria 40)"   # ninguem a ve: so serve para a conta nao ficar sem palavra-passe
fi

CORPO="{\"email\":\"$EMAIL\",\"password\":\"$SENHA\",\"email_confirm\":true,\"user_metadata\":{\"must_change_password\":true}}"
CODIGO="$(post /auth/v1/admin/users "$CORPO")" || erro "sem resposta do Supabase em $SUPABASE_URL"

JA_EXISTIA=0
case "$CODIGO" in
  200|201) ;;
  409|422)
    if grep -q 'email_exists\|already' "$TMP/resp" 2>/dev/null; then
      JA_EXISTIA=1
    else
      erro "o Supabase recusou a criacao ($CODIGO): $(cat "$TMP/resp")"
    fi
    ;;
  401|403) erro "chave de administracao recusada ($CODIGO)" ;;
  *) erro "resposta inesperada ($CODIGO): $(cat "$TMP/resp")" ;;
esac

if [ "$JA_EXISTIA" -eq 1 ]; then
  [ "$TEMPORARIA" -eq 0 ] || erro "$EMAIL ja existe; usa o comando sem --temporaria para gerar um link de redefinicao"
  echo "Nota: $EMAIL ja existia - gerado um link para definir uma palavra-passe nova."
fi

# --- 2. modo temporaria: imprime e termina ------------------------------------
if [ "$TEMPORARIA" -eq 1 ]; then
  echo
  echo "Utilizador criado: $EMAIL"
  echo "Palavra-passe temporaria (so aparece agora): $SENHA"
  echo "No primeiro login, a aplicacao obriga a escolher uma palavra-passe nova."
  exit 0
fi
unset SENHA

# --- 3. link para a pessoa definir a palavra-passe ---------------------------
CORPO="{\"type\":\"recovery\",\"email\":\"$EMAIL\",\"redirect_to\":\"$SCI_URL_PUBLICA/reset-password\"}"
CODIGO="$(post /auth/v1/admin/generate_link "$CORPO")" || erro "sem resposta do Supabase em $SUPABASE_URL"
[ "$CODIGO" = "200" ] || erro "nao consegui gerar o link ($CODIGO): $(cat "$TMP/resp")"

LINK="$(sed -n 's/.*"action_link":"\([^"]*\)".*/\1/p' "$TMP/resp" | head -n1)"
[ -n "$LINK" ] || erro "a resposta nao trouxe o link"
# O Go escreve & como & no JSON (sed: o bash 5.2 trata o & da substituicao de forma especial).
LINK="$(printf '%s' "$LINK" | sed 's/\\u0026/\&/g')"
# O link vem com o endereco interno do Supabase: troca-se pelo que os colegas conseguem abrir.
case "$LINK" in
  *"/auth/v1/verify"*) LINK="$SCI_URL_PUBLICA/auth/v1/verify${LINK#*/auth/v1/verify}" ;;
  *) erro "formato de link inesperado" ;;
esac

echo
echo "Utilizador: $EMAIL"
echo "Envia este link a pessoa (uso unico, expira em cerca de 1 hora):"
echo
echo "$LINK"
echo
echo "A pessoa abre o link, escolhe a palavra-passe e entra. Tu nao a ves."
