-- Estatística: corrige o TIPO dos processamentos já gravados (file_processes) segundo as regras novas.
--
-- Regras (a mesma lógica de src/lib/cobrancasDc.ts):
--   1. módulo SP (interface SISP) -> 'sisp'   : ficheiros ECI…, CSV…, ASC… (só isto ficava como «compensacao»)
--   2. cheques e transferências   -> 'compensacao' : RTR, RCT, RCB, FCT, IMR, ETR, ERI, EDV, ERRTR…, ERRCH…
--   3. INPS                       -> 'cobrancas'   : ficheiros INP…
--   4. DC com nº de operação que já está na cópia da GBAPL (aplicacoes_dc, a partir de 2026-11-18): o tipo pela empresa
--      (lista de cobranças -> 'cobrancas'; as outras -> 'salario').
-- Os DC mais antigos (sem cópia da GBAPL, logo sem empresa) NÃO se mexem: ficam como a pessoa os classificou.
--
-- É SEGURO REPETIR: só muda o que ainda não tem o tipo certo. Cada alteração fica em file_processes_tipo_corrigido (tipo
-- antes e depois, e a regra), e production/scripts/reverter-tipos-estatistica.sql desfaz-a. A tabela file_processes tem a
-- auditoria geral (registo_alteracoes), que também regista cada alteração.

CREATE TABLE IF NOT EXISTS public.file_processes_tipo_corrigido (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_process_id uuid NOT NULL,
  tipo_antes text,
  tipo_depois text NOT NULL,
  regra text NOT NULL,
  corrigido_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fp_tipo_corrigido_fp ON public.file_processes_tipo_corrigido (file_process_id);
ALTER TABLE public.file_processes_tipo_corrigido ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.file_processes_tipo_corrigido FROM public, anon, authenticated;
-- sem política: ninguém lê nem escreve pela API (só o administrador da base de dados)

DO $$
DECLARE
  -- as empresas de cobrança (a mesma lista de src/lib/cobrancasDc.ts; GARANTIA_F é salário e NÃO está aqui)
  v_cobrancas text[] := ARRAY[
    'IMPAR', 'GARANTIA', 'P_COM_SISP', 'CHIPOWER', 'ELECTRA', 'ELECTRA1', 'DIRECTEL',
    'CVT_CIRCUI', 'CVT_FIXO', 'CVT_INTERN', 'CVT_MOVEL', 'CVT_PACOTE', 'CVT_PESSOL', 'CVT_RESI', 'CVT_ZAPTV',
    'QUOTAS2', 'QUOTAS1', 'SINDICATO', 'INPS'
  ];
  v_alterados integer;
  v_resumo text;
BEGIN
  DROP TABLE IF EXISTS _tipos_a_corrigir;
  CREATE TEMP TABLE _tipos_a_corrigir ON COMMIT DROP AS
  SELECT fp.id, fp.tipo AS tipo_antes,
         CASE
           WHEN n.nome ~ '^(ECI|CSV|ASC)[0-9]{6}' THEN 'sisp'
           WHEN n.nome ~ '^(RTR|RCT|RCB|FCT|IMR|ETR|ERI|EDV)[0-9]{6}' OR n.nome ~ '^ERR(TR|CH)[0-9]+$' THEN 'compensacao'
           WHEN n.nome ~ '^INP[0-9]{6}' THEN 'cobrancas'
           WHEN dc.empresa IS NOT NULL THEN CASE WHEN upper(btrim(dc.empresa)) = ANY (v_cobrancas) THEN 'cobrancas' ELSE 'salario' END
         END AS tipo_depois,
         CASE
           WHEN n.nome ~ '^(ECI|CSV|ASC)[0-9]{6}' THEN 'nome: SISP'
           WHEN n.nome ~ '^(RTR|RCT|RCB|FCT|IMR|ETR|ERI|EDV)[0-9]{6}' OR n.nome ~ '^ERR(TR|CH)[0-9]+$' THEN 'nome: compensação'
           WHEN n.nome ~ '^INP[0-9]{6}' THEN 'nome: INPS (cobrança)'
           WHEN dc.empresa IS NOT NULL THEN 'empresa ' || upper(btrim(dc.empresa))
         END AS regra
    FROM public.file_processes fp
   CROSS JOIN LATERAL (SELECT upper(btrim(coalesce(fp.as400_name, ''))) AS nome) n
    LEFT JOIN LATERAL (
      SELECT d.empresa
        FROM public.aplicacoes_dc d
       WHERE fp.operation_number IS NOT NULL AND d.n_operacao = fp.operation_number
       ORDER BY d.atualizada_em DESC
       LIMIT 1
    ) dc ON true;

  DELETE FROM _tipos_a_corrigir WHERE tipo_depois IS NULL OR tipo_antes IS NOT DISTINCT FROM tipo_depois;

  INSERT INTO public.file_processes_tipo_corrigido (file_process_id, tipo_antes, tipo_depois, regra)
  SELECT id, tipo_antes, tipo_depois, regra FROM _tipos_a_corrigir;

  UPDATE public.file_processes fp
     SET tipo = c.tipo_depois
    FROM _tipos_a_corrigir c
   WHERE fp.id = c.id;
  GET DIAGNOSTICS v_alterados = ROW_COUNT;

  SELECT coalesce(string_agg(format('%s -> %s: %s', coalesce(tipo_antes, '(vazio)'), tipo_depois, n), '; ' ORDER BY n DESC), 'nada a corrigir')
    INTO v_resumo
    FROM (SELECT tipo_antes, tipo_depois, count(*) AS n FROM _tipos_a_corrigir GROUP BY 1, 2) x;
  RAISE NOTICE 'Estatística: % processamentos com o tipo corrigido (%).', v_alterados, v_resumo;
END $$;
