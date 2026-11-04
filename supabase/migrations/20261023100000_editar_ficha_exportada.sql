-- Retificação de fichas já exportadas (só administradores).
--
-- Uma ficha exportada não se pode repetir nem apagar, mas pode ter erros (data trocada, tarefa mal marcada,
-- "Verificado por" por preencher). Em vez de a refazer, o administrador retifica-a:
--   • tem de dar um motivo e assinar com o PIN (o token é gasto aqui, no servidor);
--   • o conteúdo ANTERIOR fica guardado, completo, em `fichas_edicoes` (imutável) — nunca se perde o original;
--   • a ficha passa a versão n+1 e mostra quem a retificou e quando.
-- A escrita só acontece pela função abaixo; ninguém mexe nas tabelas diretamente.

ALTER TABLE public.exported_taskboards
  ADD COLUMN IF NOT EXISTS versao integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS editada_em timestamptz,
  ADD COLUMN IF NOT EXISTS editada_por_codigo text;

CREATE TABLE IF NOT EXISTS public.fichas_edicoes (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Sem chave estrangeira de propósito: o histórico sobrevive mesmo que a ficha seja apagada por SQL.
  ficha_id           uuid NOT NULL,
  form_type          text NOT NULL,
  versao_anterior    integer NOT NULL,
  versao_nova        integer NOT NULL,
  editado_por        uuid NOT NULL,
  editado_por_codigo text,
  editado_em         timestamptz NOT NULL DEFAULT now(),
  motivo             text NOT NULL CHECK (char_length(btrim(motivo)) BETWEEN 10 AND 1000),
  antes              jsonb NOT NULL,
  depois             jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fichas_edicoes_ficha ON public.fichas_edicoes (ficha_id, editado_em DESC);

ALTER TABLE public.fichas_edicoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Edições visíveis aos administradores" ON public.fichas_edicoes;
CREATE POLICY "Edições visíveis aos administradores" ON public.fichas_edicoes
  FOR SELECT TO authenticated USING (public.is_admin());

REVOKE ALL ON TABLE public.fichas_edicoes FROM anon, authenticated;
GRANT SELECT ON TABLE public.fichas_edicoes TO authenticated;

CREATE OR REPLACE FUNCTION public.fichas_edicoes_imutavel()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'O histórico de retificações não se pode alterar nem apagar.';
END;
$$;

DROP TRIGGER IF EXISTS fichas_edicoes_imutavel ON public.fichas_edicoes;
CREATE TRIGGER fichas_edicoes_imutavel
  BEFORE UPDATE OR DELETE ON public.fichas_edicoes
  FOR EACH ROW EXECUTE FUNCTION public.fichas_edicoes_imutavel();

DROP TRIGGER IF EXISTS auditoria ON public.fichas_edicoes;
CREATE TRIGGER auditoria AFTER INSERT ON public.fichas_edicoes
  FOR EACH ROW EXECUTE FUNCTION public.registar_alteracao();

-- ---------------------------------------------------------------- retificar
CREATE OR REPLACE FUNCTION public.editar_ficha_exportada(
  p_id         uuid,
  p_token      uuid,
  p_date       text,
  p_turn_data  jsonb,
  p_tasks      jsonb,
  p_table_rows jsonb,
  p_assinatura jsonb,
  p_motivo     text
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
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Só os administradores podem retificar fichas exportadas';
  END IF;
  IF char_length(v_motivo) < 10 THEN
    RAISE EXCEPTION 'Indica o motivo da retificação (pelo menos 10 caracteres)';
  END IF;
  IF p_date IS NULL OR p_date !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'Data inválida';
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

  IF p_date <> v_old.date AND EXISTS (
    SELECT 1 FROM public.exported_taskboards
     WHERE form_type = v_old.form_type AND date = p_date AND id <> p_id
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
      'date', v_old.date, 'turn_data', v_old.turn_data, 'tasks', v_old.tasks,
      'table_rows', v_old.table_rows, 'pdf_signature', v_old.pdf_signature
    ),
    jsonb_build_object(
      'date', p_date, 'turn_data', p_turn_data, 'tasks', p_tasks,
      'table_rows', p_table_rows, 'pdf_signature', p_assinatura
    )
  );

  UPDATE public.exported_taskboards
     SET date = p_date,
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

REVOKE ALL ON FUNCTION public.editar_ficha_exportada(uuid, uuid, text, jsonb, jsonb, jsonb, jsonb, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.editar_ficha_exportada(uuid, uuid, text, jsonb, jsonb, jsonb, jsonb, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
