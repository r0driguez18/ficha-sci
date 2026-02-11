
-- Add missing tables: daily_alerts, exported_taskboards, cobrancas_retornos
-- Add tipo column to file_processes

ALTER TABLE public.file_processes ADD COLUMN IF NOT EXISTS tipo text;

-- Create daily_alerts table (if not exists)
CREATE TABLE IF NOT EXISTS public.daily_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_time time without time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  days_of_week jsonb NOT NULL DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday"]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  alert_name text NOT NULL,
  description text
);

ALTER TABLE public.daily_alerts ENABLE ROW LEVEL SECURITY;

-- Create exported_taskboards table (if not exists)
CREATE TABLE IF NOT EXISTS public.exported_taskboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  form_type text NOT NULL,
  date text NOT NULL,
  exported_at timestamp with time zone NOT NULL DEFAULT now(),
  turn_data jsonb NOT NULL,
  tasks jsonb NOT NULL,
  table_rows jsonb NOT NULL,
  pdf_signature jsonb NOT NULL,
  file_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.exported_taskboards ENABLE ROW LEVEL SECURITY;

-- Create cobrancas_retornos table (if not exists)
CREATE TABLE IF NOT EXISTS public.cobrancas_retornos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  data_aplicacao date NOT NULL,
  data_retorno_esperada date NOT NULL,
  ficheiro_nome text NOT NULL,
  retorno_enviado boolean NOT NULL DEFAULT false,
  data_retorno_enviado date,
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cobrancas_retornos ENABLE ROW LEVEL SECURITY;

-- Add unique constraint to taskboard_data (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'taskboard_data_user_form_date_key'
  ) THEN
    ALTER TABLE public.taskboard_data ADD CONSTRAINT taskboard_data_user_form_date_key UNIQUE (user_id, form_type, date);
  END IF;
END $$;

-- Create triggers (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS update_daily_alerts_updated_at ON public.daily_alerts;
CREATE TRIGGER update_daily_alerts_updated_at
BEFORE UPDATE ON public.daily_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_exported_taskboards_updated_at ON public.exported_taskboards;
CREATE TRIGGER update_exported_taskboards_updated_at
BEFORE UPDATE ON public.exported_taskboards
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS update_cobrancas_retornos_updated_at ON public.cobrancas_retornos;
CREATE TRIGGER update_cobrancas_retornos_updated_at
BEFORE UPDATE ON public.cobrancas_retornos
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();
