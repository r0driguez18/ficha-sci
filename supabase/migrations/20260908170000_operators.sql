-- =====================================================
-- F9 — Operadores como dados (fonte única) + papéis
-- =====================================================
-- Até agora a lista de operadores estava repetida em código (`src/lib/operators.ts`
-- e, historicamente, em cada variante da ficha). Passa a viver numa tabela, para
-- que adicionar/remover um colega ou ligar a conta autenticada ao código de
-- operador deixe de ser uma alteração de código.
--
-- `value` é o código curto já usado nos dados (`file_processes.executed_by`,
-- `turn_data.*.operator`). `user_id` liga a conta autenticada ao operador — é
-- o que permite pré-preencher "Executado por" com quem está a registar.
-- =====================================================

CREATE TABLE public.operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL UNIQUE,
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  papel text NOT NULL DEFAULT 'operador' CHECK (papel IN ('operador', 'administrador')),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER update_operators_updated_at
  BEFORE UPDATE ON public.operators
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- Operadores registados (REQUISITOS.md §5). A ligação à conta faz-se depois,
-- por cada operador, através de claim_operator().
INSERT INTO public.operators (value, nome) VALUES
  ('nalves',   'Nelson Alves'),
  ('etavares', 'Evandro Tavares'),
  ('edelgado', 'Emanuel Delgado'),
  ('ebrito',   'Elvis Brito'),
  ('lspencer', 'Louis Spencer')
ON CONFLICT (value) DO NOTHING;

ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;

-- Leitura aberta à equipa (dropdowns, filtros). Escrita só por funções abaixo.
CREATE POLICY "Operators readable by the team"
  ON public.operators FOR SELECT TO authenticated USING (true);

-- ---------- Funções ----------

-- Liga a conta autenticada a um código de operador ainda não atribuído.
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

  -- Se já estiver ligado a outro operador, liberta-o primeiro.
  UPDATE public.operators SET user_id = NULL
   WHERE user_id = auth.uid() AND value <> operator_value;

  SELECT * INTO target FROM public.operators WHERE value = operator_value;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Operador % não existe', operator_value;
  END IF;
  IF target.user_id IS NOT NULL AND target.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Esse operador já está associado a outra conta';
  END IF;

  UPDATE public.operators
     SET user_id = auth.uid()
   WHERE value = operator_value;
END;
$$;

-- O utilizador em sessão é administrador?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.operators
     WHERE user_id = auth.uid() AND papel = 'administrador' AND ativo
  );
$$;

REVOKE ALL ON FUNCTION public.claim_operator(text) FROM public, anon;
REVOKE ALL ON FUNCTION public.is_admin()           FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_operator(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin()           TO authenticated;
