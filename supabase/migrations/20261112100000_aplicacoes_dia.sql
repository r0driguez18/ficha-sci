-- Aplicações do dia (core bancário) -> ficha.
--
-- O core (iSeries) só se consegue consultar a partir de uma máquina com o driver ODBC e acesso à rede dele. Por isso a app
-- não corre a query: a pessoa carrega num botão, a app regista um PEDIDO, e um pequeno programa («worker», num PC ou no
-- servidor) vê o pedido, corre a query e ENTREGA as linhas. A app guarda-as (aplicacoes_dia), mostra-as e gera o Excel.
--
--   pedidos_aplicacoes : o que foi pedido, por quem, e em que estado está (pendente -> a-correr -> concluido | erro).
--   aplicacoes_dia     : cada entrega (colunas + linhas em bruto). Só cresce: uma nova entrega não apaga a anterior.
--   worker_tokens      : a «chave» do worker (só o hash fica guardado). O worker NÃO tem conta de utilizador nem chave
--                        de serviço: só pode chamar as 2 funções worker_* abaixo, com o seu token.
-- Nada é editável diretamente pelo cliente: tudo passa por funções.

CREATE TABLE IF NOT EXISTS public.aplicacoes_dia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,                       -- a data da ficha para que foi gerado
  origem text NOT NULL CHECK (origem IN ('worker', 'manual')),
  colunas jsonb NOT NULL,
  linhas jsonb NOT NULL,
  n_linhas integer NOT NULL DEFAULT 0,
  gerado_em timestamptz NOT NULL DEFAULT now(),
  gerado_por uuid,
  gerado_por_nome text
);
CREATE INDEX IF NOT EXISTS idx_aplicacoes_dia_data ON public.aplicacoes_dia (data, gerado_em DESC);

CREATE TABLE IF NOT EXISTS public.pedidos_aplicacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  estado text NOT NULL DEFAULT 'pendente' CHECK (estado IN ('pendente', 'a-correr', 'concluido', 'erro')),
  pedido_por uuid,
  pedido_por_nome text,
  pedido_em timestamptz NOT NULL DEFAULT now(),
  iniciado_em timestamptz,
  concluido_em timestamptz,
  erro text,
  aplicacao_id uuid REFERENCES public.aplicacoes_dia(id)
);
CREATE INDEX IF NOT EXISTS idx_pedidos_aplicacoes_data ON public.pedidos_aplicacoes (data, pedido_em DESC);

CREATE TABLE IF NOT EXISTS public.worker_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  hash text NOT NULL UNIQUE,                -- sha256 do token (o token em si nunca é guardado)
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  ultimo_uso timestamptz
);

ALTER TABLE public.aplicacoes_dia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_aplicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Aplicações do dia visíveis para a equipa" ON public.aplicacoes_dia;
CREATE POLICY "Aplicações do dia visíveis para a equipa" ON public.aplicacoes_dia FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Pedidos de aplicações visíveis para a equipa" ON public.pedidos_aplicacoes;
CREATE POLICY "Pedidos de aplicações visíveis para a equipa" ON public.pedidos_aplicacoes FOR SELECT TO authenticated USING (true);
-- worker_tokens: sem política = ninguém lê/escreve diretamente (só as funções abaixo).

REVOKE ALL ON public.aplicacoes_dia, public.pedidos_aplicacoes, public.worker_tokens FROM public, anon, authenticated;
GRANT SELECT ON public.aplicacoes_dia, public.pedidos_aplicacoes TO authenticated;

-- ---------------------------------------------------------------------------------------------- pedir (botão da ficha)
-- Um pedido ainda por tratar (pendente, ou a correr há menos de 5 min) é reaproveitado: carregar duas vezes não gera dois.
CREATE OR REPLACE FUNCTION public.pedir_aplicacoes_dia(p_data date)
RETURNS public.pedidos_aplicacoes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_p public.pedidos_aplicacoes;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF p_data IS NULL THEN
    RAISE EXCEPTION 'Data em falta';
  END IF;

  -- O que ficou preso (worker desligado a meio) passa a erro, para não bloquear novos pedidos.
  UPDATE public.pedidos_aplicacoes
     SET estado = 'erro', concluido_em = now(), erro = 'O worker não respondeu a tempo.'
   WHERE (estado = 'pendente' AND pedido_em < now() - interval '10 minutes')
      OR (estado = 'a-correr' AND iniciado_em < now() - interval '5 minutes');

  SELECT * INTO v_p FROM public.pedidos_aplicacoes
   WHERE estado IN ('pendente', 'a-correr') AND data = p_data
   ORDER BY pedido_em DESC LIMIT 1;
  IF FOUND THEN
    RETURN v_p;
  END IF;

  INSERT INTO public.pedidos_aplicacoes (data, pedido_por, pedido_por_nome)
  VALUES (p_data, auth.uid(), public.nome_operador_atual())
  RETURNING * INTO v_p;
  RETURN v_p;
END;
$$;

-- ---------------------------------------------------------------------------------------------- carregar Excel à mão
CREATE OR REPLACE FUNCTION public.registar_aplicacoes_manual(p_data date, p_colunas jsonb, p_linhas jsonb)
RETURNS public.aplicacoes_dia
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_a public.aplicacoes_dia;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF p_data IS NULL OR jsonb_typeof(p_colunas) <> 'array' OR jsonb_typeof(p_linhas) <> 'array' THEN
    RAISE EXCEPTION 'Dados inválidos';
  END IF;
  IF jsonb_array_length(p_linhas) = 0 OR jsonb_array_length(p_linhas) > 5000 THEN
    RAISE EXCEPTION 'O ficheiro tem de ter entre 1 e 5000 linhas';
  END IF;

  INSERT INTO public.aplicacoes_dia (data, origem, colunas, linhas, n_linhas, gerado_por, gerado_por_nome)
  VALUES (p_data, 'manual', p_colunas, p_linhas, jsonb_array_length(p_linhas), auth.uid(), public.nome_operador_atual())
  RETURNING * INTO v_a;
  RETURN v_a;
END;
$$;

-- ---------------------------------------------------------------------------------------------- worker
CREATE OR REPLACE FUNCTION public.token_worker_valido(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_token IS NULL OR length(p_token) < 32 THEN
    RETURN NULL;
  END IF;
  UPDATE public.worker_tokens
     SET ultimo_uso = now()
   WHERE ativo AND hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
   RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- O worker pergunta «há algum pedido?»; se houver, fica seu (a-correr) e recebe-o. Sem pedido devolve NULL.
CREATE OR REPLACE FUNCTION public.worker_reclamar_pedido(p_token text)
RETURNS public.pedidos_aplicacoes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_p public.pedidos_aplicacoes;
BEGIN
  IF public.token_worker_valido(p_token) IS NULL THEN
    RAISE EXCEPTION 'Token inválido';
  END IF;
  UPDATE public.pedidos_aplicacoes
     SET estado = 'a-correr', iniciado_em = now()
   WHERE id = (SELECT id FROM public.pedidos_aplicacoes WHERE estado = 'pendente' ORDER BY pedido_em LIMIT 1 FOR UPDATE SKIP LOCKED)
   RETURNING * INTO v_p;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  RETURN v_p;
END;
$$;

-- O worker entrega o resultado (linhas) ou o erro.
CREATE OR REPLACE FUNCTION public.worker_entregar_aplicacoes(p_token text, p_pedido uuid, p_colunas jsonb, p_linhas jsonb, p_erro text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_p public.pedidos_aplicacoes;
  v_a uuid;
BEGIN
  IF public.token_worker_valido(p_token) IS NULL THEN
    RAISE EXCEPTION 'Token inválido';
  END IF;
  SELECT * INTO v_p FROM public.pedidos_aplicacoes WHERE id = p_pedido FOR UPDATE;
  IF NOT FOUND OR v_p.estado <> 'a-correr' THEN
    RAISE EXCEPTION 'Pedido inexistente ou já tratado';
  END IF;

  IF p_erro IS NOT NULL AND btrim(p_erro) <> '' THEN
    UPDATE public.pedidos_aplicacoes
       SET estado = 'erro', concluido_em = now(), erro = left(p_erro, 500)
     WHERE id = p_pedido;
    RETURN;
  END IF;

  IF jsonb_typeof(p_colunas) <> 'array' OR jsonb_typeof(p_linhas) <> 'array' THEN
    RAISE EXCEPTION 'Dados inválidos';
  END IF;
  IF jsonb_array_length(p_linhas) > 5000 THEN
    RAISE EXCEPTION 'Linhas a mais (máximo 5000)';
  END IF;

  INSERT INTO public.aplicacoes_dia (data, origem, colunas, linhas, n_linhas, gerado_por, gerado_por_nome)
  VALUES (v_p.data, 'worker', p_colunas, p_linhas, jsonb_array_length(p_linhas), v_p.pedido_por, v_p.pedido_por_nome)
  RETURNING id INTO v_a;
  UPDATE public.pedidos_aplicacoes
     SET estado = 'concluido', concluido_em = now(), aplicacao_id = v_a, erro = NULL
   WHERE id = p_pedido;
END;
$$;

-- Criar um token (administrador): devolve o token UMA vez; a base só guarda o hash. Revogar = ativo = false.
CREATE OR REPLACE FUNCTION public.criar_token_worker(p_nome text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Só um administrador cria tokens';
  END IF;
  IF p_nome IS NULL OR btrim(p_nome) = '' THEN
    RAISE EXCEPTION 'Dá um nome ao token (ex.: PC do cabo)';
  END IF;
  INSERT INTO public.worker_tokens (nome, hash) VALUES (btrim(p_nome), encode(sha256(convert_to(v_token, 'UTF8')), 'hex'));
  RETURN v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.pedir_aplicacoes_dia(date) FROM public, anon;
REVOKE ALL ON FUNCTION public.registar_aplicacoes_manual(date, jsonb, jsonb) FROM public, anon;
REVOKE ALL ON FUNCTION public.token_worker_valido(text) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.worker_reclamar_pedido(text) FROM public;
REVOKE ALL ON FUNCTION public.worker_entregar_aplicacoes(text, uuid, jsonb, jsonb, text) FROM public;
REVOKE ALL ON FUNCTION public.criar_token_worker(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.pedir_aplicacoes_dia(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registar_aplicacoes_manual(date, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.criar_token_worker(text) TO authenticated;
-- O worker liga-se sem conta (chave anónima da API) e prova quem é com o token.
GRANT EXECUTE ON FUNCTION public.worker_reclamar_pedido(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.worker_entregar_aplicacoes(text, uuid, jsonb, jsonb, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
