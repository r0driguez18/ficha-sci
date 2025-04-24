
import React from 'react';
import { Turno1Tasks } from '@/types/taskboard';
import { GeneralTasks } from './turno1/GeneralTasks';
import { EnviarTasks } from './turno1/EnviarTasks';
import { BackupsDiferidosTasks } from './turno1/BackupsDiferidosTasks';
import { EnviarComTasks } from './turno1/EnviarComTasks';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Turno1TasksProps {
  tasks: Turno1Tasks;
  onTaskChange: (task: keyof Turno1Tasks, checked: boolean) => void;
}

export const Turno1TasksComponent: React.FC<Turno1TasksProps> = ({ tasks, onTaskChange }) => {
  return (
    <div className="space-y-4">
      <GeneralTasks tasks={tasks} onTaskChange={onTaskChange} />
      <EnviarTasks tasks={tasks} onTaskChange={onTaskChange} />
      
      <div className="space-y-2">
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="verificarDebitos"
            checked={tasks.verificarDebitos}
            onCheckedChange={(checked) => onTaskChange('verificarDebitos', !!checked)}
          />
          <Label htmlFor="verificarDebitos" className="cursor-pointer">Verificar Débitos/Créditos aplicados no dia Anterior</Label>
        </div>
      </div>
      
      <BackupsDiferidosTasks tasks={tasks} onTaskChange={onTaskChange} />
      
      <div className="space-y-2">
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="processarTef"
            checked={tasks.processarTef}
            onCheckedChange={(checked) => onTaskChange('processarTef', !!checked)}
          />
          <Label htmlFor="processarTef" className="cursor-pointer">Processar ficheiros TEF - ERR/RTR/RCT</Label>
        </div>
        
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="processarTelecomp"
            checked={tasks.processarTelecomp}
            onCheckedChange={(checked) => onTaskChange('processarTelecomp', !!checked)}
          />
          <Label htmlFor="processarTelecomp" className="cursor-pointer">Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR</Label>
        </div>
        
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="enviarSegundoEtr"
            checked={tasks.enviarSegundoEtr}
            onCheckedChange={(checked) => onTaskChange('enviarSegundoEtr', !!checked)}
          />
          <Label htmlFor="enviarSegundoEtr" className="cursor-pointer">Enviar 2º Ficheiro ETR (13h:30)</Label>
        </div>
      </div>
      
      <EnviarComTasks tasks={tasks} onTaskChange={onTaskChange} />
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="atualizarCentralRisco"
          checked={tasks.atualizarCentralRisco}
          onCheckedChange={(checked) => onTaskChange('atualizarCentralRisco', !!checked)}
        />
        <Label htmlFor="atualizarCentralRisco" className="cursor-pointer">Atualizar Nº Central de Risco (Todas as Sextas-Feiras)</Label>
      </div>
    </div>
  );
};
