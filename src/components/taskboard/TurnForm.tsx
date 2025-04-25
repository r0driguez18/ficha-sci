
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TurnKey } from '@/types/taskboard';
import { Turno1TasksComponent } from '@/components/tasks/Turno1Tasks';
import { Turno2TasksComponent } from '@/components/tasks/Turno2Tasks';
import { Turno3TasksComponent } from '@/components/tasks/Turno3Tasks';

interface TurnFormProps {
  turnKey: TurnKey;
  turnNumber: string;
  operator: string;
  entrada: string;
  saida: string;
  observations: string;
  tasks: any;
  operatorsList: { value: string; label: string }[];
  onOperatorChange: (value: string) => void;
  onEntradaChange: (value: string) => void;
  onSaidaChange: (value: string) => void;
  onObservationsChange: (value: string) => void;
  onTaskChange: (task: string, checked: boolean) => void;
}

export const TurnForm: React.FC<TurnFormProps> = ({
  turnKey,
  turnNumber,
  operator,
  entrada,
  saida,
  observations,
  tasks,
  operatorsList,
  onOperatorChange,
  onEntradaChange,
  onSaidaChange,
  onObservationsChange,
  onTaskChange
}) => {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor={`operator${turnNumber}`}>Operador</Label>
          <Select 
            value={operator}
            onValueChange={onOperatorChange}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione um operador" />
            </SelectTrigger>
            <SelectContent>
              {operatorsList.map((op) => (
                <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`entrada${turnNumber}`}>Hora Entrada</Label>
          <Input 
            id={`entrada${turnNumber}`}
            type="time" 
            value={entrada}
            onChange={(e) => onEntradaChange(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`saida${turnNumber}`}>Hora Saída</Label>
          <Input 
            id={`saida${turnNumber}`}
            type="time"
            value={saida}
            onChange={(e) => onSaidaChange(e.target.value)} 
          />
        </div>
      </div>
      
      <div className="mt-4">
        <Label htmlFor={`observations${turnNumber}`}>Observações</Label>
        <Textarea 
          id={`observations${turnNumber}`}
          value={observations}
          onChange={(e) => onObservationsChange(e.target.value)}
        />
      </div>
      
      <div className="mt-6">
        <h3 className="mb-4 font-medium">Tarefas</h3>
        <div className="space-y-4">
          {turnKey === 'turno1' && (
            <Turno1TasksComponent 
              tasks={tasks} 
              onTaskChange={onTaskChange}
              observations={observations}
              onObservationsChange={onObservationsChange}
            />
          )}
          {turnKey === 'turno2' && (
            <Turno2TasksComponent 
              tasks={tasks} 
              onTaskChange={onTaskChange}
              observations={observations}
              onObservationsChange={onObservationsChange}
            />
          )}
          {turnKey === 'turno3' && (
            <Turno3TasksComponent 
              tasks={tasks} 
              onTaskChange={onTaskChange}
              observations={observations}
              onObservationsChange={onObservationsChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};
