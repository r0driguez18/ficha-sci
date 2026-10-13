-- =====================================================
-- Código do operador Elvis Brito: "ebrito" -> "elvisb"
-- =====================================================
-- O código certo é "elvisb". Corrige-se o que ainda é "vivo":
--   * operators.value (a conta/PIN/ligações seguem o id, não o código);
--   * file_processes.executed_by (registos de processamentos / estatísticas);
--   * rascunhos da ficha por exportar (taskboard_data).
--
-- NÃO se mexe em exported_taskboards: as fichas exportadas estão assinadas e o selo de
-- integridade (SHA-256) cobre o conteúdo, incluindo o código do operador. Reescrevê-las
-- invalidaria a verificação. O código antigo resolve-se para o novo na app
-- (src/lib/operators.ts, CODIGOS_ANTIGOS).
--
-- Idempotente: pode correr-se mais de uma vez.
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.operators WHERE value = 'ebrito')
     AND NOT EXISTS (SELECT 1 FROM public.operators WHERE value = 'elvisb') THEN
    UPDATE public.operators SET value = 'elvisb' WHERE value = 'ebrito';
  END IF;
END $$;

UPDATE public.file_processes
   SET executed_by = 'elvisb'
 WHERE executed_by = 'ebrito';

UPDATE public.taskboard_data
   SET turn_data  = replace(turn_data::text,  '"ebrito"', '"elvisb"')::jsonb,
       tasks      = replace(tasks::text,      '"ebrito"', '"elvisb"')::jsonb,
       table_rows = replace(table_rows::text, '"ebrito"', '"elvisb"')::jsonb
 WHERE turn_data::text  LIKE '%"ebrito"%'
    OR tasks::text      LIKE '%"ebrito"%'
    OR table_rows::text LIKE '%"ebrito"%';

NOTIFY pgrst, 'reload schema';
