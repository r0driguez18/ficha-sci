
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Turno1Tasks } from '@/types/taskboard';

interface EnviarTasksProps {
  tasks: Turno1Tasks;
  onTaskChange: (task: keyof Turno1Tasks, checked: boolean) => void;
}

export const EnviarTasks: React.FC<EnviarTasksProps> = ({ tasks, onTaskChange }) => {
  return (
    <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="enviar"
          checked={tasks.enviar}
          onCheckedChange={(checked) => onTaskChange('enviar', !!checked)}
        />
        <Label htmlFor="enviar" className="cursor-pointer font-medium">Enviar:</Label>
      </div>
      <div className="flex flex-wrap gap-4 mt-2 ml-6">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="etr"
            checked={tasks.etr}
            onCheckedChange={(checked) => onTaskChange('etr', !!checked)}
          />
          <Label htmlFor="etr" className="cursor-pointer">ETR</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="impostos"
            checked={tasks.impostos}
            onCheckedChange={(checked) => onTaskChange('impostos', !!checked)}
          />
          <Label htmlFor="impostos" className="cursor-pointer">Impostos</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="inpsExtrato"
            checked={tasks.inpsExtrato}
            onCheckedChange={(checked) => onTaskChange('inpsExtrato', !!checked)}
          />
          <Label htmlFor="inpsExtrato" className="cursor-pointer">INPS/Extrato</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="vistoUsa"
            checked={tasks.vistoUsa}
            onCheckedChange={(checked) => onTaskChange('vistoUsa', !!checked)}
          />
          <Label htmlFor="vistoUsa" className="cursor-pointer">Visto USA</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="ben"
            checked={tasks.ben}
            onCheckedChange={(checked) => onTaskChange('ben', !!checked)}
          />
          <Label htmlFor="ben" className="cursor-pointer">BEN</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="bcta"
            checked={tasks.bcta}
            onCheckedChange={(checked) => onTaskChange('bcta', !!checked)}
          />
          <Label htmlFor="bcta" className="cursor-pointer">BCTA</Label>
        </div>
      </div>
    </div>
  );
};
