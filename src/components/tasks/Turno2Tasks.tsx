
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Turno2Tasks } from '@/types/taskboard';
import { CheckboxField } from './turno3/CheckboxField';

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
  const handleCheckboxChange = (task: keyof Turno2Tasks, checked: boolean | "indeterminate") => {
    onTaskChange(task, checked === 'indeterminate' ? false : Boolean(checked));
  };

  return (
    <div className="space-y-5">
      {/* Verificações */}
      <div className="rounded-lg border p-4 space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Verificações</h4>
        <CheckboxField 
          id="datacenter2" 
          checked={tasks.datacenter}
          onCheckedChange={(checked) => handleCheckboxChange('datacenter', checked)}
          label="Verificar Alarmes e Sistemas/Climatização DATA CENTER"
        />
        <CheckboxField
          id="sistemas2"
          checked={tasks.sistemas}
          onCheckedChange={(checked) => handleCheckboxChange('sistemas', checked)}
          label="Verificar Sistemas: BCACV1/BCACV2"
        />
        <CheckboxField
          id="servicos2"
          checked={tasks.servicos}
          onCheckedChange={(checked) => handleCheckboxChange('servicos', checked)}
          label="Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA"
        />
        <CheckboxField
          id="verificarReportes"
          checked={tasks.verificarReportes}
          onCheckedChange={(checked) => handleCheckboxChange('verificarReportes', checked)}
          label="Verificar envio de reportes(INPS, VISTO USA, BCV, IMPC)"
        />
        <CheckboxField
          id="verificarDebitos2"
          checked={tasks.verificarDebitos}
          onCheckedChange={(checked) => handleCheckboxChange('verificarDebitos', checked)}
          label="Verificar Débitos/Créditos Aplicados no Turno Anterior"
        />
      </div>

      {/* Ficheiros INPS */}
      <div className="rounded-lg border p-4 space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Ficheiros INPS</h4>
        <CheckboxField
          id="inpsProcessar"
          checked={tasks.inpsProcessar}
          onCheckedChange={(checked) => handleCheckboxChange('inpsProcessar', checked)}
          label="Processar"
        />
        <CheckboxField
          id="inpsEnviarRetorno"
          checked={tasks.inpsEnviarRetorno}
          onCheckedChange={(checked) => handleCheckboxChange('inpsEnviarRetorno', checked)}
          label="Enviar Retorno"
        />
      </div>

      {/* Processamento */}
      <div className="rounded-lg border p-4 space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Processamento</h4>
        <CheckboxField
          id="processarTef2"
          checked={tasks.processarTef}
          onCheckedChange={(checked) => handleCheckboxChange('processarTef', checked)}
          label="Processar ficheiros TEF - ERR/RTR/RCT"
        />
        <CheckboxField
          id="processarTelecomp2"
          checked={tasks.processarTelecomp}
          onCheckedChange={(checked) => handleCheckboxChange('processarTelecomp', checked)}
          label="Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR"
        />
      </div>

      {/* Enviar Ficheiro */}
      <div className="rounded-lg border p-4 space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Enviar Ficheiro</h4>
        <CheckboxField
          id="enviarEci"
          checked={tasks.enviarEci}
          onCheckedChange={(checked) => handleCheckboxChange('enviarEci', checked)}
          label="ECI"
        />
        <CheckboxField
          id="enviarEdv"
          checked={tasks.enviarEdv}
          onCheckedChange={(checked) => handleCheckboxChange('enviarEdv', checked)}
          label="EDV"
        />
      </div>

      {/* Operações finais */}
      <div className="rounded-lg border p-4 space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Operações Finais</h4>
        <CheckboxField
          id="confirmarAtualizacaoFicheiros"
          checked={tasks.confirmarAtualizacaoFicheiros}
          onCheckedChange={(checked) => handleCheckboxChange('confirmarAtualizacaoFicheiros', checked)}
          label="Confirmar Atualização Ficheiros Enviados à SISP (ECI * ENV/IMA)"
        />
        <CheckboxField
          id="validarSaco"
          checked={tasks.validarSaco}
          onCheckedChange={(checked) => handleCheckboxChange('validarSaco', checked)}
          label="Validar Saco 1935"
        />
        <CheckboxField
          id="verificarPendentes"
          checked={tasks.verificarPendentes}
          onCheckedChange={(checked) => handleCheckboxChange('verificarPendentes', checked)}
          label="Verificar Pendentes dos Balcões"
        />
        <CheckboxField
          id="fecharBalcoes"
          checked={tasks.fecharBalcoes}
          onCheckedChange={(checked) => handleCheckboxChange('fecharBalcoes', checked)}
          label="Fechar os Balcoes Centrais"
        />
      </div>

      <div className="pt-2">
        <Label htmlFor="observations2" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observações</Label>
        <Textarea 
          id="observations2" 
          value={observations}
          onChange={(e) => onObservationsChange(e.target.value)}
          className="mt-1.5"
          placeholder="Adicione observações..."
        />
      </div>
    </div>
  );
};
