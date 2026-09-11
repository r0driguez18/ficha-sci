-- =====================================================
-- Renovação de Cartões — descartar uma sessão por engano
-- =====================================================
-- Não havia forma de sair de uma sessão criada por engano (ficheiro
-- errado, teste, duplicado) — "Terminar sessão" só funciona sem cartões
-- pendentes. Esta função permite apagar a sessão inteira, mas só quando
-- ainda não foi gerado nenhum lote: uma vez que exista um lote, a sessão
-- já representa trabalho real (ficheiros já entregues ao banco) e deixa
-- de poder ser descartada — só concluída.
-- =====================================================

CREATE OR REPLACE FUNCTION public.descartar_sessao_renovacao(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_lotes integer;
BEGIN
  SELECT count(*) INTO v_lotes FROM public.card_renewal_lotes WHERE session_id = p_session_id;
  IF v_lotes > 0 THEN
    RAISE EXCEPTION 'Esta sessão já tem % lote(s) gerado(s) — não pode ser descartada, só concluída.', v_lotes;
  END IF;

  DELETE FROM public.card_renewal_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sessão não encontrada.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.descartar_sessao_renovacao(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.descartar_sessao_renovacao(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
