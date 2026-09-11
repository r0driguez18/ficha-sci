-- =====================================================
-- Verificação de operações duplicadas — agregada no servidor
-- =====================================================
-- checkDuplicateOperations() pedia `select('form_type, date, table_rows')`
-- de TODA a tabela exported_taskboards (sem filtro, sem paginação) a cada
-- clique em "Exportar e guardar", e fazia a comparação no browser — um
-- pedido cada vez maior à medida que o histórico cresce. Esta função faz
-- a mesma verificação (mesma regra: qualquer nº de operação já usado,
-- em qualquer data, bloqueia — exceto a própria ficha em edição) dentro
-- do Postgres, devolvendo só os números que realmente colidem.
-- =====================================================

CREATE OR REPLACE FUNCTION public.operacoes_duplicadas_ficha(
  p_form_type text,
  p_date text,
  p_operacoes text[]
)
RETURNS text[]
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(array_agg(DISTINCT op), ARRAY[]::text[])
  FROM (
    SELECT trim(elem ->> 'operacao') AS op
      FROM public.exported_taskboards et,
           LATERAL jsonb_array_elements(et.table_rows) AS elem
     WHERE NOT (et.form_type = p_form_type AND et.date = p_date)
       AND trim(elem ->> 'operacao') = ANY (p_operacoes)

    UNION

    SELECT operation_number AS op
      FROM public.file_processes
     WHERE operation_number = ANY (p_operacoes)
  ) x
  WHERE op IS NOT NULL AND op <> '';
$$;

REVOKE ALL ON FUNCTION public.operacoes_duplicadas_ficha(text, text, text[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.operacoes_duplicadas_ficha(text, text, text[]) TO authenticated;

NOTIFY pgrst, 'reload schema';
