import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';

export default function WhatsAppSetup() {
  const [groupId, setGroupId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    checkConnectionStatus();
    loadGroupId();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-baileys', {
        body: { action: 'status' }
      });

      if (error) throw error;
      setIsConnected(data.connected);
    } catch (error: any) {
      console.error('Error checking WhatsApp status:', error);
    }
  };

  const loadGroupId = () => {
    const saved = localStorage.getItem('whatsapp_group_id');
    if (saved) setGroupId(saved);
  };

  const saveGroupId = () => {
    if (!groupId.trim()) {
      toast.error('Por favor, insira o ID do grupo');
      return;
    }
    localStorage.setItem('whatsapp_group_id', groupId.trim());
    toast.success('ID do grupo guardado com sucesso');
  };

  const initializeConnection = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-baileys', {
        body: { action: 'init' }
      });

      if (error) throw error;

      if (data.qrCode) {
        setQrCode(data.qrCode);
        toast.success('QR Code gerado. Por favor, escaneie com o WhatsApp.');
      }
    } catch (error: any) {
      console.error('Error initializing WhatsApp:', error);
      toast.error('Erro ao inicializar conexão: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testMessage = async () => {
    if (!groupId.trim()) {
      toast.error('Por favor, configure o ID do grupo primeiro');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-baileys', {
        body: { 
          action: 'send',
          groupId: groupId,
          message: '🧪 Mensagem de teste do sistema de notificações'
        }
      });

      if (error) throw error;
      toast.success('Mensagem de teste enviada com sucesso!');
    } catch (error: any) {
      console.error('Error sending test message:', error);
      toast.error('Erro ao enviar mensagem: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Configuração WhatsApp" />

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Estado da Conexão</h3>
                {isConnected ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                {isConnected 
                  ? 'WhatsApp conectado e pronto para enviar mensagens'
                  : 'WhatsApp não está conectado. Inicie a conexão e escaneie o QR code.'}
              </p>

              <Button 
                onClick={initializeConnection}
                disabled={isLoading || isConnected}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A inicializar...
                  </>
                ) : isConnected ? (
                  'Conectado'
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Iniciar Conexão
                  </>
                )}
              </Button>

              {qrCode && qrCode !== 'QR_CODE_PLACEHOLDER' && (
                <div className="mt-4 p-4 border rounded-lg bg-background">
                  <p className="text-sm mb-2 text-center font-semibold">Escaneie este QR Code com o WhatsApp:</p>
                  <p className="text-xs mb-4 text-center text-muted-foreground">
                    Abra o WhatsApp → Menu (⋮) → Dispositivos conectados → Conectar dispositivo
                  </p>
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg">
                      <QRCode value={qrCode} size={256} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configuração do Grupo</h3>
              
              <div className="space-y-2">
                <Label htmlFor="groupId">ID do Grupo WhatsApp</Label>
                <Input
                  id="groupId"
                  placeholder="120363XXXXXXXXX@g.us"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Para obter o ID do grupo: envie uma mensagem no grupo e use o menu de informações
                </p>
              </div>

              <Button onClick={saveGroupId} variant="outline" className="w-full">
                Guardar ID do Grupo
              </Button>

              <Button 
                onClick={testMessage}
                disabled={isLoading || !isConnected || !groupId}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A enviar...
                  </>
                ) : (
                  'Enviar Mensagem de Teste'
                )}
              </Button>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Informações Importantes</h3>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>Esta integração usa Baileys, uma solução não-oficial para WhatsApp</li>
            <li>Recomendamos usar um número secundário dedicado para este bot</li>
            <li>Existe risco de bloqueio pela Meta/WhatsApp por uso de API não-oficial</li>
            <li>A conexão precisa ser mantida ativa através do scan do QR code</li>
            <li>As mensagens serão enviadas automaticamente para o grupo quando o fecho iniciar/terminar</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}
