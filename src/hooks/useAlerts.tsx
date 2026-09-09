import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getTodayAlerts, type DailyAlert } from '@/services/alertsService';
import { getPendingReturns, type CobrancaRetorno } from '@/services/cobrancasRetornoService';
import { returnStatus } from '@/lib/cobrancasSla';
import { isBusinessDay, getCurrentTime } from '@/utils/businessDays';

interface AlertsState {
  dailyAlerts: DailyAlert[];
  /** Retornos que vencem hoje. */
  returnsDue: CobrancaRetorno[];
  /** Retornos em atraso (1–2 dias úteis). */
  returnsOverdue: CobrancaRetorno[];
  /** Retornos com mais de 2 dias úteis de atraso. */
  returnsUrgent: CobrancaRetorno[];
  loading: boolean;
  error: string | null;
}

function emptyAlerts(): Omit<AlertsState, 'loading' | 'error'> {
  return { dailyAlerts: [], returnsDue: [], returnsOverdue: [], returnsUrgent: [] };
}

export function useAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertsState>({
    ...emptyAlerts(),
    loading: true,
    error: null,
  });

  const fetchAlerts = async () => {
    if (!user?.id) return;

    setAlerts((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Só corre em dias úteis.
      if (!isBusinessDay(new Date())) {
        setAlerts({ ...emptyAlerts(), loading: false, error: null });
        return;
      }

      const { data: dailyAlertsData, error: alertsError } = await getTodayAlerts();
      if (alertsError) throw alertsError;

      const { data: pendingData, error: pendingError } = await getPendingReturns();
      if (pendingError) throw pendingError;

      const returnsDue: CobrancaRetorno[] = [];
      const returnsOverdue: CobrancaRetorno[] = [];
      const returnsUrgent: CobrancaRetorno[] = [];
      for (const r of pendingData ?? []) {
        const { severity } = returnStatus(r);
        if (severity === 'due') returnsDue.push(r);
        else if (severity === 'atrasado') returnsOverdue.push(r);
        else if (severity === 'urgente') returnsUrgent.push(r);
      }

      setAlerts({
        dailyAlerts: dailyAlertsData || [],
        returnsDue,
        returnsOverdue,
        returnsUrgent,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setAlerts((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  };

  const getTotalAlerts = () =>
    alerts.dailyAlerts.length +
    alerts.returnsDue.length +
    alerts.returnsOverdue.length +
    alerts.returnsUrgent.length;

  const getActiveAlerts = () => {
    const currentTime = getCurrentTime();
    return alerts.dailyAlerts.filter((alert) => alert.alert_time <= currentTime);
  };

  useEffect(() => {
    fetchAlerts();

    const interval = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      if (isBusinessDay(now) && hour >= 8 && hour <= 18) {
        fetchAlerts();
      }
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    ...alerts,
    refreshAlerts: fetchAlerts,
    getTotalAlerts,
    getActiveAlerts,
  };
}
