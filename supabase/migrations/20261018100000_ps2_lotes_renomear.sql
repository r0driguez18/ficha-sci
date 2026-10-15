-- Verificar Débitos/Créditos: só a coluna "Empresa / ficheiro" é editável.
-- O nome do ficheiro passa a poder corrigir-se (antes de verificar); o sentido deixa de ser editável na app.

CREATE OR REPLACE FUNCTION public.renomear_lote_ps2(p_id uuid, p_nome text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_nome text := btrim(coalesce(p_nome, ''));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF v_nome = '' THEN
    RAISE EXCEPTION 'O nome não pode ficar vazio';
  END IF;
  IF length(v_nome) > 200 THEN
    RAISE EXCEPTION 'Nome demasiado longo';
  END IF;

  -- Depois de verificado o lote fica como foi assinado.
  UPDATE public.ps2_lotes
     SET nome_ficheiro = v_nome
   WHERE id = p_id AND estado = 'por_verificar';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lote não encontrado ou já verificado';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.renomear_lote_ps2(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.renomear_lote_ps2(uuid, text) TO authenticated;
