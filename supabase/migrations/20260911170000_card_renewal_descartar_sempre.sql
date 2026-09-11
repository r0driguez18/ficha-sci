-- =====================================================
-- Renovação de Cartões — "Descartar sessão" passa a funcionar sempre
-- =====================================================
-- A trava anterior (só descartar sem lotes gerados) deixava sessões de
-- teste ou erradas presas sem forma de as remover. Passa a poder
-- descartar-se uma sessão em qualquer estado — cartões e lotes ligados
-- a ela são apagados em cascata (FK ON DELETE CASCADE já existente).
-- =====================================================

CREATE OR REPLACE FUNCTION public.descartar_sessao_renovacao(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.card_renewal_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sessão não encontrada.';
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
