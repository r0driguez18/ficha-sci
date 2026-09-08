-- =====================================================
-- F2 — Assinatura eletrónica com PIN
-- =====================================================
-- A "assinatura" da ficha deixa de ser a escolha de um nome numa lista e passa
-- a exigir que o operador confirme a identidade com um PIN pessoal de 4 dígitos.
-- O PIN é guardado apenas como hash bcrypt (pgcrypto) e NUNCA sai do servidor:
-- todo o acesso é feito por funções SECURITY DEFINER que operam sobre
-- auth.uid(). A tabela tem RLS ativa sem políticas — acesso direto negado.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.operator_pins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.operator_pins ENABLE ROW LEVEL SECURITY;
-- Sem políticas: nenhum acesso direto. Só através das funções abaixo.

-- ---------- Helpers ----------

-- O operador já definiu um PIN?
CREATE OR REPLACE FUNCTION public.operator_has_pin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM public.operator_pins WHERE user_id = auth.uid());
$$;

-- Definir o PIN pela primeira vez (falha se já existir — usar change_operator_pin).
CREATE OR REPLACE FUNCTION public.set_operator_pin(new_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF new_pin !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION 'O PIN tem de ter exatamente 4 dígitos';
  END IF;

  INSERT INTO public.operator_pins (user_id, pin_hash)
  VALUES (auth.uid(), crypt(new_pin, gen_salt('bf')))
  ON CONFLICT (user_id) DO NOTHING;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Já existe um PIN definido. Use a alteração de PIN.';
  END IF;
END;
$$;

-- Alterar o PIN — exige o PIN atual correto. Devolve false se o atual estiver errado.
CREATE OR REPLACE FUNCTION public.change_operator_pin(current_pin text, new_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
     SET pin_hash = crypt(new_pin, gen_salt('bf')), updated_at = now()
   WHERE user_id = auth.uid();
  RETURN true;
END;
$$;

-- Verificar o PIN no momento de assinar. Devolve true/false; nunca expõe o hash.
CREATE OR REPLACE FUNCTION public.verify_operator_pin(pin text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT pin_hash = crypt(pin, pin_hash)
       FROM public.operator_pins
      WHERE user_id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.operator_has_pin()                       FROM public, anon;
REVOKE ALL ON FUNCTION public.set_operator_pin(text)                   FROM public, anon;
REVOKE ALL ON FUNCTION public.change_operator_pin(text, text)          FROM public, anon;
REVOKE ALL ON FUNCTION public.verify_operator_pin(text)               FROM public, anon;

GRANT EXECUTE ON FUNCTION public.operator_has_pin()                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_operator_pin(text)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_operator_pin(text, text)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_operator_pin(text)            TO authenticated;
