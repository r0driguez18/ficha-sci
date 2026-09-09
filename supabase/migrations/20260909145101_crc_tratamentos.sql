-- =====================================================
-- F10 — Registo das execuções de tratamento do CRC
-- =====================================================
-- O "fecho de inconsistências" do CRC é feito por um serviço local
-- (crc-inconsistencias-service) que a página SCI arranca e acompanha. Cada
-- execução é registada aqui, para histórico e auditoria.
--
-- Visível a toda a equipa (como o restante histórico — ver
-- 20260908153120_team_visibility); só o autor insere/atualiza.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.crc_tratamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  tipo text NOT NULL DEFAULT 'inconsistencias',
  estado text NOT NULL DEFAULT 'a_correr',      -- a_correr | concluido | parado | erro
  parametros jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_registos integer NOT NULL DEFAULT 0,
  processados integer NOT NULL DEFAULT 0,
  falhas integer NOT NULL DEFAULT 0,
  resumo text,
  iniciado_em timestamptz NOT NULL DEFAULT now(),
  terminado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_crc_tratamentos_updated_at ON public.crc_tratamentos;
CREATE TRIGGER update_crc_tratamentos_updated_at
  BEFORE UPDATE ON public.crc_tratamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE INDEX IF NOT EXISTS idx_crc_tratamentos_iniciado_em
  ON public.crc_tratamentos (iniciado_em DESC);

ALTER TABLE public.crc_tratamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRC tratamentos visíveis para a equipa" ON public.crc_tratamentos;
DROP POLICY IF EXISTS "CRC tratamentos inseridos pelo autor" ON public.crc_tratamentos;
DROP POLICY IF EXISTS "CRC tratamentos atualizados pelo autor" ON public.crc_tratamentos;

CREATE POLICY "CRC tratamentos visíveis para a equipa"
  ON public.crc_tratamentos FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "CRC tratamentos inseridos pelo autor"
  ON public.crc_tratamentos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "CRC tratamentos atualizados pelo autor"
  ON public.crc_tratamentos FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
