import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Send, CheckCircle } from 'lucide-react';

export default function TelegramSetup() {
  const [isLoading, setIsLoading] = useState(false);

  const sendTestMessage = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-notify', {
        body: { 
          message: '🧪 *Mensagem de Teste*\n\nO bot do Telegram está configurado e funcionando corretamente!'
        }
      });

      if (error) throw error;

      toast.success('Mensagem de teste enviada com sucesso!');
      console.log('Test message sent:', data);
    } catch (error: any) {
      console.error('Error sending test message:', error);
      toast.error('Erro ao enviar mensagem de teste: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Configuração do Telegram" />
      
      <div className="space-y-6 max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Telegram Configurado
            </CardTitle>
            <CardDescription>
              O bot do Telegram está configurado e pronto para enviar notificações.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>✅ Bot Token configurado</p>
              <p>✅ Chat ID do grupo configurado</p>
              <p>✅ Bot adicionado ao grupo</p>
            </div>

            <Button 
              onClick={sendTestMessage}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Mensagem de Teste
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações sobre as Notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p className="font-semibold">Quando as notificações são enviadas:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li><strong>Início do Fecho:</strong> Quando o operador inicia o processo de fecho no Taskboard</li>
                <li><strong>Término do Fecho:</strong> Quando o operador finaliza o processo de fecho no Taskboard</li>
              </ul>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-semibold mb-2">Exemplo de notificação:</p>
              <div className="font-mono text-xs bg-background p-3 rounded border">
                🔔 <strong>Início do Fecho</strong>
                <br /><br />
                Operador: João Silva
                <br />
                Hora: 23:45:30
                <br /><br />
                O processo de fecho foi iniciado.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Bot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p>O bot do Telegram está configurado através de variáveis de ambiente seguras no Supabase.</p>
              <p>As notificações são enviadas automaticamente para o grupo configurado quando eventos relevantes ocorrem no sistema.</p>
              <p className="text-xs mt-4 text-muted-foreground">
                ℹ️ Certifique-se de que o bot tem permissões para enviar mensagens no grupo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
