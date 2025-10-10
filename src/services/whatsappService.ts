import { supabase } from '@/integrations/supabase/client';

export const sendWhatsAppNotification = async (message: string) => {
  try {
    const groupId = localStorage.getItem('whatsapp_group_id');
    
    if (!groupId) {
      console.warn('WhatsApp group ID not configured');
      return { success: false, error: 'Group ID not configured' };
    }

    const { data, error } = await supabase.functions.invoke('whatsapp-baileys', {
      body: { 
        action: 'send',
        groupId,
        message
      }
    });

    if (error) throw error;

    console.log('WhatsApp notification sent:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending WhatsApp notification:', error);
    return { success: false, error: error.message };
  }
};

export const sendFechoInicioNotification = async (operatorName: string) => {
  const message = `🔔 *Início do Fecho*\n\nOperador: ${operatorName}\nHora: ${new Date().toLocaleTimeString('pt-PT')}\n\nO processo de fecho foi iniciado.`;
  return sendWhatsAppNotification(message);
};

export const sendFechoTerminoNotification = async (operatorName: string) => {
  const message = `✅ *Fecho Concluído*\n\nOperador: ${operatorName}\nHora: ${new Date().toLocaleTimeString('pt-PT')}\n\nO processo de fecho foi concluído com sucesso.`;
  return sendWhatsAppNotification(message);
};
