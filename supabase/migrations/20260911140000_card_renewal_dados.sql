-- =====================================================
-- Renovação de Cartões — guarda a linha completa de cada cartão
-- =====================================================
-- A folha "Resultado" do processo manual (Auto Ren.xlsm) tinha todas as
-- colunas do ficheiro do banco, não só balcão/cartão/nome. Para poder
-- gerar o .xlsx equivalente por lote, cada cartão passa a guardar a sua
-- linha completa (rotulada pelos cabeçalhos detetados no ficheiro).
-- =====================================================

ALTER TABLE public.card_renewal_cards
  ADD COLUMN IF NOT EXISTS dados jsonb NOT NULL DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';
