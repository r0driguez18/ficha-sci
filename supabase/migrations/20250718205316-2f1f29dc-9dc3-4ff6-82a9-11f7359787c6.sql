-- Enable RLS on taskboard_data table
ALTER TABLE public.taskboard_data ENABLE ROW LEVEL SECURITY;

-- Create policies for taskboard_data
CREATE POLICY "Users can view their own taskboard data" 
ON public.taskboard_data 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own taskboard data" 
ON public.taskboard_data 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own taskboard data" 
ON public.taskboard_data 
FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own taskboard data" 
ON public.taskboard_data 
FOR DELETE 
USING (auth.uid()::text = user_id);

-- Also enable RLS on salary_processes table (it's missing RLS)
ALTER TABLE public.salary_processes ENABLE ROW LEVEL SECURITY;

-- Create policies for salary_processes (public access like file_processes)
CREATE POLICY "Allow public read access on salary_processes" 
ON public.salary_processes 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access on salary_processes" 
ON public.salary_processes 
FOR INSERT 
WITH CHECK (true);