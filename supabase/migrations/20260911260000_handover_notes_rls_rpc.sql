-- =====================================================
-- Passagem de Turno — fecha a RLS, força a identidade real do servidor
-- =====================================================
-- Achados de auditoria de segurança:
--
-- 1. INSERT/UPDATE eram `WITH CHECK (true)` — qualquer autenticado podia
--    editar a nota de outro operador, reescrever quem a escreveu
--    (`autor_user_id`/`autor_nome`), e sobretudo forjar `lida_por`/
--    `lida_por_nome` para qualquer identidade, mesmo sem essa pessoa
--    alguma vez ter aberto a página.
--
-- 2. `autor_user_id`/`autor_nome`/`lida_por`/`lida_por_nome` eram
--    parâmetros simples de `saveHandoverNote`/`confirmarLeituraHandover`,
--    confiados do cliente sem qualquer verificação no servidor.
--
-- Corrige movendo as duas escritas para funções SECURITY DEFINER, que
-- derivam sempre a identidade de auth.uid() — nunca de um parâmetro do
-- cliente. De caminho corrige também um bug de UX: editar uma nota já
-- lida agora limpa o selo de leitura (deixaria de ser verdade que
-- alguém já leu o conteúdo novo), obrigando a confirmar de novo.
-- =====================================================

-- Sem limite de tamanho no texto da nota — nem cliente nem BD (achado de
-- auditoria). Um limite generoso chega para um resumo de turno.
DO $$ BEGIN
  ALTER TABLE public.handover_notes
    ADD CONSTRAINT handover_notes_nota_length_check
    CHECK (char_length(nota) <= 4000);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP POLICY IF EXISTS "Handover notes inseridas pela equipa" ON public.handover_notes;
DROP POLICY IF EXISTS "Handover notes atualizadas pela equipa" ON public.handover_notes;
-- SELECT mantém-se aberta à equipa (sem alteração). Sem política de
-- INSERT/UPDATE: só através das funções abaixo.

-- Nome a mostrar como autor/leitor: o operador ligado à conta, senão o
-- email da conta autenticada, senão "Operador" — mesma ordem que o
-- cliente já usava, agora calculada no servidor.
CREATE OR REPLACE FUNCTION public.nome_operador_atual()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_nome text;
BEGIN
  SELECT o.nome INTO v_nome FROM public.operators o WHERE o.user_id = auth.uid();
  IF v_nome IS NULL THEN
    SELECT u.email INTO v_nome FROM auth.users u WHERE u.id = auth.uid();
  END IF;
  RETURN COALESCE(v_nome, 'Operador');
END;
$$;

CREATE OR REPLACE FUNCTION public.guardar_nota_passagem_turno(
  p_date text,
  p_turno text,
  p_nota text
)
RETURNS public.handover_notes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_nome text;
  v_nota public.handover_notes;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  v_nome := public.nome_operador_atual();

  INSERT INTO public.handover_notes (date, turno, nota, autor_user_id, autor_nome)
  VALUES (p_date, p_turno, COALESCE(p_nota, ''), auth.uid(), v_nome)
  ON CONFLICT (date, turno) DO UPDATE
     SET nota = EXCLUDED.nota,
         autor_user_id = EXCLUDED.autor_user_id,
         autor_nome = EXCLUDED.autor_nome,
         -- Conteúdo mudou — a confirmação de leitura anterior já não
         -- descreve o que lá está agora.
         lida_por = NULL,
         lida_por_nome = NULL,
         lida_em = NULL
  RETURNING * INTO v_nota;

  RETURN v_nota;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirmar_leitura_passagem_turno(p_note_id uuid)
RETURNS public.handover_notes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_nome text;
  v_nota public.handover_notes;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  v_nome := public.nome_operador_atual();

  UPDATE public.handover_notes
     SET lida_por = auth.uid(),
         lida_por_nome = v_nome,
         lida_em = now()
   WHERE id = p_note_id
   RETURNING * INTO v_nota;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nota não encontrada';
  END IF;

  RETURN v_nota;
END;
$$;

REVOKE ALL ON FUNCTION public.nome_operador_atual() FROM public, anon;
REVOKE ALL ON FUNCTION public.guardar_nota_passagem_turno(text, text, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.confirmar_leitura_passagem_turno(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.nome_operador_atual() TO authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_nota_passagem_turno(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_leitura_passagem_turno(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
