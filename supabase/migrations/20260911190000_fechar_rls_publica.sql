-- =====================================================
-- Fecha o acesso público (anon) a file_processes e daily_alerts
-- =====================================================
-- Achado de auditoria de segurança: estas duas tabelas tinham políticas
-- `USING (true)` sem `TO authenticated`, o que as tornava legíveis E
-- escrevíveis (insert/update/delete) por qualquer pedido com a chave
-- pública `anon`, sem sessão iniciada — incluindo `file_processes`, que
-- guarda o nº de operação usado na deteção de duplicados da Ficha de
-- Procedimentos e alimenta a Estatística.
--
-- Nenhuma das duas tabelas tem coluna de dono (`executed_by` é texto
-- livre, não uma FK a auth.users) — são dados partilhados pela equipa,
-- como o resto dos dados operacionais desta app. A correção mantém o
-- acesso livre entre colegas autenticados; só remove o acesso anónimo.
-- =====================================================

DROP POLICY IF EXISTS "Allow public read access" ON public.file_processes;
DROP POLICY IF EXISTS "Allow public insert access" ON public.file_processes;
DROP POLICY IF EXISTS "Allow public update access" ON public.file_processes;
DROP POLICY IF EXISTS "Allow public delete access" ON public.file_processes;

CREATE POLICY "File processes are readable by the team"
  ON public.file_processes FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "File processes are insertable by the team"
  ON public.file_processes FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "File processes are updatable by the team"
  ON public.file_processes FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);
CREATE POLICY "File processes are deletable by the team"
  ON public.file_processes FOR DELETE TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Daily alerts are viewable by everyone" ON public.daily_alerts;
DROP POLICY IF EXISTS "Allow insert daily alerts" ON public.daily_alerts;
DROP POLICY IF EXISTS "Allow update daily alerts" ON public.daily_alerts;
DROP POLICY IF EXISTS "Allow delete daily alerts" ON public.daily_alerts;

CREATE POLICY "Daily alerts are readable by the team"
  ON public.daily_alerts FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Daily alerts are insertable by the team"
  ON public.daily_alerts FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "Daily alerts are updatable by the team"
  ON public.daily_alerts FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);
CREATE POLICY "Daily alerts are deletable by the team"
  ON public.daily_alerts FOR DELETE TO authenticated
  USING (true);

NOTIFY pgrst, 'reload schema';
