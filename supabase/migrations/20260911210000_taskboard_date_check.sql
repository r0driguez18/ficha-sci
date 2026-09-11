-- =====================================================
-- Ficha de Procedimentos — impõe o formato da data
-- =====================================================
-- `date` é `text` (não `date`) em taskboard_data e exported_taskboards —
-- decisão original para simplificar comparação/serialização no cliente.
-- O formato ISO (YYYY-MM-DD) é assumido em várias comparações no código
-- (`d === lastDay`, `date.split('-')`), mas nunca foi imposto na base de
-- dados: um pedido direto à API (com um JWT válido) podia gravar
-- qualquer string em `date`. Este CHECK garante o formato sem mudar o
-- tipo da coluna (evita ter de tocar em todo o código que trata `date`
-- como string).
-- =====================================================

DO $$ BEGIN
  ALTER TABLE public.taskboard_data
    ADD CONSTRAINT taskboard_data_date_format_check
    CHECK (date ~ '^\d{4}-\d{2}-\d{2}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.exported_taskboards
    ADD CONSTRAINT exported_taskboards_date_format_check
    CHECK (date ~ '^\d{4}-\d{2}-\d{2}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

NOTIFY pgrst, 'reload schema';
