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