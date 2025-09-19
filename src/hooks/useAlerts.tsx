import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getTodayAlerts, type DailyAlert } from '@/services/alertsService';
import { getReturnsDueToday, getOverdueReturns, type CobrancaRetorno } from '@/services/cobrancasRetornoService';
import { isBusinessDay, getCurrentTime } from '@/utils/businessDays';

interface AlertsState {
  dailyAlerts: DailyAlert[];
  pendingReturns: CobrancaRetorno[];
  overdueReturns: CobrancaRetorno[];
  loading: boolean;
  error: string | null;
}

export function useAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertsState>({
    dailyAlerts: [],
    pendingReturns: [],
    overdueReturns: [],
    loading: true,
    error: null
  });

  const fetchAlerts = async () => {
    if (!user?.id) return;

    // Don't show loading state for subsequent fetches to avoid UI flicker
    const isInitialLoad = alerts.dailyAlerts.length === 0 && alerts.pendingReturns.length === 0;
    if (isInitialLoad) {
      setAlerts(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      // Only fetch alerts on business days
      const today = new Date();
      if (!isBusinessDay(today)) {
        setAlerts({
          dailyAlerts: [],
          pendingReturns: [],
          overdueReturns: [],
          loading: false,
          error: null
        });
        return;
      }

      // Fetch all data in parallel for better performance
      const [dailyAlertsResult, pendingReturnsResult, overdueReturnsResult] = await Promise.allSettled([
        getTodayAlerts(),
        getReturnsDueToday(user.id),
        getOverdueReturns(user.id)
      ]);

      const dailyAlertsData = dailyAlertsResult.status === 'fulfilled' ? dailyAlertsResult.value.data : [];
      const pendingReturnsData = pendingReturnsResult.status === 'fulfilled' ? pendingReturnsResult.value.data : [];
      const overdueReturnsData = overdueReturnsResult.status === 'fulfilled' ? overdueReturnsResult.value.data : [];

      setAlerts({
        dailyAlerts: dailyAlertsData || [],
        pendingReturns: pendingReturnsData || [],
        overdueReturns: overdueReturnsData || [],
        loading: false,
        error: null
      });
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setAlerts(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }));
    }
  };

  const getTotalAlerts = () => {
    return alerts.dailyAlerts.length + alerts.pendingReturns.length + alerts.overdueReturns.length;
  };

  const getActiveAlerts = () => {
    const currentTime = getCurrentTime();
    return alerts.dailyAlerts.filter(alert => alert.alert_time <= currentTime);
  };

  useEffect(() => {
    // Add a small delay to prevent blocking the main dashboard render
    const timeoutId = setTimeout(() => {
    fetchAlerts();
    }, 100);
    
    // Refresh alerts every 30 seconds during business hours
    const interval = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      
      // Only refresh during business hours (8 AM - 6 PM)
      if (isBusinessDay(now) && hour >= 8 && hour <= 18) {
        fetchAlerts();
      }
    }, 30000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [user?.id]);

  return {
    ...alerts,
    refreshAlerts: fetchAlerts,
    getTotalAlerts,
    getActiveAlerts
  };
}