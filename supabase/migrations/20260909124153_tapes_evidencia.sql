-- =====================================================
-- Evidência do "display-tape" para a folha de Verificação de Tapes
-- =====================================================
-- O checklist da folha de tapes é preenchido online na ficha. A prova — o
-- print do "display-tape" do AS/400, em PDF ou TXT — só é feita no dia
-- seguinte (o display de domingo faz-se na segunda), pelo que não pode ser
-- anexada no momento em que a ficha é exportada.
--
-- Estas colunas registam, em cada ficha arquivada, se falta anexar essa
-- prova. O ficheiro em si vive no bucket "tapes-evidencia" do Storage.
--
--   tapes_status:
--     'nao_aplicavel' — dia útil normal, sem folha de tapes
--     'pendente'      — tem folha de tapes, display ainda não anexado
--     'anexada'       — display carregado
--
-- Qualquer operador da equipa pode anexar (a prova é responsabilidade da
-- equipa, tal como o resto do histórico — ver 20260908153120_team_visibility).
-- Como o UPDATE de exported_taskboards continua restrito ao autor da ficha,
-- o anexo passa por uma função SECURITY DEFINER que só toca nas colunas de
-- tapes.
-- =====================================================

ALTER TABLE public.exported_taskboards
  ADD COLUMN IF NOT EXISTS tapes_status text NOT NULL DEFAULT 'nao_aplicavel',
  ADD COLUMN IF NOT EXISTS tapes_evidencia jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tapes_anexada_at timestamptz,
  ADD COLUMN IF NOT EXISTS tapes_anexada_by uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exported_taskboards_tapes_status_check'
  ) THEN
    ALTER TABLE public.exported_taskboards
      ADD CONSTRAINT exported_taskboards_tapes_status_check
      CHECK (tapes_status IN ('nao_aplicavel', 'pendente', 'anexada'));
  END IF;
END $$;

-- Lista das fichas ainda a aguardar o display.
CREATE INDEX IF NOT EXISTS idx_exported_taskboards_tapes_pendente
  ON public.exported_taskboards (exported_at)
  WHERE tapes_status = 'pendente';

-- ---------- Anexar / substituir / limpar a evidência ----------
-- `evidencia` é o array COMPLETO de ficheiros que passam a estar anexados:
--   [{ path, name, size, type, uploaded_at, uploaded_by }, ...]
-- Passar '[]' volta a marcar a ficha como pendente.
CREATE OR REPLACE FUNCTION public.set_tapes_evidencia(
  taskboard_id uuid,
  evidencia jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  tem_ficheiros boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF jsonb_typeof(COALESCE(evidencia, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'evidencia tem de ser um array JSON';
  END IF;

  tem_ficheiros := jsonb_array_length(COALESCE(evidencia, '[]'::jsonb)) > 0;

  UPDATE public.exported_taskboards
     SET tapes_evidencia  = COALESCE(evidencia, '[]'::jsonb),
         tapes_status     = CASE WHEN tem_ficheiros THEN 'anexada' ELSE 'pendente' END,
         tapes_anexada_at = CASE WHEN tem_ficheiros THEN now() ELSE NULL END,
         tapes_anexada_by = CASE WHEN tem_ficheiros THEN auth.uid() ELSE NULL END
   WHERE id = taskboard_id
     AND tapes_status <> 'nao_aplicavel';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ficha não encontrada ou não requer evidência de tapes';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_tapes_evidencia(uuid, jsonb) TO authenticated;

-- ---------- Storage: bucket privado da evidência ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('tapes-evidencia', 'tapes-evidencia', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "tapes evidencia - team read" ON storage.objects;
DROP POLICY IF EXISTS "tapes evidencia - team upload" ON storage.objects;
DROP POLICY IF EXISTS "tapes evidencia - team update" ON storage.objects;
DROP POLICY IF EXISTS "tapes evidencia - team delete" ON storage.objects;

CREATE POLICY "tapes evidencia - team read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'tapes-evidencia');

CREATE POLICY "tapes evidencia - team upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tapes-evidencia');

CREATE POLICY "tapes evidencia - team update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'tapes-evidencia')
  WITH CHECK (bucket_id = 'tapes-evidencia');

CREATE POLICY "tapes evidencia - team delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'tapes-evidencia');

NOTIFY pgrst, 'reload schema';
