import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, CheckCircle, Bell } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import { getCurrentTime, hasTimePassedAlert } from '@/utils/businessDays';

export function DailyAlertsWidget() {
  const { pendingReturns, overdueReturns, loading } = useAlerts();
  
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

  const totalAlerts = pendingReturns.length + overdueReturns.length;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Retornos de Cobranças
          </div>
          {totalAlerts > 0 && (
            <Badge variant={overdueReturns.length > 0 ? "destructive" : "secondary"}>
              {totalAlerts}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Ficheiros de retorno pendentes
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">

        {/* Overdue Returns */}
        {overdueReturns.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-destructive">Retornos em Atraso</h4>
            {overdueReturns.map((retorno) => (
              <div key={retorno.id} className="flex items-center justify-between p-2 rounded-md border border-destructive/20 bg-destructive/5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <div>
                    <p className="text-sm font-medium">{retorno.ficheiro_nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Aplicado: {new Date(retorno.data_aplicacao).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>
                <Badge variant="destructive" className="text-xs">
                  Vencido
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Pending Returns */}
        {pendingReturns.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-secondary-foreground">Retornos para Hoje</h4>
            {pendingReturns.map((retorno) => (
              <div key={retorno.id} className="flex items-center justify-between p-2 rounded-md border border-secondary/20 bg-secondary/5">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-secondary" />
                  <div>
                    <p className="text-sm font-medium">{retorno.ficheiro_nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Aplicado: {new Date(retorno.data_aplicacao).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Hoje
                </Badge>
              </div>
            ))}
          </div>
        )}

        {totalAlerts === 0 && (
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Sem alertas para hoje!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}