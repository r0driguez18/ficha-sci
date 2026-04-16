
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Turno2Tasks } from '@/types/taskboard';
import { Checkbox } from "@/components/ui/checkbox";

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
  return (
    <div className="space-y-4 text-black">
      <div className="flex items-start space-x-2">
        <Checkbox id="datacenter2" checked={tasks.datacenter} onCheckedChange={(c) => onTaskChange('datacenter', !!c)} />
        <Label htmlFor="datacenter2" className="cursor-pointer text-black font-medium">Verificar Alarmes e Sistemas/Climatização DATA CENTER</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox id="sistemas2" checked={tasks.sistemas} onCheckedChange={(c) => onTaskChange('sistemas', !!c)} />
        <Label htmlFor="sistemas2" className="cursor-pointer text-black">Verificar Sistemas: BCACV1 / BCACV2</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="servicos2" checked={tasks.servicos} onCheckedChange={(c) => onTaskChange('servicos', !!c)} />
        <Label htmlFor="servicos2" className="cursor-pointer text-black">Verificar Serviços Vinti4/BCADirecto/Replicação/ Servidor MIA</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="verificarReportes2" checked={tasks.verificarReportes} onCheckedChange={(c) => onTaskChange('verificarReportes', !!c)} />
        <Label htmlFor="verificarReportes2" className="cursor-pointer text-black">Verificar Envio de Reportes (INPS, Visto USA, BCV, IMPC)</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="verificarDebitos2" checked={tasks.verificarDebitos} onCheckedChange={(c) => onTaskChange('verificarDebitos', !!c)} />
        <Label htmlFor="verificarDebitos2" className="cursor-pointer text-black">Verificar Débitos/Créditos Aplicados no Turno Anterior</Label>
      </div>

      <div className="flex items-center space-x-2 ml-1">
        <Checkbox id="percurso76857_m2" checked={tasks.percurso76857} onCheckedChange={(c) => onTaskChange('percurso76857', !!c)} />
        <Label htmlFor="percurso76857_m2" className="cursor-pointer text-black font-medium mr-2">Percurso 76857 –</Label>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Label htmlFor="p76857_14h" className="cursor-pointer text-black">14h</Label>
            <Checkbox id="p76857_14h" checked={tasks.percurso76857_14h} onCheckedChange={(c) => onTaskChange('percurso76857_14h', !!c)} />
          </div>
          <div className="flex items-center space-x-1">
            <Label htmlFor="p76857_16h" className="cursor-pointer text-black">16h</Label>
            <Checkbox id="p76857_16h" checked={tasks.percurso76857_16h} onCheckedChange={(c) => onTaskChange('percurso76857_16h', !!c)} />
          </div>
          <div className="flex items-center space-x-1">
            <Label htmlFor="p76857_19h" className="cursor-pointer text-black">19h</Label>
            <Checkbox id="p76857_19h" checked={tasks.percurso76857_19h} onCheckedChange={(c) => onTaskChange('percurso76857_19h', !!c)} />
          </div>
        </div>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="inpsRetorno" checked={tasks.inpsEnviarRetorno} onCheckedChange={(c) => onTaskChange('inpsEnviarRetorno', !!c)} />
        <Label htmlFor="inpsRetorno" className="cursor-pointer text-black">Processar e enviar os ficheiros retorno do INPS</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="processarTef2" checked={tasks.processarTef} onCheckedChange={(c) => onTaskChange('processarTef', !!c)} />
        <Label htmlFor="processarTef2" className="cursor-pointer text-black font-medium">Processar Ficheiros TEF – RTR/RCT/ERR</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="processarTelecomp2" checked={tasks.processarTelecomp} onCheckedChange={(c) => onTaskChange('processarTelecomp', !!c)} />
        <Label htmlFor="processarTelecomp2" className="cursor-pointer text-black font-medium">Processar Ficheiros Telecompensação – RCB/RTC/FCT/IMR</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="rececaoFicheirosVisaVss" checked={tasks.rececaoFicheirosVisaVss} onCheckedChange={(c) => onTaskChange('rececaoFicheirosVisaVss', !!c)} />
        <Label htmlFor="rececaoFicheirosVisaVss" className="cursor-pointer text-black">Receção ficheiros VISA (VSS)</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="enviarEciEdv" checked={tasks.enviarEciEdv} onCheckedChange={(c) => onTaskChange('enviarEciEdv', !!c)} />
        <Label htmlFor="enviarEciEdv" className="cursor-pointer text-black">Enviar Ficheiro <span className="font-bold">ECI/EDV</span></Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="confirmarAtualizacaoFicheiros" checked={tasks.confirmarAtualizacaoFicheiros} onCheckedChange={(c) => onTaskChange('confirmarAtualizacaoFicheiros', !!c)} />
        <Label htmlFor="confirmarAtualizacaoFicheiros" className="cursor-pointer text-black">Confirmar Atualização Ficheiros Enviados à SISP <span className="font-bold">(ECI * ENV/IMA)</span></Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="envioFicheirosVisaPafCaf" checked={tasks.envioFicheirosVisaPafCaf} onCheckedChange={(c) => onTaskChange('envioFicheirosVisaPafCaf', !!c)} />
        <Label htmlFor="envioFicheirosVisaPafCaf" className="cursor-pointer text-black">Envio Ficheiros <span className="font-bold">VISA (PAF e CAF)</span></Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="verificarPendentes" checked={tasks.verificarPendentes} onCheckedChange={(c) => onTaskChange('verificarPendentes', !!c)} />
        <Label htmlFor="verificarPendentes" className="cursor-pointer text-black">Verificar Pendentes dos Balcões abertos</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="validarSaco" checked={tasks.validarSaco} onCheckedChange={(c) => onTaskChange('validarSaco', !!c)} />
        <Label htmlFor="validarSaco" className="cursor-pointer text-black">Validar Contas Saco – Percurso 1935</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="fecharBalcoes" checked={tasks.fecharBalcoes} onCheckedChange={(c) => onTaskChange('fecharBalcoes', !!c)} />
        <Label htmlFor="fecharBalcoes" className="cursor-pointer text-black">Fechar os Balcões Centrais</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="verificarSistemas_fim" checked={tasks.verificarSistemas2} onCheckedChange={(c) => onTaskChange('verificarSistemas2', !!c)} />
        <Label htmlFor="verificarSistemas_fim" className="cursor-pointer text-black">Verificar Sistemas: <span className="font-bold">BCACV1 / BCACV2 / Replicação</span></Label>
      </div>

      <div className="pt-6 mt-4 border-t border-gray-200">
        <Label htmlFor="observations2" className="text-sm font-semibold text-black uppercase tracking-wide">Outras Intervenções/Observações/Comunicações/Ocorrências</Label>
        <Textarea 
          id="observations2" 
          value={observations}
          onChange={(e) => onObservationsChange(e.target.value)}
          className="mt-3 min-h-[100px]"
          placeholder="Adicione observações..."
        />
      </div>
    </div>
  );
};
