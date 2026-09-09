-- =====================================================
-- F7 — Motor de SLA dos retornos de cobrança
-- =====================================================
-- A regra de prazo é uniforme (retorno no dia útil seguinte à aplicação;
-- >2 dias úteis de atraso = urgente) e vive no código
-- (`src/lib/cobrancasSla.ts`), pelo que não é preciso tabela de referência.
--
-- Aqui só se acrescenta o rasto de quem alterou manualmente a data de
-- retorno esperada de um registo (a UI passa a permitir essa edição).
-- =====================================================

ALTER TABLE public.cobrancas_retornos
  ADD COLUMN IF NOT EXISTS data_retorno_alterada_por uuid,
  ADD COLUMN IF NOT EXISTS data_retorno_alterada_em timestamptz;

NOTIFY pgrst, 'reload schema';
