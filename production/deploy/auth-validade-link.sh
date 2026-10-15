#!/bin/bash
# Define quanto tempo valem os links de "definir senha" (GOTRUE_MAILER_OTP_EXP). Corre NO SERVIDOR
# (chamado pelo deploy). Por omissao o GoTrue usa 1 hora; aqui passa a 24 horas (ou as que se indicarem).
#
#   bash auth-validade-link.sh [horas]        (por omissao: 24)
#
# O docker-compose do Supabase nao passa essa variavel ao servico "auth", por isso acrescenta-a ao
# compose (com copia de seguranca), valida-o e recria SO o contentor supabase-auth (uns segundos sem
# login). Se a validacao falhar, repoe o ficheiro. Idempotente: se ja estiver certo, nao faz nada.
#
# Variaveis (para testes): SUDO (por omissao "sudo"), COMPOSE_FILE, PROJECT_DIR, AUTH_CONTAINER.
set -u

HORAS="${1:-24}"
case "$HORAS" in ''|*[!0-9]*) echo "auth-validade-link: horas invalidas: $HORAS"; exit 2 ;; esac
[ "$HORAS" -ge 1 ] && [ "$HORAS" -le 168 ] || { echo "auth-validade-link: horas entre 1 e 168"; exit 2; }
SEGUNDOS=$((HORAS * 3600))

SUDO="${SUDO-sudo}"
AUTH="${AUTH_CONTAINER:-supabase-auth}"
say() { echo "auth-validade-link: $*"; }

# O valor que o contentor tem agora.
ATUAL="$($SUDO docker exec "$AUTH" printenv GOTRUE_MAILER_OTP_EXP 2>/dev/null | tr -d '[:space:]')"
if [ "$ATUAL" = "$SEGUNDOS" ]; then
  say "ja esta em ${HORAS} h (nada a fazer)."
  exit 0
fi

# Onde esta o compose: pelas etiquetas do proprio contentor (ou pelas variaveis de teste).
if [ -z "${COMPOSE_FILE:-}" ]; then
  COMPOSE_FILE="$($SUDO docker inspect "$AUTH" --format '{{index .Config.Labels "com.docker.compose.project.config_files"}}' 2>/dev/null | cut -d, -f1)"
fi
if [ -z "${PROJECT_DIR:-}" ]; then
  PROJECT_DIR="$($SUDO docker inspect "$AUTH" --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' 2>/dev/null)"
fi
[ -n "$COMPOSE_FILE" ] && [ -f "$COMPOSE_FILE" ] || { say "nao encontrei o docker-compose do Supabase (${COMPOSE_FILE:-vazio})."; exit 10; }
[ -n "$PROJECT_DIR" ] || PROJECT_DIR="$(dirname "$COMPOSE_FILE")"

COPIA="${COMPOSE_FILE}.antes-otp.$(date +%Y%m%d%H%M%S)"

if grep -qE '^[[:space:]]*GOTRUE_MAILER_OTP_EXP:' "$COMPOSE_FILE"; then
  # Ja la esta (talvez com outro valor): atualiza o valor por omissao.
  $SUDO cp -p "$COMPOSE_FILE" "$COPIA" || { say "nao consegui fazer a copia de seguranca"; exit 13; }
  $SUDO sed -i -E "s|^([[:space:]]*GOTRUE_MAILER_OTP_EXP:).*|\1 \${MAILER_OTP_EXP:-${SEGUNDOS}}|" "$COMPOSE_FILE" \
    || { say "nao consegui alterar o compose"; exit 14; }
else
  LINHA="$(grep -nE '^[[:space:]]*GOTRUE_MAILER_URLPATHS_RECOVERY:' "$COMPOSE_FILE" | head -n1 | cut -d: -f1)"
  [ -n "$LINHA" ] || { say "nao encontrei no compose onde acrescentar (GOTRUE_MAILER_URLPATHS_RECOVERY)."; exit 11; }
  INDENT="$(sed -n "${LINHA}p" "$COMPOSE_FILE" | sed -E 's/^([[:space:]]*).*/\1/')"
  $SUDO cp -p "$COMPOSE_FILE" "$COPIA" || { say "nao consegui fazer a copia de seguranca"; exit 13; }
  NOVO="$(mktemp)"
  {
    head -n "$LINHA" "$COMPOSE_FILE"
    printf '%s# Validade dos links de definir senha (segundos) — ver production/deploy/auth-validade-link.sh\n' "$INDENT"
    printf '%sGOTRUE_MAILER_OTP_EXP: ${MAILER_OTP_EXP:-%s}\n' "$INDENT" "$SEGUNDOS"
    tail -n +"$((LINHA + 1))" "$COMPOSE_FILE"
  } > "$NOVO"
  $SUDO cp "$NOVO" "$COMPOSE_FILE" || { say "nao consegui escrever o compose"; rm -f "$NOVO"; exit 14; }
  rm -f "$NOVO"
fi

# O compose tem de continuar valido; senao repoe-se o original.
if ! (cd "$PROJECT_DIR" && $SUDO docker compose -f "$COMPOSE_FILE" --project-directory "$PROJECT_DIR" config -q >/dev/null 2>&1); then
  say "o compose ficou invalido com a alteracao: a repor o original."
  $SUDO cp -p "$COPIA" "$COMPOSE_FILE"
  exit 15
fi

# Recria so o servico de autenticacao (os outros contentores nao se mexem).
if ! (cd "$PROJECT_DIR" && $SUDO docker compose -f "$COMPOSE_FILE" --project-directory "$PROJECT_DIR" up -d --no-deps --force-recreate auth >/dev/null 2>&1); then
  say "nao consegui recriar o supabase-auth (copia do compose: $COPIA)."
  exit 16
fi

# Espera ate 30 s que volte a responder e confirma o valor.
for _ in $(seq 1 15); do
  sleep 2
  DEPOIS="$($SUDO docker exec "$AUTH" printenv GOTRUE_MAILER_OTP_EXP 2>/dev/null | tr -d '[:space:]')"
  [ -n "$DEPOIS" ] && break
done
if [ "${DEPOIS:-}" = "$SEGUNDOS" ]; then
  say "OK: os links passam a valer ${HORAS} h (copia do compose: $COPIA)."
  exit 0
fi
say "recriei o contentor mas o valor lido e '${DEPOIS:-vazio}' (esperado $SEGUNDOS)."
exit 17
