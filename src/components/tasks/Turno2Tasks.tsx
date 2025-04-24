
import React from 'react';
import { GeneralTasks } from './turno2/GeneralTasks';
import { Turno2Tasks } from '@/types/taskboard';

interface Turno2TasksProps {
  tasks: Turno2Tasks;
  onTaskChange: (task: keyof Turno2Tasks, checked: boolean) => void;
}

export const Turno2TasksComponent: React.FC<Turno2TasksProps> = ({ tasks, onTaskChange }) => {
  return <GeneralTasks tasks={tasks} onTaskChange={onTaskChange} />;
};
