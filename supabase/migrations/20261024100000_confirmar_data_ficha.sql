-- Confirmar a data de uma ficha já exportada.
--
-- O Histórico marca com "Confirmar data" as fichas cuja data não bate com o tipo (ou foram exportadas muito
-- depois do dia). Quem verifica que a data está certa confirma-a aqui: fica registado quem e quando
-- (também no registo de alterações) e o aviso desaparece. Se a data estiver errada, corrige-se pela retificação.

ALTER TABLE public.exported_taskboards
  ADD COLUMN IF NOT EXISTS data_confirmada_em  timestamptz,
  ADD COLUMN IF NOT EXISTS data_confirmada_por text;

CREATE OR REPLACE FUNCTION public.confirmar_data_ficha(p_id uuid)
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
  SELECT value INTO v_codigo FROM public.operators WHERE user_id = auth.uid() AND ativo LIMIT 1;
  IF v_codigo IS NULL THEN
    RAISE EXCEPTION 'A conta não está ligada a um operador ativo';
  END IF;

  UPDATE public.exported_taskboards
     SET data_confirmada_em = now(), data_confirmada_por = v_codigo
   WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ficha não encontrada';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.confirmar_data_ficha(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.confirmar_data_ficha(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
