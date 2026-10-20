-- Ocorrências estruturadas.
--
-- Em vez de texto livre nas observações da ficha, cada incidente fica registado com data, turno,
-- categoria, gravidade, sistema afetado, quem o registou e como foi resolvido. Serve para
-- pesquisar, ver o que se repete e aprender com os incidentes.
--
-- Leitura: toda a equipa. Escrita: só pelas funções abaixo (nunca direta). Fica também no
-- registo de alterações (gatilho registar_alteracao).

CREATE TABLE IF NOT EXISTS public.ocorrencias (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data                 date NOT NULL,
  hora                 text CHECK (hora IS NULL OR hora ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  turno                text CHECK (turno IS NULL OR turno IN ('turno1', 'turno2', 'turno3')),
  categoria            text NOT NULL CHECK (categoria IN ('core', 'ficheiros', 'rede', 'servidores', 'balcoes', 'cartoes', 'seguranca', 'outro')),
  gravidade            text NOT NULL CHECK (gravidade IN ('baixa', 'media', 'alta')),
  sistema              text CHECK (sistema IS NULL OR char_length(sistema) <= 60),
  titulo               text NOT NULL CHECK (char_length(titulo) BETWEEN 3 AND 120),
  descricao            text CHECK (descricao IS NULL OR char_length(descricao) <= 2000),
  estado               text NOT NULL DEFAULT 'aberta' CHECK (estado IN ('aberta', 'resolvida')),
  resolucao            text CHECK (resolucao IS NULL OR char_length(resolucao) <= 2000),
  criada_por           uuid,
  criada_por_codigo    text,
  criada_em            timestamptz NOT NULL DEFAULT now(),
  resolvida_por_codigo text,
  resolvida_em         timestamptz,
  atualizada_em        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ocorrencias_data ON public.ocorrencias (data DESC, criada_em DESC);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_estado ON public.ocorrencias (estado) WHERE estado = 'aberta';

ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ocorrências visíveis à equipa" ON public.ocorrencias;
CREATE POLICY "Ocorrências visíveis à equipa" ON public.ocorrencias
  FOR SELECT TO authenticated USING (true);

REVOKE ALL ON TABLE public.ocorrencias FROM anon, authenticated;
GRANT SELECT ON TABLE public.ocorrencias TO authenticated;

-- ---------------------------------------------------------------- registar
CREATE OR REPLACE FUNCTION public.registar_ocorrencia(
  p_data       date,
  p_hora       text,
  p_turno      text,
  p_categoria  text,
  p_gravidade  text,
  p_sistema    text,
  p_titulo     text,
  p_descricao  text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_codigo text;
  v_id     uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF p_data IS NULL THEN
    RAISE EXCEPTION 'Indica a data da ocorrência';
  END IF;

  SELECT value INTO v_codigo FROM public.operators WHERE user_id = auth.uid() AND ativo LIMIT 1;

  INSERT INTO public.ocorrencias (data, hora, turno, categoria, gravidade, sistema, titulo, descricao, criada_por, criada_por_codigo)
  VALUES (
    p_data,
    nullif(btrim(coalesce(p_hora, '')), ''),
    nullif(btrim(coalesce(p_turno, '')), ''),
    p_categoria,
    p_gravidade,
    nullif(btrim(coalesce(p_sistema, '')), ''),
    btrim(coalesce(p_titulo, '')),
    nullif(btrim(coalesce(p_descricao, '')), ''),
    auth.uid(),
    v_codigo
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------- editar (autor ou administrador)
CREATE OR REPLACE FUNCTION public.atualizar_ocorrencia(
  p_id         uuid,
  p_hora       text,
  p_categoria  text,
  p_gravidade  text,
  p_sistema    text,
  p_titulo     text,
  p_descricao  text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_o public.ocorrencias%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO v_o FROM public.ocorrencias WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ocorrência não encontrada';
  END IF;
  IF v_o.criada_por IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Só quem registou a ocorrência (ou um administrador) a pode editar';
  END IF;

  UPDATE public.ocorrencias
     SET hora = nullif(btrim(coalesce(p_hora, '')), ''),
         categoria = p_categoria,
         gravidade = p_gravidade,
         sistema = nullif(btrim(coalesce(p_sistema, '')), ''),
         titulo = btrim(coalesce(p_titulo, '')),
         descricao = nullif(btrim(coalesce(p_descricao, '')), ''),
         atualizada_em = now()
   WHERE id = p_id;
END;
$$;

-- ---------------------------------------------------------------- resolver / reabrir (qualquer operador)
CREATE OR REPLACE FUNCTION public.resolver_ocorrencia(p_id uuid, p_resolucao text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_codigo text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF btrim(coalesce(p_resolucao, '')) = '' THEN
    RAISE EXCEPTION 'Indica como foi resolvida';
  END IF;

  SELECT value INTO v_codigo FROM public.operators WHERE user_id = auth.uid() AND ativo LIMIT 1;

  UPDATE public.ocorrencias
     SET estado = 'resolvida',
         resolucao = btrim(p_resolucao),
         resolvida_por_codigo = v_codigo,
         resolvida_em = now(),
         atualizada_em = now()
   WHERE id = p_id AND estado = 'aberta';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ocorrência não encontrada ou já resolvida';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.reabrir_ocorrencia(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  UPDATE public.ocorrencias
     SET estado = 'aberta',
         resolvida_por_codigo = NULL,
         resolvida_em = NULL,
         atualizada_em = now()
   WHERE id = p_id AND estado = 'resolvida';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ocorrência não encontrada ou já aberta';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.registar_ocorrencia(date, text, text, text, text, text, text, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.atualizar_ocorrencia(uuid, text, text, text, text, text, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.resolver_ocorrencia(uuid, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.reabrir_ocorrencia(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.registar_ocorrencia(date, text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.atualizar_ocorrencia(uuid, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolver_ocorrencia(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reabrir_ocorrencia(uuid) TO authenticated;

-- ---------------------------------------------------------------- auditoria
DROP TRIGGER IF EXISTS auditoria ON public.ocorrencias;
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE OR DELETE ON public.ocorrencias
  FOR EACH ROW EXECUTE FUNCTION public.registar_alteracao();
