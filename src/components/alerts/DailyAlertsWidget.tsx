import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle, Bell, Flame } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import { returnStatus } from '@/lib/cobrancasSla';
import type { CobrancaRetorno } from '@/services/cobrancasRetornoService';

export function DailyAlertsWidget() {
  const { returnsDue, returnsOverdue, returnsUrgent, loading } = useAlerts();

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Retornos de Cobranças
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">A carregar retornos...</p>
        </CardContent>
      </Card>
    );
  }

  const total = returnsDue.length + returnsOverdue.length + returnsUrgent.length;

  const row = (retorno: CobrancaRetorno, tone: 'urgent' | 'overdue' | 'due') => {
    const status = returnStatus(retorno);
    const styles =
      tone === 'due'
        ? 'border-secondary/20 bg-secondary/5'
        : 'border-destructive/20 bg-destructive/5';
    const Icon = tone === 'urgent' ? Flame : tone === 'overdue' ? AlertTriangle : Clock;
    return (
      <div key={retorno.id} className={`flex items-center justify-between p-2 rounded-md border ${styles}`}>
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${tone === 'due' ? 'text-secondary' : 'text-destructive'}`} />
          <div>
            <p className="text-sm font-medium">{retorno.ficheiro_nome}</p>
            <p className="text-xs text-muted-foreground">
              Aplicado: {new Date(retorno.data_aplicacao).toLocaleDateString('pt-PT')}
            </p>
          </div>
        </div>
        <Badge variant={tone === 'due' ? 'secondary' : 'destructive'} className="text-xs">
          {status.label}
        </Badge>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Retornos de Cobranças
          </div>
          {total > 0 && (
            <Badge variant={returnsOverdue.length + returnsUrgent.length > 0 ? 'destructive' : 'secondary'}>
              {total}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Ficheiros de retorno pendentes</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {returnsUrgent.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-destructive flex items-center gap-1">
              <Flame className="h-4 w-4" /> Urgentes
            </h4>
            {returnsUrgent.map((r) => row(r, 'urgent'))}
          </div>
        )}

        {returnsOverdue.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-destructive">Retornos em Atraso</h4>
            {returnsOverdue.map((r) => row(r, 'overdue'))}
          </div>
        )}

        {returnsDue.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-secondary-foreground">Retornos para Hoje</h4>
            {returnsDue.map((r) => row(r, 'due'))}
          </div>
        )}

        {total === 0 && (
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Sem alertas para hoje!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
