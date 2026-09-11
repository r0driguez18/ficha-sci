-- =====================================================
-- PIN do operador — sobe o custo do bcrypt
-- =====================================================
-- Achado de auditoria: gen_salt('bf') sem indicar rounds usa o valor por
-- omissão do pgcrypto (cost factor 6), fraco para os padrões atuais de
-- hashing de credenciais. Sobe para 12. Não precisa de reprocessar PINs
-- já guardados — o bcrypt inclui o custo no próprio hash, por isso os
-- hashes antigos continuam a verificar-se corretamente com o custo com
-- que foram criados; só os PINs definidos/alterados a partir de agora
-- usam o novo custo.
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_operator_pin(new_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF new_pin !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION 'O PIN tem de ter exatamente 4 dígitos';
  END IF;

  INSERT INTO public.operator_pins (user_id, pin_hash)
  VALUES (auth.uid(), crypt(new_pin, gen_salt('bf', 12)))
  ON CONFLICT (user_id) DO NOTHING;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Já existe um PIN definido. Use a alteração de PIN.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.change_operator_pin(current_pin text, new_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  stored text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF new_pin !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION 'O novo PIN tem de ter exatamente 4 dígitos';
  END IF;

  SELECT pin_hash INTO stored FROM public.operator_pins WHERE user_id = auth.uid();
  IF stored IS NULL THEN
    RAISE EXCEPTION 'Ainda não há PIN definido';
  END IF;
  IF stored <> crypt(current_pin, stored) THEN
    RETURN false;
  END IF;

  UPDATE public.operator_pins
     SET pin_hash = crypt(new_pin, gen_salt('bf', 12)), updated_at = now()
   WHERE user_id = auth.uid();
  RETURN true;
END;
$$;

NOTIFY pgrst, 'reload schema';
