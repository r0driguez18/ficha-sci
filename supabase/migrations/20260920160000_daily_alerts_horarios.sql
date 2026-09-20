-- =====================================================
-- Alertas de hora certa — horários acertados com a operação
-- =====================================================
--   08:00 Enviar ETR                     (já existia)
--   08:55 Processar TEF                  (novo)
--   09:00 Telecompensação                (já existia: "Aplicar Ficheiros Compensação")
--   13:00 Enviar ETR                     (era 13:30)
--   14:00 Enviar ENV/IMA — limite 15:00  (era 14:30)
--   14:30 Processar TEF                  (era "Aplicar TEFS" às 14:45)
--   14:50 Confirmar envio ENV/IMA        (novo — última chamada antes do limite das 15:00)
--   15:30 Telecompensação da tarde       (já existia)
--   "Gerar ficheiros visa" (11:45)       desativado — já não é preciso
-- Idempotente (pode correr mais de uma vez).
-- =====================================================

UPDATE public.daily_alerts
   SET is_active = false
 WHERE alert_name ILIKE 'Gerar ficheiros visa%' AND is_active;

UPDATE public.daily_alerts
   SET alert_time = '13:00'
 WHERE alert_name = 'Enviar ETR' AND alert_time = '13:30';

UPDATE public.daily_alerts
   SET alert_name = 'Processar TEF',
       alert_time = '14:30',
       description = 'Processar os ficheiros TEF da tarde'
 WHERE alert_name ILIKE 'Aplicar TEF%' AND alert_time = '14:45';

UPDATE public.daily_alerts
   SET alert_name = 'Enviar ENV/IMA (limite 15:00)',
       alert_time = '14:00',
       description = 'Envio de ENV/IMA — tem de sair antes das 15:00'
 WHERE alert_name = 'Enviar ENV/IMA' AND alert_time = '14:30';

-- Nomes das telecompensações (na base local os acentos estavam estragados: "Compensa??o").
UPDATE public.daily_alerts
   SET alert_name = 'Processar Telecompensação',
       description = 'Processar os ficheiros de telecompensação da manhã'
 WHERE alert_name LIKE 'Aplicar Ficheiros Compensa%' AND alert_time = '09:00';

UPDATE public.daily_alerts
   SET alert_name = 'Processar Telecompensação (tarde)',
       description = 'Processar os ficheiros de telecompensação da tarde'
 WHERE alert_name LIKE 'Aplicar Compensa%' AND alert_time = '15:30';

INSERT INTO public.daily_alerts (alert_name, alert_time, description)
SELECT v.n, v.t::time, v.d
  FROM (VALUES
    ('Processar TEF', '08:55', 'Processar os ficheiros TEF da manhã'),
    ('Confirmar envio ENV/IMA (limite 15:00)', '14:50', 'Já foi enviado o ENV/IMA? O limite é às 15:00')
  ) AS v(n, t, d)
 WHERE NOT EXISTS (
   SELECT 1 FROM public.daily_alerts a WHERE a.alert_name = v.n AND a.alert_time = v.t::time
 );

NOTIFY pgrst, 'reload schema';
