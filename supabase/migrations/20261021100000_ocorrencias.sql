-- Ficha de Comunicação/Ocorrências.
--
-- Replica a ficha em papel do Centro Informática: por dia, uma lista de ocorrências com
--   N.º Avaria · Descrição da Avaria · Hora Início · Hora Término · Encaminhamento
-- e o campo "Outras Intervenções/Observações". Uma ocorrência sem hora de término está em curso.
-- (Categoria e sistema são opcionais: servem para pesquisar e ver o que se repete.)
--
-- Leitura: toda a equipa. Escrita: só pelas funções abaixo (nunca direta). Tudo fica também no
-- registo de alterações (gatilho registar_alteracao).

CREATE TABLE IF NOT EXISTS public.ocorrencias (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data              date NOT NULL,
  turno             text CHECK (turno IS NULL OR turno IN ('turno1', 'turno2', 'turno3')),
  n_avaria          text CHECK (n_avaria IS NULL OR char_length(n_avaria) <= 30),
  descricao         text NOT NULL CHECK (char_length(descricao) BETWEEN 3 AND 1000),
  hora_inicio       text CHECK (hora_inicio IS NULL OR hora_inicio ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  hora_termino      text CHECK (hora_termino IS NULL OR hora_termino ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  encaminhamento    text CHECK (encaminhamento IS NULL OR char_length(encaminhamento) <= 300),
  categoria         text CHECK (categoria IS NULL OR categoria IN ('core', 'ficheiros', 'rede', 'servidores', 'balcoes', 'cartoes', 'seguranca', 'outro')),
  sistema           text CHECK (sistema IS NULL OR char_length(sistema) <= 60),
  criada_por        uuid,
  criada_por_codigo text,
  criada_em         timestamptz NOT NULL DEFAULT now(),
  atualizada_em     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ocorrencias_data ON public.ocorrencias (data DESC, criada_em);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_em_curso ON public.ocorrencias (data) WHERE hora_termino IS NULL;

-- "Outras Intervenções/Observações": um texto por dia.
CREATE TABLE IF NOT EXISTS public.ocorrencias_dia (
  data                   date PRIMARY KEY,
  observacoes            text NOT NULL DEFAULT '' CHECK (char_length(observacoes) <= 3000),
  atualizada_por_codigo  text,
  atualizada_em          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocorrencias_dia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ocorrências visíveis à equipa" ON public.ocorrencias;
CREATE POLICY "Ocorrências visíveis à equipa" ON public.ocorrencias
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Observações do dia visíveis à equipa" ON public.ocorrencias_dia;
CREATE POLICY "Observações do dia visíveis à equipa" ON public.ocorrencias_dia
  FOR SELECT TO authenticated USING (true);

REVOKE ALL ON TABLE public.ocorrencias FROM anon, authenticated;
REVOKE ALL ON TABLE public.ocorrencias_dia FROM anon, authenticated;
GRANT SELECT ON TABLE public.ocorrencias TO authenticated;
GRANT SELECT ON TABLE public.ocorrencias_dia TO authenticated;

-- ---------------------------------------------------------------- registar
CREATE OR REPLACE FUNCTION public.registar_ocorrencia(
  p_data            date,
  p_turno           text,
  p_n_avaria        text,
  p_descricao       text,
  p_hora_inicio     text,
  p_hora_termino    text,
  p_encaminhamento  text,
  p_categoria       text,
  p_sistema         text
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

  INSERT INTO public.ocorrencias
    (data, turno, n_avaria, descricao, hora_inicio, hora_termino, encaminhamento, categoria, sistema, criada_por, criada_por_codigo)
  VALUES (
    p_data,
    nullif(btrim(coalesce(p_turno, '')), ''),
    nullif(btrim(coalesce(p_n_avaria, '')), ''),
    btrim(coalesce(p_descricao, '')),
    nullif(btrim(coalesce(p_hora_inicio, '')), ''),
    nullif(btrim(coalesce(p_hora_termino, '')), ''),
    nullif(btrim(coalesce(p_encaminhamento, '')), ''),
    nullif(btrim(coalesce(p_categoria, '')), ''),
    nullif(btrim(coalesce(p_sistema, '')), ''),
    auth.uid(),
    v_codigo
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------- editar (qualquer operador)
-- Quem se engana na data ou no turno corrige-o aqui. Qualquer operador ativo pode editar: cada alteração
-- (de → para, e quem a fez) fica no registo de alterações.
CREATE OR REPLACE FUNCTION public.atualizar_ocorrencia(
  p_id              uuid,
  p_data            date,
  p_turno           text,
  p_n_avaria        text,
  p_descricao       text,
  p_hora_inicio     text,
  p_hora_termino    text,
  p_encaminhamento  text,
  p_categoria       text,
  p_sistema         text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.operators WHERE user_id = auth.uid() AND ativo) THEN
    RAISE EXCEPTION 'A conta não está ligada a um operador ativo';
  END IF;
  IF p_data IS NULL THEN
    RAISE EXCEPTION 'Indica a data da ocorrência';
  END IF;

  UPDATE public.ocorrencias
     SET data = p_data,
         turno = nullif(btrim(coalesce(p_turno, '')), ''),
         n_avaria = nullif(btrim(coalesce(p_n_avaria, '')), ''),
         descricao = btrim(coalesce(p_descricao, '')),
         hora_inicio = nullif(btrim(coalesce(p_hora_inicio, '')), ''),
         hora_termino = nullif(btrim(coalesce(p_hora_termino, '')), ''),
         encaminhamento = nullif(btrim(coalesce(p_encaminhamento, '')), ''),
         categoria = nullif(btrim(coalesce(p_categoria, '')), ''),
         sistema = nullif(btrim(coalesce(p_sistema, '')), ''),
         atualizada_em = now()
   WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ocorrência não encontrada';
  END IF;
END;
$$;

-- ---------------------------------------------------------------- terminar / reabrir (qualquer operador:
-- uma ocorrência pode começar num turno e terminar noutro)
CREATE OR REPLACE FUNCTION public.terminar_ocorrencia(p_id uuid, p_hora_termino text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF p_hora_termino IS NULL OR p_hora_termino !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN
    RAISE EXCEPTION 'Indica a hora de término (HH:MM)';
  END IF;

  UPDATE public.ocorrencias
     SET hora_termino = p_hora_termino, atualizada_em = now()
   WHERE id = p_id AND hora_termino IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ocorrência não encontrada ou já terminada';
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
     SET hora_termino = NULL, atualizada_em = now()
   WHERE id = p_id AND hora_termino IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ocorrência não encontrada ou ainda em curso';
  END IF;
END;
$$;

-- ---------------------------------------------------------------- "Outras Intervenções/Observações" do dia
CREATE OR REPLACE FUNCTION public.guardar_observacoes_dia(p_data date, p_texto text)
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
  IF p_data IS NULL THEN
    RAISE EXCEPTION 'Indica a data';
  END IF;

  SELECT value INTO v_codigo FROM public.operators WHERE user_id = auth.uid() AND ativo LIMIT 1;

  INSERT INTO public.ocorrencias_dia (data, observacoes, atualizada_por_codigo, atualizada_em)
  VALUES (p_data, btrim(coalesce(p_texto, '')), v_codigo, now())
  ON CONFLICT (data) DO UPDATE
     SET observacoes = excluded.observacoes,
         atualizada_por_codigo = excluded.atualizada_por_codigo,
         atualizada_em = excluded.atualizada_em;
END;
$$;

REVOKE ALL ON FUNCTION public.registar_ocorrencia(date, text, text, text, text, text, text, text, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.atualizar_ocorrencia(uuid, date, text, text, text, text, text, text, text, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.terminar_ocorrencia(uuid, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.reabrir_ocorrencia(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.guardar_observacoes_dia(date, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.registar_ocorrencia(date, text, text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.atualizar_ocorrencia(uuid, date, text, text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.terminar_ocorrencia(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reabrir_ocorrencia(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_observacoes_dia(date, text) TO authenticated;

-- ---------------------------------------------------------------- auditoria
DROP TRIGGER IF EXISTS auditoria ON public.ocorrencias;
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE OR DELETE ON public.ocorrencias
  FOR EACH ROW EXECUTE FUNCTION public.registar_alteracao();

DROP TRIGGER IF EXISTS auditoria ON public.ocorrencias_dia;
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE OR DELETE ON public.ocorrencias_dia
  FOR EACH ROW EXECUTE FUNCTION public.registar_alteracao();
