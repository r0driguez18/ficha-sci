
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Turno2Tasks } from '@/types/taskboard';

interface Turno2TasksProps {
  tasks: Turno2Tasks;
  onTaskChange: (task: keyof Turno2Tasks, checked: boolean) => void;
  observations: string;
  onObservationsChange: (value: string) => void;
}

export const Turno2TasksComponent: React.FC<Turno2TasksProps> = ({ 
  tasks, 
  onTaskChange,
  observations,
  onObservationsChange 
}) => {
  // Helper function to ensure we only pass boolean values to onTaskChange
  const handleCheckboxChange = (task: keyof Turno2Tasks, value: boolean | "indeterminate") => {
    onTaskChange(task, value === true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="datacenter2" 
          checked={tasks.datacenter}
          onCheckedChange={(checked) => handleCheckboxChange('datacenter', checked)}
        />
        <Label htmlFor="datacenter2" className="cursor-pointer">Verificar Alarmes e Sistemas/Climatização DATA CENTER</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="sistemas2"
          checked={tasks.sistemas}
          onCheckedChange={(checked) => handleCheckboxChange('sistemas', checked)}
        />
        <Label htmlFor="sistemas2" className="cursor-pointer">Verificar Sistemas: BCACV1/BCACV2</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="servicos2"
          checked={tasks.servicos}
          onCheckedChange={(checked) => handleCheckboxChange('servicos', checked)}
        />
        <Label htmlFor="servicos2" className="cursor-pointer">Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="verificarReportes"
          checked={tasks.verificarReportes}
          onCheckedChange={(checked) => handleCheckboxChange('verificarReportes', checked)}
        />
        <Label htmlFor="verificarReportes" className="cursor-pointer">Verificar envio de reportes(INPS, VISTO USA, BCV, IMPC)</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="verificarDebitos2"
          checked={tasks.verificarDebitos}
          onCheckedChange={(checked) => handleCheckboxChange('verificarDebitos', checked)}
        />
        <Label htmlFor="verificarDebitos2" className="cursor-pointer">Verificar Débitos/Créditos Aplicados no Turno Anterior</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="confirmarAtualizacaoSisp"
          checked={tasks.confirmarAtualizacaoSisp}
          onCheckedChange={(checked) => handleCheckboxChange('confirmarAtualizacaoSisp', checked)}
        />
        <Label htmlFor="confirmarAtualizacaoSisp" className="cursor-pointer">Confirmar Atualização SISP</Label>
      </div>

      <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-800">
        <h4 className="font-medium mb-2">Ficheiros INPS:</h4>
        <div className="ml-4 space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="inpsProcessar"
              checked={tasks.inpsProcessar}
              onCheckedChange={(checked) => handleCheckboxChange('inpsProcessar', checked)}
            />
            <Label htmlFor="inpsProcessar" className="cursor-pointer">Processar</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="inpsEnviarRetorno"
              checked={tasks.inpsEnviarRetorno}
              onCheckedChange={(checked) => handleCheckboxChange('inpsEnviarRetorno', checked)}
            />
            <Label htmlFor="inpsEnviarRetorno" className="cursor-pointer">Enviar Retorno</Label>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="processarTef2"
          checked={tasks.processarTef}
          onCheckedChange={(checked) => handleCheckboxChange('processarTef', checked)}
        />
        <Label htmlFor="processarTef2" className="cursor-pointer">Processar ficheiros TEF - ERR/RTR/RCT</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="processarTelecomp2"
          checked={tasks.processarTelecomp}
          onCheckedChange={(checked) => handleCheckboxChange('processarTelecomp', checked)}
        />
        <Label htmlFor="processarTelecomp2" className="cursor-pointer">Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR</Label>
      </div>

      <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-800">
        <h4 className="font-medium mb-2">Enviar Ficheiro:</h4>
        <div className="ml-4 space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="enviarEci"
              checked={tasks.enviarEci}
              onCheckedChange={(checked) => handleCheckboxChange('enviarEci', checked)}
            />
            <Label htmlFor="enviarEci" className="cursor-pointer">ECI</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="enviarEdv"
              checked={tasks.enviarEdv}
              onCheckedChange={(checked) => handleCheckboxChange('enviarEdv', checked)}
            />
            <Label htmlFor="enviarEdv" className="cursor-pointer">EDV</Label>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="validarSaco"
          checked={tasks.validarSaco}
          onCheckedChange={(checked) => handleCheckboxChange('validarSaco', checked)}
        />
        <Label htmlFor="validarSaco" className="cursor-pointer">Validar Saco 1935</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="verificarPendentes"
          checked={tasks.verificarPendentes}
          onCheckedChange={(checked) => handleCheckboxChange('verificarPendentes', checked)}
        />
        <Label htmlFor="verificarPendentes" className="cursor-pointer">Verificar Pendentes dos Balcões</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="fecharBalcoes"
          checked={tasks.fecharBalcoes}
          onCheckedChange={(checked) => handleCheckboxChange('fecharBalcoes', checked)}
        />
        <Label htmlFor="fecharBalcoes" className="cursor-pointer">Fechar os Balcoes Centrais</Label>
      </div>

      <div className="mt-6">
        <Label htmlFor="observations2">Observações</Label>
        <Textarea 
          id="observations2" 
          value={observations}
          onChange={(e) => onObservationsChange(e.target.value)}
          className="mt-2"
        />
      </div>
    </div>
  );
};
