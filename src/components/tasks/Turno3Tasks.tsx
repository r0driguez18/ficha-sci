
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Turno3Tasks } from '@/types/taskboard';
import { AntesFechoTasks } from './turno3/AntesFechoTasks';
import { DepoisFechoTasks } from './turno3/DepoisFechoTasks';

interface Turno3TasksProps {
  tasks: Turno3Tasks;
  onTaskChange: (task: keyof Turno3Tasks, checked: boolean) => void;
}

export const Turno3TasksComponent: React.FC<Turno3TasksProps> = ({ tasks, onTaskChange }) => {
  return (
    <div className="space-y-6">
      <AntesFechoTasks tasks={tasks} onTaskChange={onTaskChange} />
      <DepoisFechoTasks tasks={tasks} onTaskChange={onTaskChange} />
    </div>
  );
};
