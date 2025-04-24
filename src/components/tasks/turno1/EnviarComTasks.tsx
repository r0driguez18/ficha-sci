
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Turno1Tasks } from '@/types/taskboard';

interface EnviarComTasksProps {
  tasks: Turno1Tasks;
  onTaskChange: (task: keyof Turno1Tasks, checked: boolean) => void;
}

export const EnviarComTasks: React.FC<EnviarComTasksProps> = ({ tasks, onTaskChange }) => {
  return (
    <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="enviarFicheiroCom"
          checked={tasks.enviarFicheiroCom}
          onCheckedChange={(checked) => onTaskChange('enviarFicheiroCom', !!checked)}
        />
        <Label htmlFor="enviarFicheiroCom" className="cursor-pointer font-medium">Enviar Ficheiro COM, dias:</Label>
      </div>
      <div className="flex flex-wrap gap-4 mt-2 ml-6">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="dia01"
            checked={tasks.dia01}
            onCheckedChange={(checked) => onTaskChange('dia01', !!checked)}
          />
          <Label htmlFor="dia01" className="cursor-pointer">01</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="dia08"
            checked={tasks.dia08}
            onCheckedChange={(checked) => onTaskChange('dia08', !!checked)}
          />
          <Label htmlFor="dia08" className="cursor-pointer">08</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="dia16"
            checked={tasks.dia16}
            onCheckedChange={(checked) => onTaskChange('dia16', !!checked)}
          />
          <Label htmlFor="dia16" className="cursor-pointer">16</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="dia23"
            checked={tasks.dia23}
            onCheckedChange={(checked) => onTaskChange('dia23', !!checked)}
          />
          <Label htmlFor="dia23" className="cursor-pointer">23</Label>
        </div>
      </div>
    </div>
  );
};
