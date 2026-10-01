-- =====================================================
-- Ficha de Procedimentos — rascunho partilhado pela equipa (não por operador)
-- =====================================================
-- A ficha é UMA por dia, com uma secção por turno — como a folha de papel
-- que substitui: quem entra de manhã tem de ver o que o turno anterior já
-- preencheu, mesmo sendo outra pessoa a ter entrado com a conta dela.
--
-- Até agora `taskboard_data` era isolada por operador — UNIQUE(user_id,
-- form_type, date) e RLS só para o dono (auth.uid() = user_id). Cada login
-- via sempre a sua própria ficha, nunca o que um colega tinha acabado de
-- preencher nesse mesmo dia: dois operadores diferentes a trabalhar no
-- mesmo dia ficavam, sem se aperceberem, com DUAS fichas em paralelo.
--
-- Esta é exatamente a mesma lacuna que a F1 (20260908153120_team_visibility)
-- já tinha corrigido no HISTÓRICO (exported_taskboards) e nos retornos de
-- cobranças — só que lá faltava aqui, no rascunho em curso, que é
-- precisamente onde mais importa durante o turno.
--
-- `user_id` continua a gravar-se em cada escrita (quem editou por último),
-- mas deixa de fazer parte da identidade do registo: a ficha passa a ser
-- identificada só por (form_type, date).
-- =====================================================

-- Junta rascunhos que, na prática antiga, pudessem ter ficado duplicados
-- para o mesmo (form_type, date) em logins diferentes (não deveria
-- acontecer com um único operador a usar a app, mas a constraint antiga
-- não impedia). Fica o mais recentemente atualizado; os outros são apagados.
DELETE FROM public.taskboard_data t
WHERE EXISTS (
  SELECT 1 FROM public.taskboard_data t2
   WHERE t2.form_type = t.form_type AND t2.date = t.date
     AND (t2.updated_at, t2.id) > (t.updated_at, t.id)
);

ALTER TABLE public.taskboard_data
  DROP CONSTRAINT IF EXISTS taskboard_data_user_id_form_type_date_key;
DROP INDEX IF EXISTS idx_taskboard_data_user_form;

-- Adicionar uma UNIQUE constraint já existente dá "relation already exists"
-- (não "duplicate_object" como um CHECK) — confirma-se na tabela de
-- constraints em vez de apanhar a exceção.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'taskboard_data_form_type_date_key'
  ) THEN
    ALTER TABLE public.taskboard_data
      ADD CONSTRAINT taskboard_data_form_type_date_key UNIQUE (form_type, date);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_taskboard_data_form_date
  ON public.taskboard_data (form_type, date);

DROP POLICY IF EXISTS "Users can view their own taskboard data" ON public.taskboard_data;
DROP POLICY IF EXISTS "Users can create their own taskboard data" ON public.taskboard_data;
DROP POLICY IF EXISTS "Users can update their own taskboard data" ON public.taskboard_data;
DROP POLICY IF EXISTS "Users can delete their own taskboard data" ON public.taskboard_data;
DROP POLICY IF EXISTS "Taskboard drafts are viewable by the team" ON public.taskboard_data;
DROP POLICY IF EXISTS "Taskboard drafts are insertable by the team" ON public.taskboard_data;
DROP POLICY IF EXISTS "Taskboard drafts are updatable by the team" ON public.taskboard_data;
DROP POLICY IF EXISTS "Taskboard drafts are deletable by the team" ON public.taskboard_data;

CREATE POLICY "Taskboard drafts are viewable by the team"
  ON public.taskboard_data FOR SELECT TO authenticated USING (true);

-- Qualquer operador da equipa pode criar/continuar a ficha do dia, mas só
-- gravando o SEU próprio user_id (não pode escrever a dizer que foi outro
-- a editar — a mesma regra "nunca confiar num parâmetro do cliente" usada
-- nas funções de assinatura/passagem de turno).
CREATE POLICY "Taskboard drafts are insertable by the team"
  ON public.taskboard_data FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = user_id);

CREATE POLICY "Taskboard drafts are updatable by the team"
  ON public.taskboard_data FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK ((auth.uid())::text = user_id);

-- Qualquer operador pode "Recomeçar" a ficha partilhada do dia (e é também
-- o que acontece automaticamente a seguir a uma exportação bem-sucedida).
CREATE POLICY "Taskboard drafts are deletable by the team"
  ON public.taskboard_data FOR DELETE TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';
