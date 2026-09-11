-- =====================================================
-- PIN do operador — rate limit + token de assinatura verificável
-- =====================================================
-- Dois achados da auditoria de segurança, resolvidos juntos porque
-- nascem da mesma chamada (verify_operator_pin):
--
-- 1. Sem limite de tentativas — um PIN de 4 dígitos (10 mil combinações)
--    podia ser testado por força bruta sem qualquer travão. Passa a
--    bloquear o operador por 5 minutos ao fim de 5 tentativas erradas
--    seguidas.
--
-- 2. O estado "assinado" no cliente era só um booleano React
--    (signatureDataUrl === 'pin'), sem nada do servidor a comprovar que
--    uma verificação de PIN bem-sucedida aconteceu mesmo. Isso tornava-o
--    alterável via DevTools, sem qualquer verificação. Agora
--    verify_operator_pin devolve um token de assinatura (UUID,
--    válido 10 minutos, uso único) em vez de um booleano; o cliente tem
--    de o entregar a consumir_token_assinatura() antes de qualquer
--    escrita em exported_taskboards/file_processes — nenhuma combinação
--    de estado forjado no browser produz um token que o servidor aceite.
-- =====================================================

ALTER TABLE public.operator_pins
  ADD COLUMN IF NOT EXISTS failed_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz;

CREATE TABLE IF NOT EXISTS public.signing_tokens (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_signing_tokens_user ON public.signing_tokens (user_id);

ALTER TABLE public.signing_tokens ENABLE ROW LEVEL SECURITY;
-- Sem políticas: nenhum acesso direto. Só através das funções abaixo.

-- verify_operator_pin passa a devolver uuid (o token) em vez de boolean —
-- é preciso DROP porque CREATE OR REPLACE não muda o tipo de retorno.
DROP FUNCTION IF EXISTS public.verify_operator_pin(text);

CREATE FUNCTION public.verify_operator_pin(pin text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  rec public.operator_pins%ROWTYPE;
  effective_failed integer;
  ok boolean;
  v_token uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO rec FROM public.operator_pins WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF rec.locked_until IS NOT NULL AND rec.locked_until > now() THEN
    RAISE EXCEPTION 'Demasiadas tentativas erradas. Tenta novamente daqui a % minuto(s).',
      GREATEST(1, CEIL(EXTRACT(EPOCH FROM (rec.locked_until - now())) / 60));
  END IF;

  -- Um bloqueio já expirado dá um novo conjunto de tentativas.
  effective_failed := CASE
    WHEN rec.locked_until IS NOT NULL AND rec.locked_until <= now() THEN 0
    ELSE rec.failed_attempts
  END;

  ok := (rec.pin_hash = crypt(pin, rec.pin_hash));

  IF ok THEN
    UPDATE public.operator_pins
       SET failed_attempts = 0, locked_until = NULL
     WHERE user_id = auth.uid();

    INSERT INTO public.signing_tokens (user_id, expires_at)
    VALUES (auth.uid(), now() + interval '10 minutes')
    RETURNING token INTO v_token;

    RETURN v_token;
  ELSE
    UPDATE public.operator_pins
       SET failed_attempts = effective_failed + 1,
           locked_until = CASE WHEN effective_failed + 1 >= 5 THEN now() + interval '5 minutes' ELSE NULL END
     WHERE user_id = auth.uid();
    RETURN NULL;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_operator_pin(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.verify_operator_pin(text) TO authenticated;

-- Gasta um token de assinatura — só aceita um token real, do próprio
-- utilizador, ainda não usado e ainda dentro da validade. Chamar isto
-- com sucesso é o único sinal em que qualquer escrita subsequente
-- (exported_taskboards, file_processes) se pode basear.
CREATE OR REPLACE FUNCTION public.consumir_token_assinatura(p_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR p_token IS NULL THEN
    RAISE EXCEPTION 'Assinatura inválida ou expirada. Assina a ficha novamente.';
  END IF;

  UPDATE public.signing_tokens
     SET used_at = now()
   WHERE token = p_token
     AND user_id = auth.uid()
     AND used_at IS NULL
     AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assinatura inválida ou expirada. Assina a ficha novamente.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.consumir_token_assinatura(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.consumir_token_assinatura(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
