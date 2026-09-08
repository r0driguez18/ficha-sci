import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useOperators, useCurrentOperator } from '@/hooks/useOperators';
import { claimOperator } from '@/services/operatorService';

export function OperatorLinkCard() {
  const queryClient = useQueryClient();
  const { operators } = useOperators();
  const current = useCurrentOperator();
  const [choice, setChoice] = useState('');
  const [busy, setBusy] = useState(false);

  // Operadores ainda sem conta associada (o serviço só expõe os ativos).
  const available = operators.filter((op) => op.user_id == null);

  const confirm = async () => {
    if (!choice) return;
    setBusy(true);
    const { error } = await claimOperator(choice);
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Conta associada ao operador.');
    queryClient.invalidateQueries({ queryKey: ['operators'] });
    queryClient.invalidateQueries({ queryKey: ['my-operator'] });
    setChoice('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Código de operador</CardTitle>
        <CardDescription>
          Liga a sua conta ao seu código de operador. É o que permite pré-preencher o campo
          "Executado por" e identificar quem preencheu cada ficha.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {current ? (
          <div className="flex items-center gap-2 text-sm">
            <UserCheck className="h-4 w-4 text-success" />
            <span>
              Associado a <strong>{current.label}</strong>{' '}
              <span className="text-muted-foreground">({current.value})</span>
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="op-choice">Selecione o seu operador</Label>
              <Select value={choice} onValueChange={setChoice}>
                <SelectTrigger id="op-choice" className="min-w-[16rem]">
                  <SelectValue placeholder="Selecionar operador" />
                </SelectTrigger>
                <SelectContent>
                  {available.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label} ({op.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={confirm} disabled={!choice || busy}>
              {busy ? 'A associar…' : 'Confirmar'}
            </Button>
          </div>
        )}
        {current && (
          <p className="text-xs text-muted-foreground">
            Para mudar de operador, contacte um administrador.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
