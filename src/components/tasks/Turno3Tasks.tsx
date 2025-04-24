
import React from 'react';
import { AntesFechoTasks } from './turno3/AntesFechoTasks';
import { DepoisFechoTasks } from './turno3/DepoisFechoTasks';
import { Turno3Tasks } from '@/types/taskboard';

interface Turno3TasksComponentProps {
  tasks: Turno3Tasks;
  onTaskChange: (task: keyof Turno3Tasks, checked: boolean) => void;
  fechoRealTime?: string;
  inicioFecho?: string;
  aberturaRealTime?: string;
  terminoFecho?: string;
  onTimeChange?: (field: string, value: string) => void;
}

export const Turno3TasksComponent: React.FC<Turno3TasksComponentProps> = ({ 
  tasks, 
  onTaskChange,
  fechoRealTime,
  inicioFecho,
  aberturaRealTime,
  terminoFecho,
  onTimeChange
}) => {
  return (
    <div className="space-y-6">
      <AntesFechoTasks 
        tasks={tasks} 
        onTaskChange={onTaskChange}
        fechoRealTime={fechoRealTime}
        inicioFecho={inicioFecho}
        onTimeChange={onTimeChange}
      />
      
      <DepoisFechoTasks 
        tasks={tasks} 
        onTaskChange={onTaskChange}
        aberturaRealTime={aberturaRealTime}
        terminoFecho={terminoFecho}
        onTimeChange={onTimeChange}
      />
    </div>
  );
};
