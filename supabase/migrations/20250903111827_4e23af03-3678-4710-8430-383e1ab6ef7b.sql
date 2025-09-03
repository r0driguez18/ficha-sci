-- Create table for exported taskboards (complete records only)
CREATE TABLE public.exported_taskboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  form_type TEXT NOT NULL,
  date TEXT NOT NULL,
  exported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  turn_data JSONB NOT NULL,
  tasks JSONB NOT NULL,
  table_rows JSONB NOT NULL,
  pdf_signature JSONB NOT NULL, -- {signerName, signedAt, imageDataUrl}
  file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.exported_taskboards ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own exported taskboards" 
ON public.exported_taskboards 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own exported taskboards" 
ON public.exported_taskboards 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own exported taskboards" 
ON public.exported_taskboards 
FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own exported taskboards" 
ON public.exported_taskboards 
FOR DELETE 
USING (auth.uid()::text = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_exported_taskboards_updated_at
BEFORE UPDATE ON public.exported_taskboards
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

-- Create index for better performance
CREATE INDEX idx_exported_taskboards_user_date ON public.exported_taskboards(user_id, date);
CREATE INDEX idx_exported_taskboards_form_type ON public.exported_taskboards(form_type);
CREATE INDEX idx_exported_taskboards_exported_at ON public.exported_taskboards(exported_at DESC);