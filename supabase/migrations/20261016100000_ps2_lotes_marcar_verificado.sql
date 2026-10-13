-- =====================================================
-- Verificação de ficheiros PS2: um simples "verificado" (sem contagem de movimentos nem PIN)
-- =====================================================
-- marcar_lote_ps2(id, true)  -> fica verificado, com quem e quando;
-- marcar_lote_ps2(id, false) -> desfaz (só quem verificou, ou um administrador).
-- Idempotente (CREATE OR REPLACE). A função antiga com PIN (verificar_lote_ps2) mantém-se.
-- =====================================================

CREATE OR REPLACE FUNCTION public.marcar_lote_ps2(p_id uuid, p_verificado boolean)
RETURNS void
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

  SELECT * INTO v_lote FROM public.ps2_lotes WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ficheiro não encontrado';
  END IF;

  IF p_verificado THEN
    IF v_lote.estado = 'verificado' THEN
      RETURN;
    END IF;
    SELECT value INTO v_codigo FROM public.operators WHERE user_id = auth.uid() LIMIT 1;
    UPDATE public.ps2_lotes
       SET estado = 'verificado',
           verificado_por = auth.uid(),
           verificado_por_codigo = v_codigo,
           verificado_em = now(),
           mesma_pessoa = (v_lote.gerado_por IS NOT DISTINCT FROM auth.uid()),
           contagem = NULL,
           observacoes = NULL
     WHERE id = p_id;
  ELSE
    IF v_lote.estado = 'por_verificar' THEN
      RETURN;
    END IF;
    IF v_lote.verificado_por IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Só quem verificou (ou um administrador) pode desfazer.';
    END IF;
    UPDATE public.ps2_lotes
       SET estado = 'por_verificar',
           verificado_por = NULL,
           verificado_por_codigo = NULL,
           verificado_em = NULL,
           mesma_pessoa = NULL,
           contagem = NULL,
           observacoes = NULL
     WHERE id = p_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.marcar_lote_ps2(uuid, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.marcar_lote_ps2(uuid, boolean) TO authenticated;

NOTIFY pgrst, 'reload schema';
