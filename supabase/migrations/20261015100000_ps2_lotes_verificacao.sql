-- =====================================================
-- Verificação de ficheiros PS2 (salários, cobranças, …)
-- =====================================================
-- Cada ficheiro PS2 guardado no gerador fica registado aqui: empresa, conta, valor, nº de
-- registos. O turno seguinte vê a lista, confere no core (um débito/crédito do valor, sem
-- duplicados) e assina com o PIN.
--
-- Escrita só pelas funções abaixo (SECURITY DEFINER): ninguém altera valores à mão pela API.
-- Idempotente.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ps2_lotes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  gerado_por          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  gerado_por_codigo   text,
  nome_ficheiro       text NOT NULL,
  empresa             text NOT NULL DEFAULT '',
  conta_empresa       text NOT NULL,
  tipo_operacao       text NOT NULL,
  sentido             text NOT NULL CHECK (sentido IN ('debito', 'credito')),
  data_processamento  date NOT NULL,
  total               numeric(18, 2) NOT NULL CHECK (total >= 0),
  n_registos          integer NOT NULL CHECK (n_registos >= 0),
  hash_ficheiro       text NOT NULL,
  estado              text NOT NULL DEFAULT 'por_verificar' CHECK (estado IN ('por_verificar', 'verificado', 'problema')),
  verificado_por      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verificado_por_codigo text,
  verificado_em       timestamptz,
  contagem            integer,
  mesma_pessoa        boolean,
  observacoes         text
);

CREATE INDEX IF NOT EXISTS idx_ps2_lotes_estado_data ON public.ps2_lotes (estado, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ps2_lotes_hash ON public.ps2_lotes (hash_ficheiro);

ALTER TABLE public.ps2_lotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ps2_lotes visiveis a equipa" ON public.ps2_lotes;
CREATE POLICY "ps2_lotes visiveis a equipa"
  ON public.ps2_lotes FOR SELECT TO authenticated USING (true);
-- Sem políticas de INSERT/UPDATE/DELETE: só as funções.

-- ---------------------------------------------------------------- registar
CREATE OR REPLACE FUNCTION public.registar_lote_ps2(
  p_nome_ficheiro text,
  p_empresa       text,
  p_conta_empresa text,
  p_tipo_operacao text,
  p_sentido       text,
  p_data          date,
  p_total         numeric,
  p_n_registos    integer,
  p_hash          text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id      uuid;
  v_codigo  text;
  v_anterior timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF coalesce(btrim(p_nome_ficheiro), '') = '' OR length(p_nome_ficheiro) > 120 THEN
    RAISE EXCEPTION 'Nome de ficheiro inválido';
  END IF;
  IF p_conta_empresa !~ '^[0-9]{21}$' THEN
    RAISE EXCEPTION 'Conta da empresa inválida';
  END IF;
  IF p_sentido NOT IN ('debito', 'credito') THEN
    RAISE EXCEPTION 'Sentido inválido';
  END IF;
  IF p_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Hash inválido';
  END IF;
  IF p_total IS NULL OR p_total < 0 OR p_n_registos IS NULL OR p_n_registos < 0 THEN
    RAISE EXCEPTION 'Total ou nº de registos inválido';
  END IF;

  SELECT value INTO v_codigo FROM public.operators WHERE user_id = auth.uid() LIMIT 1;

  -- Já guardámos exatamente este ficheiro? (o mesmo conteúdo) — é informação, não erro.
  SELECT max(created_at) INTO v_anterior FROM public.ps2_lotes WHERE hash_ficheiro = p_hash;

  INSERT INTO public.ps2_lotes (
    gerado_por, gerado_por_codigo, nome_ficheiro, empresa, conta_empresa, tipo_operacao,
    sentido, data_processamento, total, n_registos, hash_ficheiro
  ) VALUES (
    auth.uid(), v_codigo, btrim(p_nome_ficheiro), btrim(coalesce(p_empresa, '')), p_conta_empresa,
    p_tipo_operacao, p_sentido, p_data, p_total, p_n_registos, p_hash
  ) RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id, 'repetido', v_anterior IS NOT NULL, 'repetido_em', v_anterior);
END;
$$;

-- ---------------------------------------------------------------- editar (empresa / sentido)
CREATE OR REPLACE FUNCTION public.editar_lote_ps2(p_id uuid, p_empresa text, p_sentido text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF p_sentido NOT IN ('debito', 'credito') THEN
    RAISE EXCEPTION 'Sentido inválido';
  END IF;

  UPDATE public.ps2_lotes
     SET empresa = btrim(coalesce(p_empresa, '')),
         -- O sentido só se corrige antes de verificar (depois fica o que foi assinado).
         sentido = CASE WHEN estado = 'por_verificar' THEN p_sentido ELSE sentido END
   WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lote não encontrado';
  END IF;
END;
$$;

-- ---------------------------------------------------------------- verificar (com PIN)
CREATE OR REPLACE FUNCTION public.verificar_lote_ps2(
  p_id           uuid,
  p_token        uuid,
  p_contagem     integer,
  p_observacoes  text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_lote   public.ps2_lotes%ROWTYPE;
  v_codigo text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF p_contagem IS NULL OR p_contagem < 0 THEN
    RAISE EXCEPTION 'Contagem inválida';
  END IF;

  SELECT * INTO v_lote FROM public.ps2_lotes WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lote não encontrado';
  END IF;
  IF v_lote.estado <> 'por_verificar' THEN
    RAISE EXCEPTION 'Este lote já foi verificado';
  END IF;
  -- Fora do "1 movimento" é um problema e tem de ter uma nota.
  IF p_contagem <> 1 AND coalesce(btrim(p_observacoes), '') = '' THEN
    RAISE EXCEPTION 'Indica uma observação (o resultado não é "um movimento").';
  END IF;

  -- Gasta o token do PIN (levanta exceção se for inválido, de outra pessoa, usado ou expirado).
  PERFORM public.consumir_token_assinatura(p_token);

  SELECT value INTO v_codigo FROM public.operators WHERE user_id = auth.uid() LIMIT 1;

  UPDATE public.ps2_lotes
     SET estado = CASE WHEN p_contagem = 1 THEN 'verificado' ELSE 'problema' END,
         contagem = p_contagem,
         verificado_por = auth.uid(),
         verificado_por_codigo = v_codigo,
         verificado_em = now(),
         mesma_pessoa = (v_lote.gerado_por IS NOT DISTINCT FROM auth.uid()),
         observacoes = nullif(btrim(coalesce(p_observacoes, '')), '')
   WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.registar_lote_ps2(text, text, text, text, text, date, numeric, integer, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.editar_lote_ps2(uuid, text, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.verificar_lote_ps2(uuid, uuid, integer, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.registar_lote_ps2(text, text, text, text, text, date, numeric, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.editar_lote_ps2(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verificar_lote_ps2(uuid, uuid, integer, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
