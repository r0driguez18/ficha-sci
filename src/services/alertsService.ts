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
  
  const { data, error } = await supabase
    .from('daily_alerts')
    .select('*')
    .eq('is_active', true)
    .contains('days_of_week', [dayOfWeek])
    .order('alert_time');

  return { data: data as DailyAlert[], error };
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