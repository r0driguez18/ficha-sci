-- =====================================================
-- SCHEMA COMPLETO PARA NOVA BASE DE DADOS SUPABASE
-- =====================================================
-- Este ficheiro contém todas as tabelas, funções, triggers, 
-- políticas RLS e views necessárias para o projeto
-- =====================================================

-- =====================================================
-- FUNÇÕES
-- =====================================================

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- TABELAS
-- =====================================================

-- Tabela: file_processes
-- Armazena os processos de ficheiros registados
CREATE TABLE public.file_processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_registered date NOT NULL DEFAULT CURRENT_DATE,
  time_registered time without time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  is_salary boolean DEFAULT false,
  task text NOT NULL,
  as400_name text,
  operation_number text,
  executed_by text,
  tipo text
);

-- Tabela: daily_alerts
-- Armazena os alertas diários configurados
CREATE TABLE public.daily_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_time time without time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  days_of_week jsonb NOT NULL DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday"]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  alert_name text NOT NULL,
  description text
);

-- Tabela: taskboard_data
-- Armazena os dados das taskboards (rascunhos/auto-save)
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

-- Tabela: exported_taskboards
-- Armazena as taskboards exportadas (histórico)
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

-- Tabela: cobrancas_retornos
-- Armazena os retornos de cobranças
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
-- VIEWS
-- =====================================================

-- View: salary_processes
-- Mostra apenas os processos relacionados com salários
CREATE VIEW public.salary_processes AS
SELECT 
  id,
  date_registered,
  time_registered,
  created_at,
  is_salary,
  task,
  as400_name,
  operation_number,
  executed_by
FROM public.file_processes
WHERE is_salary = true;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at em daily_alerts
CREATE TRIGGER update_daily_alerts_updated_at
BEFORE UPDATE ON public.daily_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

-- Trigger para atualizar updated_at em taskboard_data
CREATE TRIGGER update_taskboard_data_updated_at
BEFORE UPDATE ON public.taskboard_data
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

-- Trigger para atualizar updated_at em exported_taskboards
CREATE TRIGGER update_exported_taskboards_updated_at
BEFORE UPDATE ON public.exported_taskboards
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

-- Trigger para atualizar updated_at em cobrancas_retornos
CREATE TRIGGER update_cobrancas_retornos_updated_at
BEFORE UPDATE ON public.cobrancas_retornos
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Ativar RLS em todas as tabelas relevantes
ALTER TABLE public.file_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taskboard_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exported_taskboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobrancas_retornos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS - file_processes
-- =====================================================

CREATE POLICY "Allow public read access"
ON public.file_processes
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert access"
ON public.file_processes
FOR INSERT
WITH CHECK (true);

-- =====================================================
-- POLÍTICAS RLS - daily_alerts
-- =====================================================

CREATE POLICY "Daily alerts are viewable by everyone"
ON public.daily_alerts
FOR SELECT
USING (true);

-- =====================================================
-- POLÍTICAS RLS - taskboard_data
-- =====================================================

CREATE POLICY "Users can view their own taskboard data"
ON public.taskboard_data
FOR SELECT
USING ((auth.uid())::text = user_id);

CREATE POLICY "Users can create their own taskboard data"
ON public.taskboard_data
FOR INSERT
WITH CHECK ((auth.uid())::text = user_id);

CREATE POLICY "Users can update their own taskboard data"
ON public.taskboard_data
FOR UPDATE
USING ((auth.uid())::text = user_id);

CREATE POLICY "Users can delete their own taskboard data"
ON public.taskboard_data
FOR DELETE
USING ((auth.uid())::text = user_id);

-- =====================================================
-- POLÍTICAS RLS - exported_taskboards
-- =====================================================

CREATE POLICY "Users can view their own exported taskboards"
ON public.exported_taskboards
FOR SELECT
USING ((auth.uid())::text = user_id);

CREATE POLICY "Users can create their own exported taskboards"
ON public.exported_taskboards
FOR INSERT
WITH CHECK ((auth.uid())::text = user_id);

CREATE POLICY "Users can update their own exported taskboards"
ON public.exported_taskboards
FOR UPDATE
USING ((auth.uid())::text = user_id);

CREATE POLICY "Users can delete their own exported taskboards"
ON public.exported_taskboards
FOR DELETE
USING ((auth.uid())::text = user_id);

-- =====================================================
-- POLÍTICAS RLS - cobrancas_retornos
-- =====================================================

CREATE POLICY "Users can view their own cobrancas retornos"
ON public.cobrancas_retornos
FOR SELECT
USING (user_id = (auth.uid())::text);

CREATE POLICY "Users can create their own cobrancas retornos"
ON public.cobrancas_retornos
FOR INSERT
WITH CHECK (user_id = (auth.uid())::text);

CREATE POLICY "Users can update their own cobrancas retornos"
ON public.cobrancas_retornos
FOR UPDATE
USING (user_id = (auth.uid())::text);

-- =====================================================
-- ÍNDICES (Opcional mas recomendado para performance)
-- =====================================================

-- Índices para file_processes
CREATE INDEX idx_file_processes_date ON public.file_processes(date_registered);
CREATE INDEX idx_file_processes_is_salary ON public.file_processes(is_salary);
CREATE INDEX idx_file_processes_tipo ON public.file_processes(tipo);

-- Índices para taskboard_data
CREATE INDEX idx_taskboard_data_user_id ON public.taskboard_data(user_id);
CREATE INDEX idx_taskboard_data_form_type ON public.taskboard_data(form_type);
CREATE INDEX idx_taskboard_data_date ON public.taskboard_data(date);

-- Índices para exported_taskboards
CREATE INDEX idx_exported_taskboards_user_id ON public.exported_taskboards(user_id);
CREATE INDEX idx_exported_taskboards_form_type ON public.exported_taskboards(form_type);
CREATE INDEX idx_exported_taskboards_exported_at ON public.exported_taskboards(exported_at);

-- Índices para cobrancas_retornos
CREATE INDEX idx_cobrancas_retornos_user_id ON public.cobrancas_retornos(user_id);
CREATE INDEX idx_cobrancas_retornos_data_retorno ON public.cobrancas_retornos(data_retorno_esperada);
CREATE INDEX idx_cobrancas_retornos_enviado ON public.cobrancas_retornos(retorno_enviado);

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================
