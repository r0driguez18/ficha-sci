
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TurnKey } from '@/types/taskboard';

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
    <div className="grid md:grid-cols-3 gap-4">
      <div>
        <Label htmlFor={`${turnKey}-operator`}>Operador</Label>
        <Select 
          value={operator} 
          onValueChange={(value) => onTurnDataChange(turnKey, 'operator', value)}
        >
          <SelectTrigger id={`${turnKey}-operator`}>
            <SelectValue placeholder="Selecionar operador" />
          </SelectTrigger>
          <SelectContent>
            {operatorsList.map(op => (
              <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor={`${turnKey}-entrada`}>Entrada</Label>
        <Input
          id={`${turnKey}-entrada`}
          type="time"
          value={entrada}
          onChange={(e) => onTurnDataChange(turnKey, 'entrada', e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor={`${turnKey}-saida`}>Saída</Label>
        <Input
          id={`${turnKey}-saida`}
          type="time"
          value={saida}
          onChange={(e) => onTurnDataChange(turnKey, 'saida', e.target.value)}
        />
      </div>
    </div>
  );
};
