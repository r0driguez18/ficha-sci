-- =====================================================
-- FULL SCHEMA - Consolidated Migration
-- =====================================================

-- Function: update_modified_column
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =====================================================
-- TABLES
-- =====================================================

CREATE TABLE public.file_processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_registered date NOT NULL DEFAULT CURRENT_DATE,
  time_registered time NOT NULL,
  task text NOT NULL,
  as400_name text,
  operation_number text,
  executed_by text,
  is_salary boolean DEFAULT false,
  tipo text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.daily_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  days_of_week jsonb NOT NULL DEFAULT '["monday","tuesday","wednesday","thursday","friday"]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  alert_name text NOT NULL,
  description text
);

CREATE TABLE public.taskboard_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  form_type text NOT NULL,
  date text NOT NULL,
  turn_data jsonb NOT NULL,
  tasks jsonb NOT NULL,
  table_rows jsonb NOT NULL,
  active_tab text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, form_type, date)
);

CREATE TABLE public.exported_taskboards (
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

CREATE TABLE public.cobrancas_retornos (
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

-- =====================================================
-- VIEW
-- =====================================================
CREATE VIEW public.salary_processes AS
SELECT id, date_registered, time_registered, created_at, is_salary, task, as400_name, operation_number, executed_by
FROM public.file_processes WHERE is_salary = true;

ALTER VIEW public.salary_processes SET (security_invoker = on);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_file_processes_date ON public.file_processes(date_registered DESC);
CREATE INDEX idx_file_processes_is_salary ON public.file_processes(is_salary);
CREATE INDEX idx_file_processes_tipo ON public.file_processes(tipo);
CREATE INDEX idx_taskboard_data_user_form ON public.taskboard_data(user_id, form_type, date);
CREATE INDEX idx_exported_taskboards_user_id ON public.exported_taskboards(user_id);
CREATE INDEX idx_exported_taskboards_exported_at ON public.exported_taskboards(exported_at);
CREATE INDEX idx_cobrancas_retornos_user_id ON public.cobrancas_retornos(user_id);
CREATE INDEX idx_cobrancas_retornos_data_retorno ON public.cobrancas_retornos(data_retorno_esperada);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_taskboard_data_updated_at BEFORE UPDATE ON public.taskboard_data FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE TRIGGER update_daily_alerts_updated_at BEFORE UPDATE ON public.daily_alerts FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE TRIGGER update_exported_taskboards_updated_at BEFORE UPDATE ON public.exported_taskboards FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE TRIGGER update_cobrancas_retornos_updated_at BEFORE UPDATE ON public.cobrancas_retornos FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE public.file_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taskboard_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exported_taskboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobrancas_retornos ENABLE ROW LEVEL SECURITY;

-- file_processes (public)
CREATE POLICY "Allow public read access" ON public.file_processes FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.file_processes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.file_processes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.file_processes FOR DELETE USING (true);

-- daily_alerts (public)
CREATE POLICY "Daily alerts are viewable by everyone" ON public.daily_alerts FOR SELECT USING (true);
CREATE POLICY "Allow insert daily alerts" ON public.daily_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update daily alerts" ON public.daily_alerts FOR UPDATE USING (true);
CREATE POLICY "Allow delete daily alerts" ON public.daily_alerts FOR DELETE USING (true);

-- taskboard_data (user-scoped)
CREATE POLICY "Users can view their own taskboard data" ON public.taskboard_data FOR SELECT USING ((auth.uid())::text = user_id);
CREATE POLICY "Users can create their own taskboard data" ON public.taskboard_data FOR INSERT WITH CHECK ((auth.uid())::text = user_id);
CREATE POLICY "Users can update their own taskboard data" ON public.taskboard_data FOR UPDATE USING ((auth.uid())::text = user_id);
CREATE POLICY "Users can delete their own taskboard data" ON public.taskboard_data FOR DELETE USING ((auth.uid())::text = user_id);

-- exported_taskboards (user-scoped)
CREATE POLICY "Users can view their own exported taskboards" ON public.exported_taskboards FOR SELECT USING ((auth.uid())::text = user_id);
CREATE POLICY "Users can create their own exported taskboards" ON public.exported_taskboards FOR INSERT WITH CHECK ((auth.uid())::text = user_id);
CREATE POLICY "Users can update their own exported taskboards" ON public.exported_taskboards FOR UPDATE USING ((auth.uid())::text = user_id);
CREATE POLICY "Users can delete their own exported taskboards" ON public.exported_taskboards FOR DELETE USING ((auth.uid())::text = user_id);

-- cobrancas_retornos (user-scoped)
CREATE POLICY "Users can view their own cobrancas retornos" ON public.cobrancas_retornos FOR SELECT USING (user_id = (auth.uid())::text);
CREATE POLICY "Users can create their own cobrancas retornos" ON public.cobrancas_retornos FOR INSERT WITH CHECK (user_id = (auth.uid())::text);
CREATE POLICY "Users can update their own cobrancas retornos" ON public.cobrancas_retornos FOR UPDATE USING (user_id = (auth.uid())::text);
