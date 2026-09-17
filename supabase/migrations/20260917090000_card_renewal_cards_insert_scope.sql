-- =====================================================
-- Renovação de Cartões — INSERT de cartões só numa sessão real e em curso
-- =====================================================
-- A política de INSERT em `card_renewal_cards` era `WITH CHECK (true)` —
-- qualquer autenticado podia inserir cartões (número, balcão, dados) em
-- QUALQUER session_id, incluindo sessões já concluídas ou IDs inexistentes.
-- Passa a exigir que o session_id corresponda a uma sessão real e ainda
-- "em_curso" — mantém o desenho de equipa (várias pessoas/turnos continuam
-- a mesma sessão, por isso não se restringe ao dono), só fecha a porta a
-- inserir cartões fora do fluxo normal de upload do ficheiro do banco.
-- =====================================================

DROP POLICY IF EXISTS "Cartões de renovação inseridos pela equipa" ON public.card_renewal_cards;

CREATE POLICY "Cartões de renovação inseridos pela equipa"
  ON public.card_renewal_cards FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.card_renewal_sessions s
      WHERE s.id = session_id AND s.estado = 'em_curso'
    )
  );

NOTIFY pgrst, 'reload schema';
