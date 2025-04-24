
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Turno1Tasks } from '@/types/taskboard';

interface GeneralTasksProps {
  tasks: Turno1Tasks;
  onTaskChange: (task: keyof Turno1Tasks, checked: boolean) => void;
}

export const GeneralTasks: React.FC<GeneralTasksProps> = ({ tasks, onTaskChange }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="datacenter1" 
          checked={tasks.datacenter}
          onCheckedChange={(checked) => onTaskChange('datacenter', !!checked)}
        />
        <Label htmlFor="datacenter1" className="cursor-pointer">Verificar DATA CENTER</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="sistemas1"
          checked={tasks.sistemas}
          onCheckedChange={(checked) => onTaskChange('sistemas', !!checked)}
        />
        <Label htmlFor="sistemas1" className="cursor-pointer">Verificar Sistemas: BCACV1/BCACV2</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="servicos1"
          checked={tasks.servicos}
          onCheckedChange={(checked) => onTaskChange('servicos', !!checked)}
        />
        <Label htmlFor="servicos1" className="cursor-pointer">Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="abrirServidores"
          checked={tasks.abrirServidores}
          onCheckedChange={(checked) => onTaskChange('abrirServidores', !!checked)}
        />
        <Label htmlFor="abrirServidores" className="cursor-pointer">Abrir Servidores (SWIFT, OPDIF, TRMSG, CDGOV, AML)</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="percurso76931"
          checked={tasks.percurso76931}
          onCheckedChange={(checked) => onTaskChange('percurso76931', !!checked)}
        />
        <Label htmlFor="percurso76931" className="cursor-pointer">Percurso 76931 - Atualiza os alertas nos clientes com dados desatualizados</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox 
          id="verificarCpuMemoria"
          checked={tasks.verificarCpuMemoria}
          onCheckedChange={(checked) => onTaskChange('verificarCpuMemoria', !!checked)}
        />
        <Label htmlFor="verificarCpuMemoria" className="cursor-pointer">Verificar uso de CPU e memória em servidores principais</Label>
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
  );
};
