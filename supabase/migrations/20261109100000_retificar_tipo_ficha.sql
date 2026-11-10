-- Retificar também o TIPO da ficha (dia útil <-> dia não útil).
--
-- Caso real: uma ficha de "dia útil" preenchida num dia não útil (só tem o turno 3). Em vez de a refazer, retifica-se:
-- passa a ficha de dia não útil, com o mesmo motivo + PIN e o original guardado em `fichas_edicoes`
-- (agora com o tipo antes/depois). `p_form_type` é opcional: sem ele, o tipo mantém-se (como antes).
-- Muda a assinatura (novo parâmetro), por isso a função antiga sai.

DROP FUNCTION IF EXISTS public.editar_ficha_exportada(uuid, uuid, text, jsonb, jsonb, jsonb, jsonb, text);

CREATE OR REPLACE FUNCTION public.editar_ficha_exportada(
  p_id         uuid,
  p_token      uuid,
  p_date       text,
  p_turn_data  jsonb,
  p_tasks      jsonb,
  p_table_rows jsonb,
  p_assinatura jsonb,
  p_motivo     text,
  p_form_type  text DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_old    public.exported_taskboards%ROWTYPE;
  v_codigo text;
  v_nova   integer;
  v_motivo text := btrim(coalesce(p_motivo, ''));
  v_tipo   text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.operators WHERE user_id = auth.uid() AND ativo) THEN
    RAISE EXCEPTION 'A conta não está ligada a um operador ativo';
  END IF;
  IF char_length(v_motivo) < 10 THEN
    RAISE EXCEPTION 'Indica o motivo da retificação (pelo menos 10 caracteres)';
  END IF;
  IF p_date IS NULL OR p_date !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'Data inválida';
  END IF;
  IF p_form_type IS NOT NULL AND p_form_type NOT IN ('dia-util', 'dia-nao-util') THEN
    RAISE EXCEPTION 'Tipo de ficha inválido';
  END IF;
  IF jsonb_typeof(p_turn_data) IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_tasks) IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_table_rows) IS DISTINCT FROM 'array'
     OR jsonb_typeof(p_assinatura) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Conteúdo da ficha inválido';
  END IF;

  -- O PIN do administrador: o token é de uso único e fica gasto mesmo que o resto falhe depois (a transação desfaz tudo).
  PERFORM public.consumir_token_assinatura(p_token);

  SELECT * INTO v_old FROM public.exported_taskboards WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ficha não encontrada';
  END IF;

  v_tipo := coalesce(p_form_type, v_old.form_type);

  IF (p_date <> v_old.date OR v_tipo <> v_old.form_type) AND EXISTS (
    SELECT 1 FROM public.exported_taskboards
     WHERE form_type = v_tipo AND date = p_date AND id <> p_id
  ) THEN
    RAISE EXCEPTION 'Já existe uma ficha deste tipo exportada em %', p_date;
  END IF;

  SELECT value INTO v_codigo FROM public.operators WHERE user_id = auth.uid() LIMIT 1;
  v_nova := v_old.versao + 1;

  INSERT INTO public.fichas_edicoes
    (ficha_id, form_type, versao_anterior, versao_nova, editado_por, editado_por_codigo, motivo, antes, depois)
  VALUES (
    v_old.id, v_old.form_type, v_old.versao, v_nova, auth.uid(), v_codigo, v_motivo,
    jsonb_build_object(
      'form_type', v_old.form_type, 'date', v_old.date, 'turn_data', v_old.turn_data, 'tasks', v_old.tasks,
      'table_rows', v_old.table_rows, 'pdf_signature', v_old.pdf_signature
    ),
    jsonb_build_object(
      'form_type', v_tipo, 'date', p_date, 'turn_data', p_turn_data, 'tasks', p_tasks,
      'table_rows', p_table_rows, 'pdf_signature', p_assinatura
    )
  );

  UPDATE public.exported_taskboards
     SET date = p_date,
         form_type = v_tipo,
         turn_data = p_turn_data,
         tasks = p_tasks,
         table_rows = p_table_rows,
         pdf_signature = p_assinatura,
         file_name = CASE WHEN p_date <> v_old.date THEN replace(v_old.file_name, v_old.date, p_date) ELSE v_old.file_name END,
         versao = v_nova,
         editada_em = now(),
         editada_por_codigo = v_codigo
   WHERE id = p_id;

  RETURN v_nova;
END;
$$;

REVOKE ALL ON FUNCTION public.editar_ficha_exportada(uuid, uuid, text, jsonb, jsonb, jsonb, jsonb, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.editar_ficha_exportada(uuid, uuid, text, jsonb, jsonb, jsonb, jsonb, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
