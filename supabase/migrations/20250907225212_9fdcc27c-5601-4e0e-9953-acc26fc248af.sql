-- Add tipo column to file_processes table for categorizing processing types
ALTER TABLE public.file_processes 
ADD COLUMN tipo text;

-- Add check constraint to ensure valid processing types
ALTER TABLE public.file_processes 
ADD CONSTRAINT check_tipo_values 
CHECK (tipo IN ('salario', 'cobrancas', 'compensacao') OR tipo IS NULL);

-- Add index for better performance on tipo queries
CREATE INDEX idx_file_processes_tipo ON public.file_processes(tipo);

-- Update existing records to set tipo based on current logic
-- For salary processes (AS400 names starting with SA)
UPDATE public.file_processes 
SET tipo = 'salario' 
WHERE as400_name IS NOT NULL AND upper(as400_name) LIKE 'SA%';

-- For now, set remaining records to NULL - they can be categorized later
-- Users can manually update the tipo for their existing records