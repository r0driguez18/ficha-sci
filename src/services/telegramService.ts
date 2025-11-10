import { supabase } from '@/integrations/supabase/client';

export const sendTelegramNotification = async (message: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('telegram-notify', {
      body: { message }
    });

    if (error) throw error;

    console.log('Telegram notification sent:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending Telegram notification:', error);
    return { success: false, error: error.message };
  }
};

export const sendFechoInicioNotification = async (operatorName: string) => {
  const message = `🔔 *Início do Fecho*\n\nOperador: ${operatorName}\nHora: ${new Date().toLocaleTimeString('pt-PT')}\n\nO processo de fecho foi iniciado.`;
  return sendTelegramNotification(message);
};

export const sendFechoTerminoNotification = async (operatorName: string) => {
  const message = `✅ *Fecho Concluído*\n\nOperador: ${operatorName}\nHora: ${new Date().toLocaleTimeString('pt-PT')}\n\nO processo de fecho foi concluído com sucesso.`;
  return sendTelegramNotification(message);
};
