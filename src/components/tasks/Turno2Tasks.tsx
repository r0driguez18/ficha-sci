
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Turno2Tasks } from '@/types/taskboard';

interface Turno2TasksProps {
  tasks: Turno2Tasks;
  onTaskChange: (task: keyof Turno2Tasks, checked: boolean) => void;
}

export const Turno2TasksComponent: React.FC<Turno2TasksProps> = ({ tasks, onTaskChange }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="datacenter2" 
          checked={tasks.datacenter}
          onCheckedChange={(checked) => onTaskChange('datacenter', !!checked)}
        />
        <Label htmlFor="datacenter2" className="cursor-pointer">Verificar DATA CENTER</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="sistemas2"
          checked={tasks.sistemas}
          onCheckedChange={(checked) => onTaskChange('sistemas', !!checked)}
        />
        <Label htmlFor="sistemas2" className="cursor-pointer">Verificar Sistemas: BCACV1/BCACV2</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="servicos2"
          checked={tasks.servicos}
          onCheckedChange={(checked) => onTaskChange('servicos', !!checked)}
        />
        <Label htmlFor="servicos2" className="cursor-pointer">Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="verificarReportes"
          checked={tasks.verificarReportes}
          onCheckedChange={(checked) => onTaskChange('verificarReportes', !!checked)}
        />
        <Label htmlFor="verificarReportes" className="cursor-pointer">Verificar envio de reportes(INPS, VISTO USA, BCV, IMPC)</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox 
          id="verificarDebitos2"
          checked={tasks.verificarDebitos}
          onCheckedChange={(checked) => onTaskChange('verificarDebitos', !!checked)}
        />
        <Label htmlFor="verificarDebitos2" className="cursor-pointer">Verificar Débitos/Créditos Aplicados no Turno Anterior</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox 
          id="confirmarAtualizacaoSisp"
          checked={tasks.confirmarAtualizacaoSisp}
          onCheckedChange={(checked) => onTaskChange('confirmarAtualizacaoSisp', !!checked)}
        />
        <Label htmlFor="confirmarAtualizacaoSisp" className="cursor-pointer">Confirmar Atualização Ficheiros Enviados à SISP (ECI * ENV/IMA)</Label>
      </div>
      
      <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-800">
        <h4 className="font-medium mb-2">Ficheiros INPS:</h4>
        <div className="ml-4 space-y-2">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="inpsProcessar"
              checked={tasks.inpsProcessar}
              onCheckedChange={(checked) => onTaskChange('inpsProcessar', !!checked)}
            />
            <Label htmlFor="inpsProcessar" className="cursor-pointer">Processar</Label>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="inpsEnviarRetorno"
              checked={tasks.inpsEnviarRetorno}
              onCheckedChange={(checked) => onTaskChange('inpsEnviarRetorno', !!checked)}
            />
            <Label htmlFor="inpsEnviarRetorno" className="cursor-pointer">Enviar Retorno</Label>
          </div>
        </div>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="processarTef2"
          checked={tasks.processarTef}
          onCheckedChange={(checked) => onTaskChange('processarTef', !!checked)}
        />
        <Label htmlFor="processarTef2" className="cursor-pointer">Processar ficheiros TEF - ERR/RTR/RCT</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="processarTelecomp2"
          checked={tasks.processarTelecomp}
          onCheckedChange={(checked) => onTaskChange('processarTelecomp', !!checked)}
        />
        <Label htmlFor="processarTelecomp2" className="cursor-pointer">Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR</Label>
      </div>
      
      <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-800">
        <h4 className="font-medium mb-2">Enviar Ficheiro:</h4>
        <div className="ml-4 space-y-2">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="enviarEci"
              checked={tasks.enviarEci}
              onCheckedChange={(checked) => onTaskChange('enviarEci', !!checked)}
            />
            <Label htmlFor="enviarEci" className="cursor-pointer">ECI</Label>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="enviarEdv"
              checked={tasks.enviarEdv}
              onCheckedChange={(checked) => onTaskChange('enviarEdv', !!checked)}
            />
            <Label htmlFor="enviarEdv" className="cursor-pointer">EDV</Label>
          </div>
        </div>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="validarSaco"
          checked={tasks.validarSaco}
          onCheckedChange={(checked) => onTaskChange('validarSaco', !!checked)}
        />
        <Label htmlFor="validarSaco" className="cursor-pointer">Validar Saco 1935</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="verificarPendentes"
          checked={tasks.verificarPendentes}
          onCheckedChange={(checked) => onTaskChange('verificarPendentes', !!checked)}
        />
        <Label htmlFor="verificarPendentes" className="cursor-pointer">Verificar Pendentes dos Balcões</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="fecharBalcoes"
          checked={tasks.fecharBalcoes}
          onCheckedChange={(checked) => onTaskChange('fecharBalcoes', !!checked)}
        />
        <Label htmlFor="fecharBalcoes" className="cursor-pointer">Fechar os Balcoes Centrais</Label>
      </div>
    </div>
  );
};
