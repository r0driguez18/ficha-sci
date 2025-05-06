
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Turno3Tasks } from '@/types/taskboard';
import { OperacoesFechoDia } from './turno3/OperacoesFechoDia';
import { DepoisDoFecho } from './turno3/DepoisDoFecho';

interface Turno3TasksProps {
  tasks: Turno3Tasks;
  onTaskChange: (task: keyof Turno3Tasks, value: boolean | string) => void;
  observations: string;
  onObservationsChange: (value: string) => void;
}

export const Turno3TasksComponent: React.FC<Turno3TasksProps> = ({
  tasks,
  onTaskChange,
  observations,
  onObservationsChange
}) => {
  return (
    <div className="space-y-2">
      <OperacoesFechoDia 
        tasks={tasks} 
        onTaskChange={onTaskChange} 
      />
      
      <DepoisDoFecho 
        tasks={tasks} 
        onTaskChange={onTaskChange}
      />
      
      <div className="mt-6">
        <Label htmlFor="observations3">Observaçes</Label>
        <Textarea 
          id="observations3" 
          value={observations}
          onChange={(e) => onObservationsChange(e.target.value)}
          className="mt-2"
        />
      </div>
    </div>
  );
};
