-- =====================================================
-- Renovação de Cartões — terminar sem exigir tudo processado, e reabrir
-- =====================================================
-- "Terminar sessão" exigia zero cartões pendentes, o que deixava sessões
-- presas sem forma de sair delas. Passa a poder terminar-se a qualquer
-- momento — os cartões pendentes não se perdem (continuam na BD, ligados
-- à sessão), só deixam de aparecer como "em curso". `reabrir_sessao_renovacao`
-- devolve a sessão ao estado "em_curso" para quem quiser continuar.
-- =====================================================

CREATE OR REPLACE FUNCTION public.concluir_sessao_renovacao(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.card_renewal_sessions
     SET estado = 'concluida', updated_at = now()
   WHERE id = p_session_id AND estado = 'em_curso';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sessão não encontrada ou já concluída.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.reabrir_sessao_renovacao(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.card_renewal_sessions
     SET estado = 'em_curso', updated_at = now()
   WHERE id = p_session_id AND estado = 'concluida';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sessão não encontrada ou já está em curso.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.reabrir_sessao_renovacao(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.reabrir_sessao_renovacao(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
