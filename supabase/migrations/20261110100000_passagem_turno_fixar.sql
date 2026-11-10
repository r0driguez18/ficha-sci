-- Passagem de turno: notas fixadas + contagem de notas por ler.
--
-- Há notas que têm de ficar visíveis durante algum tempo, mesmo depois de lidas por duas pessoas. Uma nota FIXADA:
--   * não sai das ativas pelo prazo de 24 h após a 2.ª confirmação;
--   * não se arquiva (nem à mão, nem em "arquivar tudo") enquanto estiver fixada;
--   * pode ter uma data limite (fixada_ate, inclusive): passada essa data volta às regras normais (sem tarefa agendada:
--     as consultas comparam com a data de hoje em Cabo Verde). Sem data fica até alguém a desafixar.
-- Qualquer pessoa autenticada fixa e desafixa (como já acontece com arquivar). Nada se apaga.
--
-- contar_passagem_turno_por_ler(): quantas notas ativas a pessoa ainda não leu (não conta as que ela própria deixou).
-- Alimenta o número ao lado de "Passagem de Turno" no menu.

ALTER TABLE public.handover_entries
  ADD COLUMN IF NOT EXISTS fixada_em timestamptz,
  ADD COLUMN IF NOT EXISTS fixada_por uuid,
  ADD COLUMN IF NOT EXISTS fixada_por_nome text,
  ADD COLUMN IF NOT EXISTS fixada_ate date;

CREATE INDEX IF NOT EXISTS idx_handover_entries_fixadas
  ON public.handover_entries (created_at DESC) WHERE fixada_em IS NOT NULL AND arquivada_em IS NULL;

-- Hoje, em Cabo Verde (a data limite da fixação é inclusive).
CREATE OR REPLACE FUNCTION public.hoje_cabo_verde()
RETURNS date
LANGUAGE sql
STABLE
AS $$ SELECT (now() AT TIME ZONE 'Atlantic/Cape_Verde')::date $$;

-- Está fixada neste momento?
CREATE OR REPLACE FUNCTION public.nota_fixada_agora(p public.handover_entries)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$ SELECT p.fixada_em IS NOT NULL AND (p.fixada_ate IS NULL OR p.fixada_ate >= public.hoje_cabo_verde()) $$;

CREATE OR REPLACE FUNCTION public.fixar_entrada_passagem_turno(p_id uuid, p_ate date DEFAULT NULL)
RETURNS public.handover_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_e public.handover_entries;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF p_ate IS NOT NULL AND p_ate < public.hoje_cabo_verde() THEN
    RAISE EXCEPTION 'A data limite da fixação não pode ser no passado';
  END IF;

  SELECT * INTO v_e FROM public.handover_entries WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nota não encontrada';
  END IF;
  IF v_e.arquivada_em IS NOT NULL THEN
    RAISE EXCEPTION 'Esta nota já está arquivada';
  END IF;

  UPDATE public.handover_entries
     SET fixada_em = now(),
         fixada_por = auth.uid(),
         fixada_por_nome = public.nome_operador_atual(),
         fixada_ate = p_ate
   WHERE id = p_id
   RETURNING * INTO v_e;
  RETURN v_e;
END;
$$;

CREATE OR REPLACE FUNCTION public.desafixar_entrada_passagem_turno(p_id uuid)
RETURNS public.handover_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_e public.handover_entries;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  UPDATE public.handover_entries
     SET fixada_em = NULL, fixada_por = NULL, fixada_por_nome = NULL, fixada_ate = NULL
   WHERE id = p_id
   RETURNING * INTO v_e;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nota não encontrada';
  END IF;
  RETURN v_e;
END;
$$;

-- Arquivar: as notas fixadas ficam de fora (têm de ser desafixadas primeiro).
CREATE OR REPLACE FUNCTION public.arquivar_entradas_passagem_turno(p_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_n integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF p_ids IS NULL OR cardinality(p_ids) = 0 THEN
    RETURN 0;
  END IF;

  UPDATE public.handover_entries e
     SET arquivada_em = now(),
         arquivada_por = auth.uid(),
         arquivada_por_nome = public.nome_operador_atual()
   WHERE e.id = ANY (p_ids)
     AND e.arquivada_em IS NULL
     AND NOT public.nota_fixada_agora(e);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;

-- Notas ativas que a pessoa ainda não leu (as que ela deixou não contam).
CREATE OR REPLACE FUNCTION public.contar_passagem_turno_por_ler()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE WHEN auth.uid() IS NULL THEN 0 ELSE (
    SELECT count(*)::integer
      FROM public.handover_entries e
     WHERE e.arquivada_em IS NULL
       AND (e.arquivar_apos IS NULL OR e.arquivar_apos > now() OR public.nota_fixada_agora(e))
       AND e.autor_user_id IS DISTINCT FROM auth.uid()
       AND NOT EXISTS (SELECT 1 FROM public.handover_reads r WHERE r.entry_id = e.id AND r.user_id = auth.uid())
  ) END
$$;

REVOKE ALL ON FUNCTION public.fixar_entrada_passagem_turno(uuid, date) FROM public, anon;
REVOKE ALL ON FUNCTION public.desafixar_entrada_passagem_turno(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.arquivar_entradas_passagem_turno(uuid[]) FROM public, anon;
REVOKE ALL ON FUNCTION public.contar_passagem_turno_por_ler() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.fixar_entrada_passagem_turno(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.desafixar_entrada_passagem_turno(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.arquivar_entradas_passagem_turno(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.contar_passagem_turno_por_ler() TO authenticated;

NOTIFY pgrst, 'reload schema';
