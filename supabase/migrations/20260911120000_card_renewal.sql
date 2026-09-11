-- =====================================================
-- Renovação de Cartões — divide o ficheiro de renovação do banco em
-- lotes de até 490 cartões, agrupados por balcão
-- =====================================================
-- Substitui o processo manual em Excel/VBA (Auto Ren.xlsm). São cartões
-- bancários reais: atribuir um cartão a um lote nunca pode duplicá-lo nem
-- perdê-lo, por isso essa atribuição corre inteiramente dentro da função
-- SECURITY DEFINER `criar_lote_renovacao` — não há política de UPDATE
-- direta sobre `card_renewal_cards` nem de INSERT sobre
-- `card_renewal_lotes`; a app nunca escreve essas colunas à mão.
--
-- Visível a toda a equipa (várias pessoas/turnos podem continuar a mesma
-- sessão de renovação) — ver 20260908153120_team_visibility.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.card_renewal_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  nome text NOT NULL,
  estado text NOT NULL DEFAULT 'em_curso' CHECK (estado IN ('em_curso', 'concluida')),
  proximo_lote integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_card_renewal_sessions_updated_at ON public.card_renewal_sessions;
CREATE TRIGGER update_card_renewal_sessions_updated_at
  BEFORE UPDATE ON public.card_renewal_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE INDEX IF NOT EXISTS idx_card_renewal_sessions_estado
  ON public.card_renewal_sessions (estado);

-- `posicao` é atribuída pelo Postgres (IDENTITY) — nunca pelo cliente — para
-- que a ordem original do ficheiro do banco nunca fique corrompida por uma
-- corrida entre dois carregamentos em simultâneo.
CREATE TABLE IF NOT EXISTS public.card_renewal_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.card_renewal_sessions(id) ON DELETE CASCADE,
  numero_cartao text NOT NULL CHECK (numero_cartao ~ '^[0-9]{7}$'),
  balcao text NOT NULL,
  nome_titular text,
  posicao bigint GENERATED ALWAYS AS IDENTITY,
  lote_numero integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, numero_cartao)
);

CREATE INDEX IF NOT EXISTS idx_card_renewal_cards_pendentes
  ON public.card_renewal_cards (session_id, balcao, posicao)
  WHERE lote_numero IS NULL;

CREATE TABLE IF NOT EXISTS public.card_renewal_lotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.card_renewal_sessions(id) ON DELETE CASCADE,
  numero integer NOT NULL,
  balcoes text[] NOT NULL,
  total_cartoes integer NOT NULL,
  ficheiro_nome text NOT NULL,
  criado_por uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, numero)
);

ALTER TABLE public.card_renewal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_renewal_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_renewal_lotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sessões de renovação visíveis para a equipa" ON public.card_renewal_sessions;
DROP POLICY IF EXISTS "Sessões de renovação criadas pelo autor" ON public.card_renewal_sessions;

CREATE POLICY "Sessões de renovação visíveis para a equipa"
  ON public.card_renewal_sessions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Sessões de renovação criadas pelo autor"
  ON public.card_renewal_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Sem política de UPDATE: `estado` e `proximo_lote` só mudam através das
-- funções abaixo.

DROP POLICY IF EXISTS "Cartões de renovação visíveis para a equipa" ON public.card_renewal_cards;
DROP POLICY IF EXISTS "Cartões de renovação inseridos pela equipa" ON public.card_renewal_cards;

CREATE POLICY "Cartões de renovação visíveis para a equipa"
  ON public.card_renewal_cards FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Cartões de renovação inseridos pela equipa"
  ON public.card_renewal_cards FOR INSERT TO authenticated
  WITH CHECK (true);

-- Sem política de UPDATE/DELETE: `lote_numero` só muda dentro de
-- `criar_lote_renovacao` — nenhuma escrita direta do cliente pode duplicar
-- ou libertar um cartão já atribuído.

DROP POLICY IF EXISTS "Lotes de renovação visíveis para a equipa" ON public.card_renewal_lotes;

CREATE POLICY "Lotes de renovação visíveis para a equipa"
  ON public.card_renewal_lotes FOR SELECT TO authenticated
  USING (true);

-- Sem política de INSERT/UPDATE/DELETE: só `criar_lote_renovacao`
-- (SECURITY DEFINER) cria lotes.

-- ---------- Funções ----------

-- Atribui atomicamente até `p_limite` cartões pendentes (ainda sem lote)
-- dos balcões indicados, pela ordem original do ficheiro, a um novo lote.
-- O número do lote é reservado com o mesmo UPDATE que bloqueia a linha da
-- sessão (mutex + contador num só passo), para duas chamadas em paralelo
-- nunca calcularem o mesmo número nem ficarem com um lote incompleto.
CREATE OR REPLACE FUNCTION public.criar_lote_renovacao(
  p_session_id uuid,
  p_balcoes text[],
  p_nome_base text,
  p_limite integer DEFAULT 490
)
RETURNS TABLE (lote_numero integer, numero_cartao text, balcao text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_numero integer;
BEGIN
  IF p_limite <= 0 OR p_limite > 500 THEN
    RAISE EXCEPTION 'Limite inválido: %', p_limite;
  END IF;
  IF p_balcoes IS NULL OR array_length(p_balcoes, 1) IS NULL THEN
    RAISE EXCEPTION 'Selecione pelo menos um balcão.';
  END IF;

  UPDATE public.card_renewal_sessions
     SET proximo_lote = proximo_lote + 1, updated_at = now()
   WHERE id = p_session_id AND estado = 'em_curso'
   RETURNING proximo_lote - 1 INTO v_numero;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sessão não encontrada ou já concluída.';
  END IF;

  -- `UPDATE ... RETURNING` não garante a ordem das linhas devolvidas, por
  -- isso a posição original viaja através do `upd` só para o ORDER BY
  -- final — o ficheiro `.prn` tem de saír pela mesma ordem do ficheiro do
  -- banco, tal como o processo manual.
  RETURN QUERY
  WITH sel AS (
    SELECT c.id, c.numero_cartao, c.balcao, c.posicao
      FROM public.card_renewal_cards c
     WHERE c.session_id = p_session_id
       AND c.lote_numero IS NULL
       AND c.balcao = ANY(p_balcoes)
     ORDER BY c.posicao
     LIMIT p_limite
     FOR UPDATE
  ),
  upd AS (
    UPDATE public.card_renewal_cards c
       SET lote_numero = v_numero
      FROM sel WHERE c.id = sel.id
    RETURNING c.numero_cartao, c.balcao, c.posicao
  ),
  ins AS (
    INSERT INTO public.card_renewal_lotes
      (session_id, numero, balcoes, total_cartoes, ficheiro_nome, criado_por)
    SELECT p_session_id, v_numero, p_balcoes, count(*),
           p_nome_base || ' ' || v_numero || '.prn', auth.uid()
      FROM upd
    HAVING count(*) > 0
    RETURNING numero
  )
  SELECT v_numero, upd.numero_cartao, upd.balcao FROM upd ORDER BY upd.posicao;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nenhum cartão pendente para os balcões indicados.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.criar_lote_renovacao(uuid, text[], text, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.criar_lote_renovacao(uuid, text[], text, integer) TO authenticated;

-- Termina a sessão — só quando não sobra nenhum cartão pendente, para nunca
-- fechar uma sessão com cartões por processar.
CREATE OR REPLACE FUNCTION public.concluir_sessao_renovacao(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_pendentes integer;
BEGIN
  SELECT count(*) INTO v_pendentes
    FROM public.card_renewal_cards
   WHERE session_id = p_session_id AND lote_numero IS NULL;

  IF v_pendentes > 0 THEN
    RAISE EXCEPTION 'Ainda há % cartão(ões) pendente(s) — gera todos os lotes antes de terminar.', v_pendentes;
  END IF;

  UPDATE public.card_renewal_sessions
     SET estado = 'concluida', updated_at = now()
   WHERE id = p_session_id AND estado = 'em_curso';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sessão não encontrada ou já concluída.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.concluir_sessao_renovacao(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.concluir_sessao_renovacao(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
