import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

      if (data?.success) {
        toast.success('✅ Mensagem de teste enviada com sucesso!');
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Error sending test message:', error);
      const errorMsg = error.message || String(error);
      
      if (errorMsg.includes('chat not found')) {
        toast.error('❌ Chat não encontrado! Verifique se o bot foi adicionado ao grupo e se o Chat ID está correto.');
      } else if (errorMsg.includes('Unauthorized')) {
        toast.error('❌ Token inválido! Verifique se o Bot Token está correto.');
      } else {
        toast.error('❌ Erro: ' + errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Configuração do Telegram" />
      
      <div className="space-y-6 max-w-4xl mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Siga os passos abaixo para configurar o bot corretamente antes de enviar a mensagem de teste.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Passo 1: Criar o Bot no Telegram</CardTitle>
            <CardDescription>
              Configure o bot através do BotFather
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Abra o Telegram e procure por <code className="bg-muted px-1 rounded">@BotFather</code></li>
              <li>Envie o comando <code className="bg-muted px-1 rounded">/newbot</code></li>
              <li>Siga as instruções para criar um novo bot</li>
              <li>Copie o <strong>Bot Token</strong> fornecido pelo BotFather</li>
              <li className="text-muted-foreground text-xs">O token deve ter o formato: <code>123456789:ABCdefGHIjklMNOpqrsTUVwxyz</code></li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Passo 2: Criar o Grupo e Adicionar o Bot</CardTitle>
            <CardDescription>
              Configure o grupo para receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Crie um novo grupo no Telegram ou use um existente</li>
              <li>Adicione o bot ao grupo (procure pelo nome do bot)</li>
              <li><strong>Importante:</strong> Envie pelo menos uma mensagem no grupo (qualquer texto)</li>
              <li>Abra no navegador: <code className="bg-muted px-1 rounded text-xs break-all">{'https://api.telegram.org/bot<SEU_TOKEN>/getUpdates'}</code></li>
              <li>Substitua <code className="bg-muted px-1 rounded">{'<SEU_TOKEN>'}</code> pelo token do bot</li>
              <li>Procure por <code className="bg-muted px-1 rounded">{'"chat":{"id":-123456789'}</code> e copie o número (incluindo o sinal negativo)</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Passo 3: Configurar as Secrets no Supabase</CardTitle>
            <CardDescription>
              As secrets já foram configuradas anteriormente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span><strong>TELEGRAM_BOT_TOKEN:</strong> Configurado</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span><strong>TELEGRAM_CHAT_ID:</strong> Configurado</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Se precisar atualizar estes valores, use o botão de atualizar secrets nas configurações do Supabase.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Passo 4: Testar a Configuração</CardTitle>
            <CardDescription>
              Envie uma mensagem de teste para verificar se tudo está funcionando
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Erros comuns:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong>"chat not found":</strong> Bot não foi adicionado ao grupo ou Chat ID incorreto</li>
                  <li><strong>"Unauthorized":</strong> Bot Token está incorreto</li>
                  <li><strong>"bot was blocked":</strong> Bot foi removido ou bloqueado no grupo</li>
                </ul>
              </AlertDescription>
            </Alert>

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
