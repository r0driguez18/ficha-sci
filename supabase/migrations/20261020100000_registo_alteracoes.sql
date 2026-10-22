-- Registo de alterações (trilho de auditoria).
--
-- Guarda quem alterou o quê e quando nas tabelas que importam para o controlo interno:
-- fichas exportadas (e o selo), lotes PS2 e a sua verificação, operadores e papéis, PINs
-- (só o facto, nunca o valor), retornos de cobrança, passagem de turno e renovação de cartões.
--
-- • Só os administradores o leem (RLS); ninguém o escreve a não ser os gatilhos.
-- • É imutável: um gatilho recusa UPDATE e DELETE (mesmo à chave de serviço).
-- • Não guarda o conteúdo grande das fichas (turnos, tarefas, tabela, assinatura): só diz que
--   mudou. O selo SHA-256 da ficha fica no registo.
-- • Autor: o utilizador da sessão. Quando a alteração vem das funções do servidor (chave de
--   serviço), usa o cabeçalho x-sci-ator que a própria função define; senão fica "sistema".

CREATE TABLE IF NOT EXISTS public.registo_alteracoes (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  quando      timestamptz NOT NULL DEFAULT now(),
  tabela      text NOT NULL,
  operacao    text NOT NULL CHECK (operacao IN ('INSERT', 'UPDATE', 'DELETE')),
  registo_id  text,
  user_id     uuid,
  operador    text NOT NULL DEFAULT 'sistema',
  resumo      text NOT NULL,
  alteracoes  jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_registo_alteracoes_quando ON public.registo_alteracoes (quando DESC);
CREATE INDEX IF NOT EXISTS idx_registo_alteracoes_tabela ON public.registo_alteracoes (tabela, quando DESC);
CREATE INDEX IF NOT EXISTS idx_registo_alteracoes_operador ON public.registo_alteracoes (operador, quando DESC);

ALTER TABLE public.registo_alteracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Registo visível aos administradores" ON public.registo_alteracoes;
CREATE POLICY "Registo visível aos administradores" ON public.registo_alteracoes
  FOR SELECT TO authenticated USING (public.is_admin());

REVOKE ALL ON TABLE public.registo_alteracoes FROM anon, authenticated;
GRANT SELECT ON TABLE public.registo_alteracoes TO authenticated;

-- ---------------------------------------------------------------- imutável
CREATE OR REPLACE FUNCTION public.registo_alteracoes_imutavel()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'O registo de alterações não se pode alterar nem apagar.';
END;
$$;

DROP TRIGGER IF EXISTS registo_alteracoes_imutavel ON public.registo_alteracoes;
CREATE TRIGGER registo_alteracoes_imutavel
  BEFORE UPDATE OR DELETE ON public.registo_alteracoes
  FOR EACH ROW EXECUTE FUNCTION public.registo_alteracoes_imutavel();

-- ---------------------------------------------------------------- gatilho genérico
CREATE OR REPLACE FUNCTION public.registar_alteracao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_old     jsonb := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END;
  v_new     jsonb := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END;
  v_base    jsonb := coalesce(v_new, v_old);
  -- Conteúdo grande ou secreto: nunca vai para o registo (só se diz que mudou).
  v_grandes text[] := ARRAY['turn_data', 'tasks', 'table_rows', 'pdf_signature', 'tapes_evidencia', 'pin_hash'];
  v_ruido   text[] := ARRAY['created_at', 'updated_at'];
  v_chave   text;
  v_alt     jsonb := '{}'::jsonb;
  v_campos  text[] := ARRAY[]::text[];
  v_uid     uuid := auth.uid();
  v_op      text;
  v_cab     jsonb;
  v_papel   text;
  v_id      text := coalesce(v_base->>'id', v_base->>'user_id');
  v_acao    text;
  v_selo    text;
BEGIN
  -- PINs: só o facto de terem sido definidos/alterados (as tentativas falhadas não contam).
  IF TG_TABLE_NAME = 'operator_pins' AND TG_OP = 'UPDATE'
     AND (v_old->'pin_hash') IS NOT DISTINCT FROM (v_new->'pin_hash') THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    FOR v_chave IN SELECT jsonb_object_keys(v_new) LOOP
      CONTINUE WHEN v_chave = ANY (v_ruido);
      CONTINUE WHEN (v_new->v_chave) IS NOT DISTINCT FROM (v_old->v_chave);
      IF v_chave = ANY (v_grandes) THEN
        v_campos := v_campos || v_chave;
      ELSE
        v_alt := v_alt || jsonb_build_object(v_chave, jsonb_build_object('de', v_old->v_chave, 'para', v_new->v_chave));
        v_campos := v_campos || v_chave;
      END IF;
    END LOOP;
    -- Só mudou ruído (ex.: updated_at): não há nada a registar.
    IF cardinality(v_campos) = 0 THEN
      RETURN NULL;
    END IF;
  ELSE
    -- Criado/apagado: os campos principais, sem o conteúdo grande.
    FOR v_chave IN SELECT jsonb_object_keys(v_base) LOOP
      CONTINUE WHEN v_chave = ANY (v_grandes) OR v_chave = ANY (v_ruido);
      v_alt := v_alt || jsonb_build_object(v_chave, v_base->v_chave);
    END LOOP;
  END IF;

  -- Os PINs nunca levam valores.
  IF TG_TABLE_NAME = 'operator_pins' THEN
    v_alt := '{}'::jsonb;
  END IF;

  -- Ficha exportada: o selo SHA-256 da assinatura fica no registo.
  v_selo := v_base->'pdf_signature'->>'contentHash';
  IF v_selo IS NOT NULL THEN
    v_alt := v_alt || jsonb_build_object('selo', v_selo);
  END IF;

  -- Autor: a sessão; ou, nas funções do servidor (chave de serviço), o cabeçalho que elas definem.
  IF v_uid IS NOT NULL THEN
    SELECT value INTO v_op FROM public.operators WHERE user_id = v_uid LIMIT 1;
  ELSE
    BEGIN
      v_cab := nullif(current_setting('request.headers', true), '')::jsonb;
      v_papel := nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role';
    EXCEPTION WHEN others THEN
      v_cab := NULL;
      v_papel := NULL;
    END;
    IF v_papel = 'service_role' THEN
      v_op := nullif(v_cab->>'x-sci-ator', '');
    END IF;
  END IF;

  v_acao := CASE TG_OP WHEN 'INSERT' THEN 'Criado' WHEN 'UPDATE' THEN 'Alterado' ELSE 'Apagado' END;

  INSERT INTO public.registo_alteracoes (tabela, operacao, registo_id, user_id, operador, resumo, alteracoes)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    v_id,
    v_uid,
    coalesce(v_op, 'sistema'),
    v_acao || ' · ' || TG_TABLE_NAME
      || CASE WHEN TG_OP = 'UPDATE' THEN ' (' || array_to_string(v_campos, ', ') || ')' ELSE '' END,
    v_alt
  );
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.registar_alteracao() FROM public, anon, authenticated;

-- ---------------------------------------------------------------- tabelas auditadas
DROP TRIGGER IF EXISTS auditoria ON public.exported_taskboards;
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE OR DELETE ON public.exported_taskboards
  FOR EACH ROW EXECUTE FUNCTION public.registar_alteracao();

DROP TRIGGER IF EXISTS auditoria ON public.ps2_lotes;
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE OR DELETE ON public.ps2_lotes
  FOR EACH ROW EXECUTE FUNCTION public.registar_alteracao();

DROP TRIGGER IF EXISTS auditoria ON public.operators;
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE OR DELETE ON public.operators
  FOR EACH ROW EXECUTE FUNCTION public.registar_alteracao();

DROP TRIGGER IF EXISTS auditoria ON public.operator_pins;
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE OR DELETE ON public.operator_pins
  FOR EACH ROW EXECUTE FUNCTION public.registar_alteracao();

DROP TRIGGER IF EXISTS auditoria ON public.cobrancas_retornos;
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE OR DELETE ON public.cobrancas_retornos
  FOR EACH ROW EXECUTE FUNCTION public.registar_alteracao();

DROP TRIGGER IF EXISTS auditoria ON public.handover_notes;
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE OR DELETE ON public.handover_notes
  FOR EACH ROW EXECUTE FUNCTION public.registar_alteracao();

DROP TRIGGER IF EXISTS auditoria ON public.handover_entries;
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE OR DELETE ON public.handover_entries
  FOR EACH ROW EXECUTE FUNCTION public.registar_alteracao();

DROP TRIGGER IF EXISTS auditoria ON public.card_renewal_sessions;
CREATE TRIGGER auditoria AFTER INSERT OR UPDATE OR DELETE ON public.card_renewal_sessions
  FOR EACH ROW EXECUTE FUNCTION public.registar_alteracao();

DROP TRIGGER IF EXISTS auditoria ON public.card_renewal_lotes;
CREATE TRIGGER auditoria AFTER INSERT OR DELETE ON public.card_renewal_lotes
  FOR EACH ROW EXECUTE FUNCTION public.registar_alteracao();

-- Os processamentos registam-se aos montes ao exportar a ficha: só interessa o que se altera ou apaga.
DROP TRIGGER IF EXISTS auditoria ON public.file_processes;
CREATE TRIGGER auditoria AFTER UPDATE OR DELETE ON public.file_processes
  FOR EACH ROW EXECUTE FUNCTION public.registar_alteracao();
