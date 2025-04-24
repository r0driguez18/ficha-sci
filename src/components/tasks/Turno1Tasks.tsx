
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Turno1Tasks } from '@/types/taskboard';

interface Turno1TasksProps {
  tasks: Turno1Tasks;
  onTaskChange: (task: keyof Turno1Tasks, checked: boolean) => void;
}

export const Turno1TasksComponent: React.FC<Turno1TasksProps> = ({ tasks, onTaskChange }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="datacenter" 
          checked={tasks.datacenter}
          onCheckedChange={(checked) => onTaskChange('datacenter', !!checked)}
        />
        <Label htmlFor="datacenter" className="cursor-pointer">Verificar DATA CENTER</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="sistemas"
          checked={tasks.sistemas}
          onCheckedChange={(checked) => onTaskChange('sistemas', !!checked)}
        />
        <Label htmlFor="sistemas" className="cursor-pointer">Verificar Sistemas: BCACV1/BCACV2</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="servicos"
          checked={tasks.servicos}
          onCheckedChange={(checked) => onTaskChange('servicos', !!checked)}
        />
        <Label htmlFor="servicos" className="cursor-pointer">Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA</Label>
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
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="verificarDebitos"
          checked={tasks.verificarDebitos}
          onCheckedChange={(checked) => onTaskChange('verificarDebitos', !!checked)}
        />
        <Label htmlFor="verificarDebitos" className="cursor-pointer">Verificar Débitos/Créditos aplicados no dia Anterior</Label>
      </div>
      
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
    </div>
  );
};
