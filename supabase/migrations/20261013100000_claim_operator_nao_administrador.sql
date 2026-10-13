-- =====================================================
-- Operador "administrador" so se liga por um administrador
-- =====================================================
-- claim_operator() deixava qualquer conta autenticada reclamar qualquer operador ainda
-- sem conta — incluindo um com papel 'administrador'. Quem reclamasse esse operador
-- passava a ser administrador (is_admin() olha para operators.papel).
--
-- Agora um operador administrador so e associado por quem o administra: a propria conta
-- (se ja for dela) ou o servico de administracao de utilizadores (chave de servico).
-- Idempotente: CREATE OR REPLACE.
-- =====================================================

CREATE OR REPLACE FUNCTION public.claim_operator(operator_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target public.operators%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO target FROM public.operators WHERE value = operator_value;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Operador % não existe', operator_value;
  END IF;

  IF target.papel = 'administrador' AND target.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Esse operador é de um administrador — só um administrador o pode associar';
  END IF;

  IF target.user_id IS NOT NULL AND target.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Esse operador já está associado a outra conta';
  END IF;

  -- Se já estiver ligado a outro operador, liberta-o primeiro.
  UPDATE public.operators SET user_id = NULL
   WHERE user_id = auth.uid() AND value <> operator_value;

  UPDATE public.operators
     SET user_id = auth.uid()
   WHERE value = operator_value;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_operator(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_operator(text) TO authenticated;
