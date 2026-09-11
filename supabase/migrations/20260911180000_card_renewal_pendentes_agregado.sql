-- =====================================================
-- Renovação de Cartões — contagem de pendentes por balcão, agregada na BD
-- =====================================================
-- Este Supabase tem PGRST_DB_MAX_ROWS=1000: um pedido que tentasse
-- devolver uma linha por cartão pendente (podem ser milhares) era cortado
-- a meio, fazendo alguns balcões desaparecer da lista. Esta função
-- devolve já agregado (uma linha por balcão), muito abaixo do limite.
-- Corre como o utilizador que chama (sem SECURITY DEFINER) — vê
-- exatamente o que já veria com um SELECT direto, respeitando a mesma
-- política de RLS de equipa.
-- =====================================================

CREATE OR REPLACE FUNCTION public.pendentes_por_balcao_renovacao(p_session_id uuid)
RETURNS TABLE (balcao text, pendentes bigint)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT c.balcao, count(*) AS pendentes
    FROM public.card_renewal_cards c
   WHERE c.session_id = p_session_id
     AND c.lote_numero IS NULL
   GROUP BY c.balcao
   ORDER BY c.balcao;
$$;

REVOKE ALL ON FUNCTION public.pendentes_por_balcao_renovacao(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.pendentes_por_balcao_renovacao(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
