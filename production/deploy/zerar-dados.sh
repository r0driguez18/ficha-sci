#!/bin/bash
# Zera os DADOS de utilização do SCI (fichas, histórico, retornos, tapes, cartões, passagem de turno,
# estatísticas, lotes PS2…) para começar do zero em produção, sem os dados de teste.
# Corre NO SERVIDOR, à mão — nunca faz parte do deploy.
#
#   bash zerar-dados.sh               ver: mostra o que existe e o que ficava (não apaga nada)
#   bash zerar-dados.sh --ensaio      apaga dentro de uma transação e DESFAZ (mostra o resultado)
#   bash zerar-dados.sh --executar    pede "ZERAR", faz backup, apaga e limpa os ficheiros dos tapes
#
# FICA (configuração e identidade):
#   contas (auth.users), operadores, PINs, alertas de hora certa, migrações aplicadas, esquema.
# APAGA (dados):
#   fichas em rascunho e exportadas, processamentos/estatísticas, retornos de cobranças, passagem de
#   turno, renovação de cartões, lotes PS2 e verificações, registos de reposição de senha, tokens de
#   assinatura, tratamentos CRC e os ficheiros do bucket tapes-evidencia.
#
# Variáveis (para testes): SUDO (por omissão "sudo"), CONTENTOR (supabase-db), DB_NOME (postgres),
# SEM_STORAGE=1 (não toca no armazenamento).
set -u

SUDO="${SUDO-sudo}"
CONTENTOR="${CONTENTOR:-supabase-db}"
DB_NOME="${DB_NOME:-postgres}"
MODO="ver"
case "${1:-}" in
  "") MODO="ver" ;;
  --ensaio) MODO="ensaio" ;;
  --executar) MODO="executar" ;;
  *) echo "Uso: bash zerar-dados.sh [--ensaio | --executar]"; exit 2 ;;
esac

TABELAS=(
  taskboard_data
  exported_taskboards
  file_processes
  cobrancas_retornos
  handover_entries
  handover_reads
  handover_notes
  card_renewal_cards
  card_renewal_lotes
  card_renewal_sessions
  ps2_lotes
  reposicoes_senha
  reposicao_tentativas
  signing_tokens
  crc_tratamentos
)

psql_db() { $SUDO docker exec -i "$CONTENTOR" psql -U postgres -d "$DB_NOME" "$@"; }
fim() { echo; echo "ERRO: $1"; exit 1; }

$SUDO docker exec "$CONTENTOR" true >/dev/null 2>&1 || fim "não consigo falar com o contentor $CONTENTOR."

LISTA="$(printf 'public.%s, ' "${TABELAS[@]}")"; LISTA="${LISTA%, }"

contagens() {
  local sql="" t
  for t in "${TABELAS[@]}"; do
    sql="${sql}select '${t}' as tabela, count(*) as linhas from public.${t} union all "
  done
  sql="${sql}select 'storage: tapes-evidencia (ficheiros)', count(*) from storage.objects where bucket_id = 'tapes-evidencia' order by 1"
  psql_db -c "$sql" </dev/null
}

manter() {
  psql_db -tA </dev/null -c "
    select 'contas (auth.users): ' || count(*) from auth.users;
    select 'operadores: ' || count(*) from public.operators;
    select 'PINs definidos: ' || count(*) from public.operator_pins;
    select 'alertas de hora certa: ' || count(*) from public.daily_alerts;"
}

echo "== O que existe agora (isto APAGA-SE em --executar)"
contagens
echo
echo "== O que FICA"
manter

if [ "$MODO" = "ver" ]; then
  echo
  echo "Nada foi apagado. Para ensaiar sem risco:  bash zerar-dados.sh --ensaio"
  exit 0
fi

# ---------------------------------------------------------------- ensaio
if [ "$MODO" = "ensaio" ]; then
  echo
  echo "== Ensaio: apaga numa transação e desfaz (nada fica alterado)"
  psql_db -v ON_ERROR_STOP=1 <<SQL || fim "o ensaio falhou."
BEGIN;
TRUNCATE ${LISTA} RESTART IDENTITY CASCADE;
select 'depois do TRUNCATE (dentro da transação):' as info;
$(for t in "${TABELAS[@]}"; do echo "select '${t}' as tabela, count(*) as linhas from public.${t};"; done)
select 'contas (continuam):' as info, count(*) from auth.users;
select 'operadores (continuam):' as info, count(*) from public.operators;
ROLLBACK;
SQL
  echo
  echo "Ensaio feito e DESFEITO: nada foi apagado."
  exit 0
fi

# ---------------------------------------------------------------- executar
echo
echo "ATENÇÃO: isto apaga os dados acima. Não se desfaz (só pelo backup)."
echo "Antes: todos devem ter feito 'Sair' da app (uma ficha aberta voltava a gravar o rascunho antigo)."
read -r -p 'Para continuar escreve ZERAR e carrega em Enter: ' RESP
[ "$RESP" = "ZERAR" ] || fim "cancelado (não escreveste ZERAR). Nada foi alterado."

BK="$HOME/backup_antes_zerar_$(date +%F_%H%M%S).sql"
echo
echo "== 1. Backup completo → $BK"
$SUDO docker exec "$CONTENTOR" pg_dump -U postgres "$DB_NOME" > "$BK" || fim "o backup falhou (nada foi apagado)."
[ -s "$BK" ] || fim "o backup ficou vazio (nada foi apagado)."
ls -lh "$BK"

echo
echo "== 2. Apagar os dados"
psql_db -v ON_ERROR_STOP=1 -1 -q </dev/null -c "TRUNCATE ${LISTA} RESTART IDENTITY CASCADE;" \
  || fim "o TRUNCATE falhou (a transação foi desfeita; o backup está em $BK)."
echo "Feito."

echo
echo "== 3. Ficheiros dos tapes (armazenamento)"
if [ "${SEM_STORAGE:-0}" = "1" ]; then
  echo "(ignorado: SEM_STORAGE=1)"
else
  CHAVE="$($SUDO docker exec supabase-kong printenv SUPABASE_SERVICE_KEY 2>/dev/null | tr -d '[:space:]')"
  if [ -z "$CHAVE" ]; then
    echo "AVISO: não consegui ler a chave de serviço; os ficheiros do bucket ficam (apaga-os no Studio)."
  else
    NOMES="$(psql_db -tA </dev/null -c "select coalesce(json_agg(name), '[]'::json) from storage.objects where bucket_id = 'tapes-evidencia'")"
    if [ "$NOMES" = "[]" ] || [ -z "$NOMES" ]; then
      echo "Sem ficheiros no bucket."
    else
      CODIGO="$(printf '{"prefixes": %s}' "$NOMES" | curl -s -o /dev/null -w '%{http_code}' -X DELETE \
        -H "apikey: $CHAVE" -H "Authorization: Bearer $CHAVE" -H 'Content-Type: application/json' \
        --data-binary @- "http://localhost:8000/storage/v1/object/tapes-evidencia")"
      if [ "$CODIGO" = "200" ]; then echo "Ficheiros do bucket apagados."; else echo "AVISO: o armazenamento respondeu $CODIGO; confirma o bucket tapes-evidencia no Studio."; fi
    fi
  fi
fi

echo
echo "== Resultado"
contagens
echo
echo "Concluído. Backup: $BK"
echo "Agora: cada pessoa faz 'Sair' e entra de novo (limpa o rascunho guardado no browser)."
