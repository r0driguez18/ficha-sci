-- Desfaz a migração 20261119100000_corrigir_tipos_estatistica.sql: repõe o tipo que cada processamento tinha antes.
--
-- Só repõe as linhas que ainda têm o tipo que a correção lhes deu (se alguém as mudou depois, ficam como estão).
-- Se uma linha foi corrigida mais de uma vez, repõe o tipo da PRIMEIRA correção (o original).
-- Correr com:  psql ... -f reverter-tipos-estatistica.sql   (faz primeiro um backup da base de dados, como nas migrações)

BEGIN;

WITH original AS (
  SELECT DISTINCT ON (file_process_id) file_process_id, tipo_antes, tipo_depois
    FROM public.file_processes_tipo_corrigido
   ORDER BY file_process_id, corrigido_em ASC
), ultimo AS (
  SELECT DISTINCT ON (file_process_id) file_process_id, tipo_depois
    FROM public.file_processes_tipo_corrigido
   ORDER BY file_process_id, corrigido_em DESC
)
UPDATE public.file_processes fp
   SET tipo = o.tipo_antes
  FROM original o
  JOIN ultimo u USING (file_process_id)
 WHERE fp.id = o.file_process_id
   AND fp.tipo IS NOT DISTINCT FROM u.tipo_depois;

-- Ver o que foi corrigido (antes/depois, por regra):
--   SELECT regra, tipo_antes, tipo_depois, count(*) FROM public.file_processes_tipo_corrigido GROUP BY 1,2,3 ORDER BY 4 DESC;

COMMIT;
