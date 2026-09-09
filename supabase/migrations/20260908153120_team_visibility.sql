-- =====================================================
-- F1 — Visibilidade ao nível da equipa
-- =====================================================
-- O Centro Informática trabalha em três turnos sobre a mesma operação. O
-- histórico de fichas e o controlo de retornos de cobranças são
-- responsabilidade da equipa, não de cada operador: a auditoria tem de poder
-- encontrar "a ficha do dia 14" sem saber quem esteve ao serviço, e qualquer
-- operador tem de poder tratar um retorno que um colega deixou pendente.
--
-- Estas políticas abrem a LEITURA destas duas tabelas a qualquer utilizador
-- autenticado e permitem que qualquer operador marque um retorno como enviado.
-- A autoria continua registada em `user_id` (preenchido no INSERT) e a
-- eliminação continua reservada a quem criou o registo.
--
-- Adequado ao ambiente self-hosted, em rede interna isolada (RNF-02.2).
-- =====================================================

-- ---------- exported_taskboards ----------
DROP POLICY IF EXISTS "Users can view their own exported taskboards" ON public.exported_taskboards;

CREATE POLICY "Exported taskboards are viewable by the team"
  ON public.exported_taskboards
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT / UPDATE / DELETE mantêm-se restritos ao autor (auth.uid()::text = user_id).

-- ---------- cobrancas_retornos ----------
DROP POLICY IF EXISTS "Users can view their own cobrancas retornos" ON public.cobrancas_retornos;
DROP POLICY IF EXISTS "Users can update their own cobrancas retornos" ON public.cobrancas_retornos;

CREATE POLICY "Collection returns are viewable by the team"
  ON public.cobrancas_retornos
  FOR SELECT
  TO authenticated
  USING (true);

-- Qualquer operador pode tratar (marcar como enviado) um retorno da equipa.
CREATE POLICY "Collection returns are updatable by the team"
  ON public.cobrancas_retornos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- INSERT mantém-se restrito ao autor; DELETE continua sem política (bloqueado).
