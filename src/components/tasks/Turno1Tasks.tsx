
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Turno1Tasks } from '@/types/taskboard';

interface Turno1TasksProps {
  tasks: Turno1Tasks;
  onTaskChange: (task: keyof Turno1Tasks, checked: boolean) => void;
  observations: string;
  onObservationsChange: (value: string) => void;
}

export const Turno1TasksComponent: React.FC<Turno1TasksProps> = ({ 
  tasks, 
  onTaskChange,
  observations,
  onObservationsChange 
}) => {
  return (
    <div className="space-y-4 text-black">
      <div className="flex items-start space-x-2">
        <Checkbox id="datacenter1" checked={tasks.datacenter} onCheckedChange={(c) => onTaskChange('datacenter', !!c)} />
        <Label htmlFor="datacenter1" className="cursor-pointer text-black font-medium">Verificar Alarmes e Sistemas/Climatização DATA CENTER</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox id="sistemas1" checked={tasks.sistemas} onCheckedChange={(c) => onTaskChange('sistemas', !!c)} />
        <Label htmlFor="sistemas1" className="cursor-pointer text-black">Verificar Sistemas: BCACV1 / BCACV2</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox id="servicos1" checked={tasks.servicos} onCheckedChange={(c) => onTaskChange('servicos', !!c)} />
        <Label htmlFor="servicos1" className="cursor-pointer text-black">Verificar Serviços Vinti4/BCADirecto/Replicação/ Servidor MIA</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox id="abrirServidores" checked={tasks.abrirServidores} onCheckedChange={(c) => onTaskChange('abrirServidores', !!c)} />
        <Label htmlFor="abrirServidores" className="cursor-pointer text-black">Abrir Servidores (PFS, SWIFT, OPDIF, TRMSG, CDGOV)</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox id="percurso76931" checked={tasks.percurso76931} onCheckedChange={(c) => onTaskChange('percurso76931', !!c)} />
        <Label htmlFor="percurso76931" className="cursor-pointer text-black font-semibold">Percurso 76931 - Atualiza os alertas nos clientes com dados desatualizados</Label>
      </div>

      <div className="flex items-center space-x-2 ml-1">
        <Checkbox id="percurso76857_master" checked={tasks.percurso76857} onCheckedChange={(c) => onTaskChange('percurso76857', !!c)} />
        <Label htmlFor="percurso76857_master" className="cursor-pointer text-black font-medium">Percurso 76857 -</Label>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Label htmlFor="p76857_7h30" className="cursor-pointer text-black">7h30</Label>
            <Checkbox id="p76857_7h30" checked={tasks.percurso76857_7h30} onCheckedChange={(c) => onTaskChange('percurso76857_7h30', !!c)} />
          </div>
          <div className="flex items-center space-x-1">
            <Label htmlFor="p76857_10h" className="cursor-pointer text-black">10h</Label>
            <Checkbox id="p76857_10h" checked={tasks.percurso76857_10h} onCheckedChange={(c) => onTaskChange('percurso76857_10h', !!c)} />
          </div>
          <div className="flex items-center space-x-1">
            <Label htmlFor="p76857_12h" className="cursor-pointer text-black">12h</Label>
            <Checkbox id="p76857_12h" checked={tasks.percurso76857_12h} onCheckedChange={(c) => onTaskChange('percurso76857_12h', !!c)} />
          </div>
        </div>
      </div>
      
      <div className="border rounded-md p-3 bg-gray-50 flex items-center space-x-4 flex-wrap gap-y-3 gap-x-6">
        <div className="flex items-center space-x-2">
          <Checkbox id="enviar" checked={tasks.enviar} onCheckedChange={(c) => onTaskChange('enviar', !!c)} />
          <Label htmlFor="enviar" className="cursor-pointer font-bold text-black">Enviar:</Label>
        </div>
        <div className="flex items-center space-x-1">
          <Label htmlFor="etr" className="cursor-pointer text-black">ETR</Label>
          <Checkbox id="etr" checked={tasks.etr} onCheckedChange={(c) => onTaskChange('etr', !!c)} />
        </div>
        <div className="flex items-center space-x-1">
          <Label htmlFor="impostos" className="cursor-pointer text-black">Impostos</Label>
          <Checkbox id="impostos" checked={tasks.impostos} onCheckedChange={(c) => onTaskChange('impostos', !!c)} />
        </div>
        <div className="flex items-center space-x-1">
          <Label htmlFor="inpsExtrato" className="cursor-pointer text-black">INPS/Extrato</Label>
          <Checkbox id="inpsExtrato" checked={tasks.inpsExtrato} onCheckedChange={(c) => onTaskChange('inpsExtrato', !!c)} />
        </div>
        <div className="flex items-center space-x-1">
          <Label htmlFor="vistoUsa" className="cursor-pointer text-black">Visto USA</Label>
          <Checkbox id="vistoUsa" checked={tasks.vistoUsa} onCheckedChange={(c) => onTaskChange('vistoUsa', !!c)} />
        </div>
        <div className="flex items-center space-x-1">
          <Label htmlFor="ben" className="cursor-pointer text-black">BEN</Label>
          <Checkbox id="ben" checked={tasks.ben} onCheckedChange={(c) => onTaskChange('ben', !!c)} />
        </div>
        <div className="flex items-center space-x-1">
          <Label htmlFor="bcta" className="cursor-pointer text-black">BCTA</Label>
          <Checkbox id="bcta" checked={tasks.bcta} onCheckedChange={(c) => onTaskChange('bcta', !!c)} />
        </div>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="enviarReportes" checked={tasks.enviarReportes} onCheckedChange={(c) => onTaskChange('enviarReportes', !!c)} />
        <Label htmlFor="enviarReportes" className="cursor-pointer text-black">Enviar Reportes (INPS, Visto USA, BCV, IMPC)</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="verificarRecepcaoSisp" checked={tasks.verificarRecepcaoSisp} onCheckedChange={(c) => onTaskChange('verificarRecepcaoSisp', !!c)} />
        <Label htmlFor="verificarRecepcaoSisp" className="cursor-pointer text-black">Verificar Sequencia Ficheiros - SISP:</Label>
        <div className="flex items-center space-x-4 ml-4">
          <div className="flex items-center space-x-1">
            <Label htmlFor="verificarAsc" className="cursor-pointer text-black">ASC</Label>
            <Checkbox id="verificarAsc" checked={tasks.verificarAsc} onCheckedChange={(checked) => onTaskChange('verificarAsc', !!checked)} />
          </div>
          <div className="flex items-center space-x-1">
            <Label htmlFor="verificarCsv" className="cursor-pointer text-black">CSV</Label>
            <Checkbox id="verificarCsv" checked={tasks.verificarCsv} onCheckedChange={(checked) => onTaskChange('verificarCsv', !!checked)} />
          </div>
          <div className="flex items-center space-x-1">
            <Label htmlFor="verificarEci" className="cursor-pointer text-black">ECI</Label>
            <Checkbox id="verificarEci" checked={tasks.verificarEci} onCheckedChange={(checked) => onTaskChange('verificarEci', !!checked)} />
          </div>
        </div>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox id="verificarDebitos" checked={tasks.verificarDebitos} onCheckedChange={(c) => onTaskChange('verificarDebitos', !!c)} />
        <Label htmlFor="verificarDebitos" className="cursor-pointer text-black">Verificar Débitos/Créditos Aplicados no dia Anterior</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="validacaoDigitalizacao" checked={tasks.validacaoDigitalizacaoFichaDiaria} onCheckedChange={(c) => onTaskChange('validacaoDigitalizacaoFichaDiaria', !!c)} />
        <Label htmlFor="validacaoDigitalizacao" className="cursor-pointer text-black">Validação e digitalização Ficha Diária dia Anterior</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox id="processarTef" checked={tasks.processarTef} onCheckedChange={(c) => onTaskChange('processarTef', !!c)} />
        <Label htmlFor="processarTef" className="cursor-pointer text-black">Processar Ficheiros TEF – RTR/RCT/ERR</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox id="processarTelecomp" checked={tasks.processarTelecomp} onCheckedChange={(c) => onTaskChange('processarTelecomp', !!c)} />
        <Label htmlFor="processarTelecomp" className="cursor-pointer text-black">Processar Ficheiros Telecompensação – RCB/RTC/FCT/IMR</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox id="envioVisa" checked={tasks.envioFicheirosVisa12h30} onCheckedChange={(c) => onTaskChange('envioFicheirosVisa12h30', !!c)} />
        <Label htmlFor="envioVisa" className="cursor-pointer text-black font-semibold">Envio Ficheiros VISA (12h30)</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox id="enviarSegundoEtr" checked={tasks.enviarSegundoEtr} onCheckedChange={(c) => onTaskChange('enviarSegundoEtr', !!c)} />
        <Label htmlFor="enviarSegundoEtr" className="cursor-pointer text-black">Enviar 2º Ficheiro ETR (13 horas)</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="enviarFicheiroCom" checked={tasks.enviarFicheiroCom} onCheckedChange={(c) => onTaskChange('enviarFicheiroCom', !!c)} />
        <Label htmlFor="enviarFicheiroCom" className="cursor-pointer text-black">Preparar e enviar ficheiro COM, dias:</Label>
        <div className="flex items-center space-x-4 ml-4">
          <div className="flex items-center space-x-1">
            <Label htmlFor="dia01" className="cursor-pointer text-black">01</Label>
            <Checkbox id="dia01" checked={tasks.dia01} onCheckedChange={(c) => onTaskChange('dia01', !!c)} />
          </div>
          <div className="flex items-center space-x-1">
            <Label htmlFor="dia08" className="cursor-pointer text-black">08</Label>
            <Checkbox id="dia08" checked={tasks.dia08} onCheckedChange={(c) => onTaskChange('dia08', !!c)} />
          </div>
          <div className="flex items-center space-x-1">
            <Label htmlFor="dia16" className="cursor-pointer text-black">16</Label>
            <Checkbox id="dia16" checked={tasks.dia16} onCheckedChange={(c) => onTaskChange('dia16', !!c)} />
          </div>
          <div className="flex items-center space-x-1">
            <Label htmlFor="dia23" className="cursor-pointer text-black">23</Label>
            <Checkbox id="dia23" checked={tasks.dia23} onCheckedChange={(c) => onTaskChange('dia23', !!c)} />
          </div>
        </div>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox id="atualizarCentralRisco" checked={tasks.atualizarCentralRisco} onCheckedChange={(c) => onTaskChange('atualizarCentralRisco', !!c)} />
        <Label htmlFor="atualizarCentralRisco" className="cursor-pointer text-black">Atualização Nº Central de Risco (todas as Sextas-feiras)</Label>
      </div>

      {/* Backups Diferidos */}
      <div className="mt-8">
        <div className="flex items-center space-x-2 mb-2">
          <Label className="font-bold underline text-md">Backups Diferidos</Label>
        </div>
        <div className="ml-4 space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox id="bmjrn" checked={tasks.bmjrn} onCheckedChange={(c) => onTaskChange('bmjrn', !!c)} />
            <Label htmlFor="bmjrn" className="cursor-pointer text-black font-bold">BMJRN <span className="font-normal">(2 tapes/alterar 1 por mês/inicializar no inicio do mês)</span></Label>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox id="grjrcv" checked={tasks.grjrcv} onCheckedChange={(c) => onTaskChange('grjrcv', !!c)} />
            <Label htmlFor="grjrcv" className="cursor-pointer text-black font-bold">GRJRCV <span className="font-normal">(1 tape)</span></Label>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox id="aujrn" checked={tasks.aujrn} onCheckedChange={(c) => onTaskChange('aujrn', !!c)} />
            <Label htmlFor="aujrn" className="cursor-pointer text-black font-bold">AUJRN <span className="font-normal">(1tape)</span></Label>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox id="mvdia1" checked={tasks.mvdia1} onCheckedChange={(c) => onTaskChange('mvdia1', !!c)} />
            <Label htmlFor="mvdia1" className="cursor-pointer text-black font-bold">MVDIA1 <span className="font-normal">(eliminar obj. após save</span> <span className="font-bold underline">N</span><span className="font-normal">)</span></Label>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox id="mvdia2" checked={tasks.mvdia2} onCheckedChange={(c) => onTaskChange('mvdia2', !!c)} />
            <Label htmlFor="mvdia2" className="cursor-pointer text-black font-bold">MVDIA2 <span className="font-normal">(eliminar obj. após save</span> <span className="font-bold underline">S</span><span className="font-normal">)</span></Label>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox id="brjrn" checked={tasks.brjrn} onCheckedChange={(c) => onTaskChange('brjrn', !!c)} />
            <Label htmlFor="brjrn" className="cursor-pointer text-black font-bold">BRJRN <span className="font-normal">(1tape)</span></Label>
          </div>
        </div>
      </div>

      {/* Operações Semanais / Mensais */}
      <div className="mt-8 border-t pt-6 border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Label className="font-bold underline text-md">Operações Semanais / Mensais</Label>
        </div>
        <div className="ml-4 space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox id="restoreBm" checked={tasks.restoreBmBcaCv2} onCheckedChange={(c) => onTaskChange('restoreBmBcaCv2', !!c)} />
            <Label htmlFor="restoreBm" className="cursor-pointer text-black"><span className="font-bold">Restore</span> BM BCACV2</Label>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox id="duptapBm" checked={tasks.duptapBmSemBcaCv2} onCheckedChange={(c) => onTaskChange('duptapBmSemBcaCv2', !!c)} />
            <Label htmlFor="duptapBm" className="cursor-pointer text-black"><span className="font-bold">DUPTAP</span> BMSEM BCACV2</Label>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox id="diferidosBmmes" checked={tasks.diferidosBmmes} onCheckedChange={(c) => onTaskChange('diferidosBmmes', !!c)} />
            <Label htmlFor="diferidosBmmes" className="cursor-pointer text-black">Diferidos <span className="font-bold">BMMES</span></Label>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Label htmlFor="observations1" className="text-black">Observações</Label>
        <Textarea 
          id="observations1" 
          value={observations}
          onChange={(e) => onObservationsChange(e.target.value)}
          className="mt-2 text-black"
        />
      </div>
    </div>
  );
};
