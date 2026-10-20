
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HoraInput } from '@/components/ui/hora-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TurnKey } from '@/types/taskboard';
import { User, Clock, LogOut } from 'lucide-react';

interface TurnInfoSectionProps {
  turnKey: TurnKey;
  operator: string;
  entrada: string;
  saida: string;
  title: string;
  operatorsList: { value: string; label: string }[];
  onTurnDataChange: (turno: TurnKey, field: string, value: string) => void;
}

export const TurnInfoSection: React.FC<TurnInfoSectionProps> = ({ 
  turnKey, 
  operator, 
  entrada, 
  saida, 
  title,
  operatorsList,
  onTurnDataChange
}) => {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor={`${turnKey}-operator`} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            Operador
          </Label>
          <Select 
            value={operator} 
            onValueChange={(value) => onTurnDataChange(turnKey, 'operator', value)}
          >
            <SelectTrigger id={`${turnKey}-operator`} className="bg-background">
              <SelectValue placeholder="Selecionar operador" />
            </SelectTrigger>
            <SelectContent>
              {operatorsList.map(op => (
                <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor={`${turnKey}-entrada`} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Entrada
          </Label>
          <HoraInput
            id={`${turnKey}-entrada`}
            value={entrada}
            onChange={(v) => onTurnDataChange(turnKey, 'entrada', v)}
            className="h-10"
          />
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor={`${turnKey}-saida`} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <LogOut className="h-3.5 w-3.5" />
            Saída
          </Label>
          <HoraInput
            id={`${turnKey}-saida`}
            value={saida}
            onChange={(v) => onTurnDataChange(turnKey, 'saida', v)}
            className="h-10"
          />
        </div>
      </div>
    </div>
  );
};
