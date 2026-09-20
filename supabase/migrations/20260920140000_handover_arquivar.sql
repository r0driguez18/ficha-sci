-- =====================================================
-- Passagem de Turno — arquivar (repor a lista "atual" sem perder histórico)
-- =====================================================
-- As notas não se apagam (20260920100000), mas a lista tem de poder voltar
-- a ficar limpa: quem entra lê, e as notas já tratadas saem da vista atual.
-- "Arquivar" só marca a nota (quem e quando); continua no histórico, com as
-- leituras. A vista atual mostra as não arquivadas; o histórico mostra tudo.
-- =====================================================

ALTER TABLE public.handover_entries
  ADD COLUMN IF NOT EXISTS arquivada_em timestamptz,
  ADD COLUMN IF NOT EXISTS arquivada_por uuid,
  ADD COLUMN IF NOT EXISTS arquivada_por_nome text;

CREATE INDEX IF NOT EXISTS idx_handover_entries_ativas
  ON public.handover_entries (created_at DESC) WHERE arquivada_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_handover_entries_created ON public.handover_entries (created_at DESC);

-- Arquiva notas (identidade do servidor; idempotente — as já arquivadas ficam como estão).
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

  UPDATE public.handover_entries
     SET arquivada_em = now(),
         arquivada_por = auth.uid(),
         arquivada_por_nome = public.nome_operador_atual()
   WHERE id = ANY (p_ids) AND arquivada_em IS NULL;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;

REVOKE ALL ON FUNCTION public.arquivar_entradas_passagem_turno(uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.arquivar_entradas_passagem_turno(uuid[]) TO authenticated;

NOTIFY pgrst, 'reload schema';
