-- ============================================
-- Migration: Initial Schema
-- Para usar: supabase migration new initial_schema
-- Depois copie este conteúdo para o arquivo gerado
-- ============================================

-- Create function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create file_processes table for tracking file processing operations
CREATE TABLE public.file_processes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_registered DATE NOT NULL DEFAULT CURRENT_DATE,
  time_registered TIME NOT NULL,
  task TEXT NOT NULL,
  as400_name TEXT,
  operation_number TEXT,
  executed_by TEXT,
  is_salary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security on file_processes
ALTER TABLE public.file_processes ENABLE ROW LEVEL SECURITY;

-- Create policies for file_processes (public access for read and insert)
CREATE POLICY "Allow public read access" 
ON public.file_processes 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access" 
ON public.file_processes 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_file_processes_date ON public.file_processes(date_registered DESC);
CREATE INDEX idx_file_processes_is_salary ON public.file_processes(is_salary);

-- Create salary_processes view for filtering salary-related processes
CREATE VIEW public.salary_processes AS
SELECT * FROM public.file_processes
WHERE is_salary = true;

-- Enable RLS on the view
ALTER VIEW public.salary_processes SET (security_invoker = on);

-- Create taskboard_data table for storing user taskboard drafts and autosaves
CREATE TABLE public.taskboard_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  form_type TEXT NOT NULL,
  date TEXT NOT NULL,
  turn_data JSONB NOT NULL,
  tasks JSONB NOT NULL,
  table_rows JSONB NOT NULL,
  active_tab TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security on taskboard_data
ALTER TABLE public.taskboard_data ENABLE ROW LEVEL SECURITY;

-- Create trigger for automatic timestamp updates on taskboard_data
CREATE TRIGGER update_taskboard_data_updated_at
BEFORE UPDATE ON public.taskboard_data
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

-- Create index for better performance
CREATE INDEX idx_taskboard_data_user_form ON public.taskboard_data(user_id, form_type, date);
