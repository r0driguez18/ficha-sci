
import React from 'react';
import { Turno3Tasks } from '@/types/taskboard';
import { AntesFechoTasks } from './turno3/AntesFechoTasks';
import { DepoisFechoTasks } from './turno3/DepoisFechoTasks';
import { BackupsDiferidosTasks } from './turno3/BackupsDiferidosTasks';

interface Turno3TasksProps {
  tasks: Turno3Tasks;
  onTaskChange: (task: keyof Turno3Tasks, checked: boolean) => void;
}

export const Turno3TasksComponent: React.FC<Turno3TasksProps> = ({ tasks, onTaskChange }) => {
  return (
    <div className="space-y-6">
      <AntesFechoTasks tasks={tasks} onTaskChange={onTaskChange} />
      <DepoisFechoTasks tasks={tasks} onTaskChange={onTaskChange} />
      <BackupsDiferidosTasks tasks={tasks} onTaskChange={onTaskChange} />
    </div>
  );
};
