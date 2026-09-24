-- =====================================================
-- Alertas de hora certa — volta o "Enviar ETR" das 13:30
-- =====================================================
-- A migração 20260920160000 mudou o ETR da tarde de 13:30 para 13:00; afinal
-- há os dois: 13:00 e 13:30. Idempotente (pode correr mais de uma vez).
-- =====================================================

INSERT INTO public.daily_alerts (alert_name, alert_time, description)
SELECT 'Enviar ETR', '13:30'::time, 'Envio do ETR da tarde (13:30)'
 WHERE NOT EXISTS (
   SELECT 1 FROM public.daily_alerts a
    WHERE a.alert_name = 'Enviar ETR' AND a.alert_time = '13:30'::time
 );

-- Se a linha existia mas estava desativada, volta a ativar.
UPDATE public.daily_alerts
   SET is_active = true
 WHERE alert_name = 'Enviar ETR' AND alert_time = '13:30'::time AND NOT is_active;

NOTIFY pgrst, 'reload schema';
