
import React from 'react';
import { Turno3Tasks } from '@/types/taskboard';
import { AntesFechoTasks } from './AntesFechoTasks';
import { DepoisFechoTasks } from './DepoisFechoTasks';

interface Turno3TasksComponentProps {
  tasks: Turno3Tasks;
  onTaskChange: (task: keyof Turno3Tasks, checked: boolean) => void;
}

export const Turno3TasksComponent: React.FC<Turno3TasksComponentProps> = ({ tasks, onTaskChange }) => {
  return (
    <div className="space-y-6">
      <AntesFechoTasks tasks={tasks} onTaskChange={onTaskChange} />
      <DepoisFechoTasks tasks={tasks} onTaskChange={onTaskChange} />
    </div>
  );
};

