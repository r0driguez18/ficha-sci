-- =====================================================
-- Renovação de Cartões — correções da auditoria de segurança
-- =====================================================
-- 1. `descartar_sessao_renovacao` não tinha nenhuma verificação de dono —
--    qualquer autenticado podia apagar a sessão de outro colega, mesmo já
--    com lotes entregues ao banco. Passa a exigir ser o criador da sessão
--    ou administrador.
--
-- 2. Reenviar/colar de novo o ficheiro do banco depois de já ter sido
--    gerado um lote reescrevia silenciosamente balcão/nome/dados dos
--    cartões já atribuídos a esse lote — contradizendo o próprio
--    comentário no código ("uma correção só se aplica a cartões ainda
--    pendentes"). Um trigger passa a proteger os campos de um cartão
--    já atribuído a um lote, ignorando silenciosamente tentativas de os
--    mudar (sem rejeitar o upsert inteiro — cartões ainda pendentes no
--    mesmo lote de upload continuam a atualizar-se normalmente).
-- =====================================================

CREATE OR REPLACE FUNCTION public.descartar_sessao_renovacao(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_dono uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT user_id INTO v_dono FROM public.card_renewal_sessions WHERE id = p_session_id;
  IF v_dono IS NULL THEN
    RAISE EXCEPTION 'Sessão não encontrada.';
  END IF;
  IF v_dono <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Só quem criou a sessão (ou um administrador) a pode descartar.';
  END IF;

  DELETE FROM public.card_renewal_sessions WHERE id = p_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.proteger_cartao_renovacao_batched()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.lote_numero IS NOT NULL THEN
    -- Já foi atribuído a um lote (potencialmente já entregue ao banco) —
    -- um reenvio do ficheiro não pode reescrever o que já saiu.
    NEW.balcao := OLD.balcao;
    NEW.nome_titular := OLD.nome_titular;
    NEW.dados := OLD.dados;
    NEW.numero_cartao := OLD.numero_cartao;
    NEW.posicao := OLD.posicao;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_cartao_renovacao_batched ON public.card_renewal_cards;
CREATE TRIGGER trg_proteger_cartao_renovacao_batched
  BEFORE UPDATE ON public.card_renewal_cards
  FOR EACH ROW EXECUTE FUNCTION public.proteger_cartao_renovacao_batched();

NOTIFY pgrst, 'reload schema';
