-- =====================================================
-- F13 — Notas de passagem de turno
-- =====================================================
-- Cada turno deixa um resumo para o turno seguinte ("percurso das 23h
-- atrasado 20 min; SISP não enviou CSV — a acompanhar") e quem entra
-- confirma a leitura. Ligado à data + turno da ficha.
--
-- Visível e editável por toda a equipa (trabalho em três turnos sobre a
-- mesma operação — ver 20260908153120_team_visibility). A autoria e a
-- confirmação de leitura ficam registadas com operador e hora.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.handover_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date text NOT NULL,                       -- YYYY-MM-DD (mesma convenção das fichas)
  turno text NOT NULL,                      -- 'turno1' | 'turno2' | 'turno3'
  nota text NOT NULL DEFAULT '',
  autor_user_id uuid,
  autor_nome text,
  lida_por uuid,
  lida_por_nome text,
  lida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (date, turno)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'handover_notes_turno_check'
  ) THEN
    ALTER TABLE public.handover_notes
      ADD CONSTRAINT handover_notes_turno_check
      CHECK (turno IN ('turno1', 'turno2', 'turno3'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_handover_notes_date ON public.handover_notes (date);

DROP TRIGGER IF EXISTS update_handover_notes_updated_at ON public.handover_notes;
CREATE TRIGGER update_handover_notes_updated_at
  BEFORE UPDATE ON public.handover_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

ALTER TABLE public.handover_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Handover notes visíveis para a equipa" ON public.handover_notes;
DROP POLICY IF EXISTS "Handover notes inseridas pela equipa" ON public.handover_notes;
DROP POLICY IF EXISTS "Handover notes atualizadas pela equipa" ON public.handover_notes;

CREATE POLICY "Handover notes visíveis para a equipa"
  ON public.handover_notes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Handover notes inseridas pela equipa"
  ON public.handover_notes FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Handover notes atualizadas pela equipa"
  ON public.handover_notes FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Sem DELETE: as notas de passagem de turno não se apagam.

NOTIFY pgrst, 'reload schema';
