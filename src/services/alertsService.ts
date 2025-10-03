import { supabase } from '@/integrations/supabase/client';

export interface DailyAlert {
  id: string;
  alert_name: string;
  alert_time: string;
  is_active: boolean;
  days_of_week: string[];
  description?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all active daily alerts
 */
export async function fetchDailyAlerts(): Promise<{ data: DailyAlert[] | null; error: any }> {
  const { data, error } = await supabase
    .from('daily_alerts')
    .select('*')
    .eq('is_active', true)
    .order('alert_time');

  return { data: data as DailyAlert[], error };
}

/**
 * Get alerts for today based on current day of week
 */
export async function getTodayAlerts(): Promise<{ data: DailyAlert[] | null; error: any }> {
  const today = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = dayNames[today.getDay()];
  
  // Fetch all active alerts and filter in JavaScript since JSONB array queries can be problematic
  const { data, error } = await supabase
    .from('daily_alerts')
    .select('*')
    .eq('is_active', true)
    .order('alert_time');

  if (error) return { data: null, error };

  // Filter alerts that include today's day of week
  const filteredData = data?.filter((alert: any) => {
    const daysOfWeek = alert.days_of_week;
    return Array.isArray(daysOfWeek) && daysOfWeek.includes(dayOfWeek);
  }) || [];

  return { data: filteredData as DailyAlert[], error: null };
}

/**
 * Update alert active status
 */
export async function updateAlertStatus(alertId: string, isActive: boolean): Promise<{ error: any }> {
  const { error } = await supabase
    .from('daily_alerts')
    .update({ is_active: isActive })
    .eq('id', alertId);

  return { error };
}