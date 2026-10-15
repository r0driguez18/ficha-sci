-- =====================================================
-- Reposição de senha: registo + limite de tentativas do PIN
-- =====================================================
-- Dois caminhos para repor uma senha sem email (a rede não tem servidor de email):
--   * pelo administrador (senha temporária; a pessoa troca no primeiro login);
--   * pela própria pessoa, no ecrã de login, com o utilizador e o PIN de assinatura.
--
-- O PIN tem 4 dígitos (10 mil combinações) e o limite de assinatura (5 tentativas / 5 min)
-- deixava adivinhá-lo em dias. Repor uma senha dá a conta toda, por isso aqui o limite é mais
-- apertado: 5 tentativas erradas por conta numa janela de 24 h bloqueiam a reposição por PIN
-- durante 24 h. Cada reposição fica registada e é visível aos administradores.
--
-- Só o serviço (função repor-senha) chama tentar_pin_reposicao(). Idempotente.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reposicoes_senha (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quando     timestamptz NOT NULL DEFAULT now(),
  metodo     text NOT NULL CHECK (metodo IN ('pin', 'admin')),
  feito_por  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reposicoes_senha_user ON public.reposicoes_senha (user_id, quando DESC);

ALTER TABLE public.reposicoes_senha ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reposicoes_senha visiveis a administradores" ON public.reposicoes_senha;
CREATE POLICY "reposicoes_senha visiveis a administradores"
  ON public.reposicoes_senha FOR SELECT TO authenticated USING (public.is_admin());
-- Sem políticas de escrita: só o serviço (chave de serviço) escreve.

CREATE TABLE IF NOT EXISTS public.reposicao_tentativas (
  user_id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  falhas         integer NOT NULL DEFAULT 0,
  janela_inicio  timestamptz,
  bloqueado_ate  timestamptz
);

ALTER TABLE public.reposicao_tentativas ENABLE ROW LEVEL SECURITY;
-- Sem políticas: nenhum acesso direto.

-- Resultado: 'ok' | 'pin_errado' | 'bloqueado' | 'sem_pin'
CREATE OR REPLACE FUNCTION public.tentar_pin_reposicao(p_user_id uuid, p_pin text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_hash  text;
  t       public.reposicao_tentativas%ROWTYPE;
  v_falhas integer;
BEGIN
  SELECT pin_hash INTO v_hash FROM public.operator_pins WHERE user_id = p_user_id;
  IF v_hash IS NULL THEN
    RETURN 'sem_pin';
  END IF;

  INSERT INTO public.reposicao_tentativas (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO t FROM public.reposicao_tentativas WHERE user_id = p_user_id FOR UPDATE;

  IF t.bloqueado_ate IS NOT NULL AND t.bloqueado_ate > now() THEN
    RETURN 'bloqueado';
  END IF;

  -- Janela de 24 h (ou bloqueio já expirado): recomeça.
  v_falhas := t.falhas;
  IF t.janela_inicio IS NULL OR t.janela_inicio < now() - interval '24 hours'
     OR (t.bloqueado_ate IS NOT NULL AND t.bloqueado_ate <= now()) THEN
    v_falhas := 0;
    t.janela_inicio := now();
  END IF;

  IF p_pin ~ '^[0-9]{4}$' AND v_hash = crypt(p_pin, v_hash) THEN
    UPDATE public.reposicao_tentativas
       SET falhas = 0, janela_inicio = NULL, bloqueado_ate = NULL
     WHERE user_id = p_user_id;
    RETURN 'ok';
  END IF;

  v_falhas := v_falhas + 1;
  UPDATE public.reposicao_tentativas
     SET falhas = v_falhas,
         janela_inicio = t.janela_inicio,
         bloqueado_ate = CASE WHEN v_falhas >= 5 THEN now() + interval '24 hours' ELSE NULL END
   WHERE user_id = p_user_id;
  RETURN 'pin_errado';
END;
$$;

REVOKE ALL ON FUNCTION public.tentar_pin_reposicao(uuid, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tentar_pin_reposicao(uuid, text) TO service_role;

NOTIFY pgrst, 'reload schema';
