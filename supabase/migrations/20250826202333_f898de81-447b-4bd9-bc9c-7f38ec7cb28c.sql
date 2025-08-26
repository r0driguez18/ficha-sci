-- Create daily_alerts table for automated daily reminders
CREATE TABLE public.daily_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_name TEXT NOT NULL,
  alert_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  days_of_week JSONB NOT NULL DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday"]',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_alerts (public read, admin only write)
CREATE POLICY "Daily alerts are viewable by everyone" 
ON public.daily_alerts 
FOR SELECT 
USING (true);

-- Create cobrancas_retornos table for tracking collection file returns
CREATE TABLE public.cobrancas_retornos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  data_aplicacao DATE NOT NULL,
  ficheiro_nome TEXT NOT NULL,
  data_retorno_esperada DATE NOT NULL,
  retorno_enviado BOOLEAN NOT NULL DEFAULT false,
  data_retorno_enviado DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cobrancas_retornos ENABLE ROW LEVEL SECURITY;

-- Create policies for cobrancas_retornos
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

-- Insert predefined daily alerts
INSERT INTO public.daily_alerts (alert_name, alert_time, description) VALUES
('Enviar ETR', '08:00:00', 'Envio do ETR matinal'),
('Aplicar Ficheiros Compensação', '09:00:00', 'Aplicação dos ficheiros de compensação'),
('Gerar ficheiros visa', '11:45:00', 'Geração dos ficheiros visa'),
('Enviar ETR', '13:30:00', 'Envio do ETR da tarde'),
('Enviar ENV/IMA', '14:30:00', 'Envio de ENV/IMA'),
('Aplicar TEFS', '14:45:00', 'Aplicação de TEFS'),
('Aplicar Compensação', '15:30:00', 'Aplicação da compensação da tarde');

-- Add trigger for automatic timestamp updates on both tables
CREATE TRIGGER update_daily_alerts_updated_at
BEFORE UPDATE ON public.daily_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_cobrancas_retornos_updated_at
BEFORE UPDATE ON public.cobrancas_retornos
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();