-- Aplicações DC (débitos/créditos por lotes): cópia da tabela «aplicações em curso» do core (GBAPL).
--
-- A GBAPL tem o nº de operação, a empresa e os movimentos, mas só guarda o dia atual: à meia-noite os DC desse dia
-- desaparecem. O registo de ficheiros processados (PLOGITF) guarda o histórico mas não tem essa informação. Por isso o
-- worker lê a GBAPL de 10 em 10 minutos (e às 23:55 e 23:59) e GUARDA aqui cada operação. A ficha junta depois estas cópias
-- (só módulo DC) com o resto, que vem do PLOGITF.
--
--   aplicacoes_dc : uma linha por operação (data de início + empresa + sequência + nº de operação). Gravar outra vez a
--                   mesma operação atualiza-a (os contadores mudam enquanto o lote corre); nunca se apaga nada.
-- O worker só pode gravar por worker_guardar_dc, com o seu token. A app só lê.

CREATE TABLE IF NOT EXISTS public.aplicacoes_dc (
  data date NOT NULL,                        -- data de início (ACDTIN)
  empresa text NOT NULL,                     -- ACEMP (ex.: ORD_PS2_01, MSCC, TELECOMP)
  seq integer NOT NULL,                      -- ACSQAP
  n_operacao text NOT NULL,                  -- ACNOPR
  linha jsonb NOT NULL,                      -- o registo em bruto (54 valores, pela ordem das colunas da GBAPL)
  primeira_copia timestamptz NOT NULL DEFAULT now(),
  atualizada_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (data, empresa, seq, n_operacao)
);
CREATE INDEX IF NOT EXISTS idx_aplicacoes_dc_data ON public.aplicacoes_dc (data);

ALTER TABLE public.aplicacoes_dc ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Aplicações DC visíveis para a equipa" ON public.aplicacoes_dc;
CREATE POLICY "Aplicações DC visíveis para a equipa" ON public.aplicacoes_dc FOR SELECT TO authenticated USING (true);
REVOKE ALL ON public.aplicacoes_dc FROM public, anon, authenticated;
GRANT SELECT ON public.aplicacoes_dc TO authenticated;

-- O worker entrega as operações lidas da GBAPL: [{data, empresa, seq, n_operacao, linha}, …]. Devolve quantas gravou.
CREATE OR REPLACE FUNCTION public.worker_guardar_dc(p_token text, p_registos jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_n integer;
BEGIN
  IF public.token_worker_valido(p_token) IS NULL THEN
    RAISE EXCEPTION 'Token inválido';
  END IF;
  IF p_registos IS NULL OR jsonb_typeof(p_registos) <> 'array' THEN
    RAISE EXCEPTION 'Dados inválidos';
  END IF;
  IF jsonb_array_length(p_registos) > 5000 THEN
    RAISE EXCEPTION 'Registos a mais (máximo 5000 de cada vez)';
  END IF;

  INSERT INTO public.aplicacoes_dc (data, empresa, seq, n_operacao, linha)
  -- DISTINCT ON: a mesma operação duas vezes no mesmo lote faria o ON CONFLICT falhar («não pode afetar a mesma linha duas vezes»).
  SELECT DISTINCT ON (r.data, r.empresa, r.seq, r.n_operacao) r.data, r.empresa, r.seq, r.n_operacao, r.linha
    FROM jsonb_to_recordset(p_registos) AS r(data date, empresa text, seq integer, n_operacao text, linha jsonb)
   WHERE r.data IS NOT NULL AND r.empresa IS NOT NULL AND r.seq IS NOT NULL AND r.n_operacao IS NOT NULL
     AND r.linha IS NOT NULL AND jsonb_typeof(r.linha) = 'array'
  ON CONFLICT (data, empresa, seq, n_operacao)
  DO UPDATE SET linha = EXCLUDED.linha, atualizada_em = now();
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;

REVOKE ALL ON FUNCTION public.worker_guardar_dc(text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.worker_guardar_dc(text, jsonb) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
