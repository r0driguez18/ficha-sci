import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { configurarTeams, estadoTeams, testarTeams } from '@/services/notificarFechoService';

/** Administração: webhook do canal do Teams que recebe as mensagens de início/término do fecho. */
export const NotificacoesTeamsCard: React.FC = () => {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [aGravar, setAGravar] = useState(false);
  const [aTestar, setATestar] = useState(false);

  const q = useQuery({
    queryKey: ['teams-estado'],
    queryFn: async () => {
      const r = await estadoTeams();
      if (r.erro) throw new Error(r.erro);
      return r.dados;
    },
  });

  const guardar = async (valor: string) => {
    setAGravar(true);
    const r = await configurarTeams(valor);
    setAGravar(false);
    if (r.erro) {
      toast.error(r.erro);
      return;
    }
    setUrl('');
    toast.success(valor ? 'Webhook do Teams guardado.' : 'Webhook do Teams removido.');
    await queryClient.invalidateQueries({ queryKey: ['teams-estado'] });
  };

  const testar = async () => {
    setATestar(true);
    const r = await testarTeams();
    setATestar(false);
    if (r.erro) toast.error(r.erro);
    else toast.success('Mensagem de teste enviada — vê o canal do Teams.');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Mensagens para o Teams
          {q.data && (
            <Badge variant={q.data.configurado ? 'default' : 'secondary'}>
              {q.data.configurado ? 'Ativo' : 'Sem webhook'}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Ao marcar &quot;Início do Fecho&quot; e &quot;Término do Fecho&quot; na ficha do Turno 3, é enviada uma mensagem para o canal
          (uma por dia e tipo). Cola aqui o endereço do webhook criado no Teams (Workflows → &quot;Publicar num canal quando é
          recebido um pedido webhook&quot;).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {q.isError && <p className="text-sm text-destructive">{(q.error as Error).message}</p>}
        {q.data?.configurado && (
          <p className="text-sm text-muted-foreground">
            Webhook guardado ({q.data.anfitriao}). Por segurança o endereço completo não volta a ser mostrado.
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="teams-url">{q.data?.configurado ? 'Substituir o endereço do webhook' : 'Endereço do webhook'}</Label>
          <Input
            id="teams-url"
            type="password"
            autoComplete="off"
            placeholder="https://prod-…logic.azure.com/workflows/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => guardar(url.trim())} disabled={!url.trim() || aGravar}>
            {aGravar && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
          <Button variant="outline" onClick={testar} disabled={!q.data?.configurado || aTestar} className="gap-1.5">
            {aTestar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar teste
          </Button>
          {q.data?.configurado && (
            <Button variant="ghost" onClick={() => guardar('')} disabled={aGravar} className="text-destructive">
              Remover
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
