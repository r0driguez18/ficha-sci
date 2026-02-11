
-- Fix RLS policies: change from RESTRICTIVE to PERMISSIVE

-- ===== taskboard_data =====
DROP POLICY IF EXISTS "Users can create their own taskboard data" ON public.taskboard_data;
DROP POLICY IF EXISTS "Users can delete their own taskboard data" ON public.taskboard_data;
DROP POLICY IF EXISTS "Users can update their own taskboard data" ON public.taskboard_data;
DROP POLICY IF EXISTS "Users can view their own taskboard data" ON public.taskboard_data;

CREATE POLICY "Users can create their own taskboard data" ON public.taskboard_data FOR INSERT WITH CHECK ((auth.uid())::text = user_id);
CREATE POLICY "Users can delete their own taskboard data" ON public.taskboard_data FOR DELETE USING ((auth.uid())::text = user_id);
CREATE POLICY "Users can update their own taskboard data" ON public.taskboard_data FOR UPDATE USING ((auth.uid())::text = user_id);
CREATE POLICY "Users can view their own taskboard data" ON public.taskboard_data FOR SELECT USING ((auth.uid())::text = user_id);

-- ===== exported_taskboards =====
DROP POLICY IF EXISTS "Users can create their own exported taskboards" ON public.exported_taskboards;
DROP POLICY IF EXISTS "Users can delete their own exported taskboards" ON public.exported_taskboards;
DROP POLICY IF EXISTS "Users can update their own exported taskboards" ON public.exported_taskboards;
DROP POLICY IF EXISTS "Users can view their own exported taskboards" ON public.exported_taskboards;

CREATE POLICY "Users can create their own exported taskboards" ON public.exported_taskboards FOR INSERT WITH CHECK ((auth.uid())::text = user_id);
CREATE POLICY "Users can delete their own exported taskboards" ON public.exported_taskboards FOR DELETE USING ((auth.uid())::text = user_id);
CREATE POLICY "Users can update their own exported taskboards" ON public.exported_taskboards FOR UPDATE USING ((auth.uid())::text = user_id);
CREATE POLICY "Users can view their own exported taskboards" ON public.exported_taskboards FOR SELECT USING ((auth.uid())::text = user_id);

-- ===== cobrancas_retornos =====
DROP POLICY IF EXISTS "Users can create their own cobrancas retornos" ON public.cobrancas_retornos;
DROP POLICY IF EXISTS "Users can update their own cobrancas retornos" ON public.cobrancas_retornos;
DROP POLICY IF EXISTS "Users can view their own cobrancas retornos" ON public.cobrancas_retornos;

CREATE POLICY "Users can create their own cobrancas retornos" ON public.cobrancas_retornos FOR INSERT WITH CHECK (user_id = (auth.uid())::text);
CREATE POLICY "Users can update their own cobrancas retornos" ON public.cobrancas_retornos FOR UPDATE USING (user_id = (auth.uid())::text);
CREATE POLICY "Users can view their own cobrancas retornos" ON public.cobrancas_retornos FOR SELECT USING (user_id = (auth.uid())::text);

-- ===== file_processes (also fix) =====
DROP POLICY IF EXISTS "Allow public read access" ON public.file_processes;
DROP POLICY IF EXISTS "Allow public insert access" ON public.file_processes;

CREATE POLICY "Allow public read access" ON public.file_processes FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.file_processes FOR INSERT WITH CHECK (true);

-- Add UPDATE and DELETE policies for file_processes
CREATE POLICY "Allow public update access" ON public.file_processes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.file_processes FOR DELETE USING (true);

-- ===== daily_alerts (fix restrictive) =====
DROP POLICY IF EXISTS "Daily alerts are viewable by everyone" ON public.daily_alerts;
CREATE POLICY "Daily alerts are viewable by everyone" ON public.daily_alerts FOR SELECT USING (true);
CREATE POLICY "Allow insert daily alerts" ON public.daily_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update daily alerts" ON public.daily_alerts FOR UPDATE USING (true);
CREATE POLICY "Allow delete daily alerts" ON public.daily_alerts FOR DELETE USING (true);
