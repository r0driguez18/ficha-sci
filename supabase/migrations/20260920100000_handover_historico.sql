-- =====================================================
-- Passagem de Turno — histórico e leituras por pessoa
-- =====================================================
-- Até aqui havia UMA nota por (data, turno) que se reescrevia: ao guardar
-- de novo, o texto anterior perdia-se e a confirmação de leitura era
-- apagada — sem rasto de o que foi deixado nem de quem o leu. Além disso a
-- confirmação era uma só (o 1.º a ler), e quem alterava a nota passava a
-- constar como autor de tudo.
--
-- Passa a ser um registo que só cresce:
--   handover_entries — cada nota deixada é uma entrada nova, imutável;
--   handover_reads   — uma linha por (entrada, pessoa) com a hora da leitura.
--
-- Escrita só via funções SECURITY DEFINER (identidade de auth.uid(), como
-- em 20260911260000). A tabela antiga handover_notes fica como está
-- (histórico anterior migrado abaixo; não se apaga nada).
-- =====================================================

CREATE TABLE IF NOT EXISTS public.handover_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date text NOT NULL,                        -- YYYY-MM-DD (convenção das fichas)
  turno text NOT NULL CHECK (turno IN ('turno1', 'turno2', 'turno3')),
  texto text NOT NULL CHECK (char_length(btrim(texto)) > 0 AND char_length(texto) <= 4000),
  autor_user_id uuid,
  autor_nome text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_handover_entries_date ON public.handover_entries (date, turno, created_at);

CREATE TABLE IF NOT EXISTS public.handover_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.handover_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_nome text,
  lida_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entry_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_handover_reads_entry ON public.handover_reads (entry_id);

ALTER TABLE public.handover_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Handover entries visíveis para a equipa" ON public.handover_entries;
CREATE POLICY "Handover entries visíveis para a equipa"
  ON public.handover_entries FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Handover reads visíveis para a equipa" ON public.handover_reads;
CREATE POLICY "Handover reads visíveis para a equipa"
  ON public.handover_reads FOR SELECT TO authenticated USING (true);
-- Sem INSERT/UPDATE/DELETE para clientes: só pelas funções abaixo, e nada se apaga.

-- Migra o que já existia (uma entrada por nota antiga, com a leitura que tinha).
-- Idempotente: só corre para notas ainda não migradas.
DO $$
DECLARE
  r public.handover_notes;
  v_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.handover_entries) THEN
    RETURN;
  END IF;
  FOR r IN SELECT * FROM public.handover_notes WHERE btrim(nota) <> '' ORDER BY date, turno LOOP
    INSERT INTO public.handover_entries (date, turno, texto, autor_user_id, autor_nome, created_at)
    VALUES (r.date, r.turno, r.nota, r.autor_user_id, r.autor_nome, COALESCE(r.updated_at, r.created_at))
    RETURNING id INTO v_id;
    IF r.lida_por IS NOT NULL AND r.lida_em IS NOT NULL THEN
      INSERT INTO public.handover_reads (entry_id, user_id, user_nome, lida_em)
      VALUES (v_id, r.lida_por, r.lida_por_nome, r.lida_em);
    END IF;
  END LOOP;
END $$;

-- Deixa uma nota nova (nunca reescreve nem apaga as anteriores).
CREATE OR REPLACE FUNCTION public.adicionar_entrada_passagem_turno(
  p_date text,
  p_turno text,
  p_texto text
)
RETURNS public.handover_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_entrada public.handover_entries;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF p_turno NOT IN ('turno1', 'turno2', 'turno3') THEN
    RAISE EXCEPTION 'Turno inválido';
  END IF;
  IF p_date !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'Data inválida';
  END IF;
  IF p_texto IS NULL OR btrim(p_texto) = '' THEN
    RAISE EXCEPTION 'A nota está vazia';
  END IF;
  IF char_length(p_texto) > 4000 THEN
    RAISE EXCEPTION 'A nota excede 4000 caracteres';
  END IF;

  INSERT INTO public.handover_entries (date, turno, texto, autor_user_id, autor_nome)
  VALUES (p_date, p_turno, btrim(p_texto), auth.uid(), public.nome_operador_atual())
  RETURNING * INTO v_entrada;

  RETURN v_entrada;
END;
$$;

-- Regista que a pessoa autenticada leu esta entrada (idempotente: a 1.ª hora fica).
CREATE OR REPLACE FUNCTION public.confirmar_leitura_entrada_passagem_turno(p_entry_id uuid)
RETURNS public.handover_reads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_leitura public.handover_reads;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.handover_entries WHERE id = p_entry_id) THEN
    RAISE EXCEPTION 'Nota não encontrada';
  END IF;

  INSERT INTO public.handover_reads (entry_id, user_id, user_nome)
  VALUES (p_entry_id, auth.uid(), public.nome_operador_atual())
  ON CONFLICT (entry_id, user_id) DO NOTHING;

  SELECT * INTO v_leitura FROM public.handover_reads
   WHERE entry_id = p_entry_id AND user_id = auth.uid();
  RETURN v_leitura;
END;
$$;

REVOKE ALL ON FUNCTION public.adicionar_entrada_passagem_turno(text, text, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.confirmar_leitura_entrada_passagem_turno(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.adicionar_entrada_passagem_turno(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_leitura_entrada_passagem_turno(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
