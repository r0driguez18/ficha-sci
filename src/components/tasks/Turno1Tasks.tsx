
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
    <div className="space-y-2 text-black">
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="datacenter1" 
          checked={tasks.datacenter}
          onCheckedChange={(checked) => onTaskChange('datacenter', !!checked)}
          className="border-black text-black"
        />
        <Label htmlFor="datacenter1" className="cursor-pointer text-black">Verificar Alarmes e Sistemas/Climatização DATA CENTER</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="sistemas1"
          checked={tasks.sistemas}
          onCheckedChange={(checked) => onTaskChange('sistemas', !!checked)}
          className="border-black text-black"
        />
        <Label htmlFor="sistemas1" className="cursor-pointer text-black">Verificar Sistemas: BCACV1/BCACV2</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="servicos1"
          checked={tasks.servicos}
          onCheckedChange={(checked) => onTaskChange('servicos', !!checked)}
          className="border-black text-black"
        />
        <Label htmlFor="servicos1" className="cursor-pointer text-black">Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="abrirServidores"
          checked={tasks.abrirServidores}
          onCheckedChange={(checked) => onTaskChange('abrirServidores', !!checked)}
          className="border-black text-black"
        />
        <Label htmlFor="abrirServidores" className="cursor-pointer text-black">Abrir Servidores (SWIFT, OPDIF, TRMSG, CDGOV, AML)</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="percurso76931"
          checked={tasks.percurso76931}
          onCheckedChange={(checked) => onTaskChange('percurso76931', !!checked)}
          className="border-black text-black"
        />
        <Label htmlFor="percurso76931" className="cursor-pointer text-black">Percurso 76931 - Atualiza os alertas nos clientes com dados desatualizados</Label>
      </div>
      
      <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="enviar"
            checked={tasks.enviar}
            onCheckedChange={(checked) => onTaskChange('enviar', !!checked)}
            className="border-black text-black"
          />
          <Label htmlFor="enviar" className="cursor-pointer font-medium text-black">Enviar:</Label>
        </div>
        <div className="flex flex-wrap gap-4 mt-2 ml-6">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="etr"
              checked={tasks.etr}
              onCheckedChange={(checked) => onTaskChange('etr', !!checked)}
              className="border-black text-black"
            />
            <Label htmlFor="etr" className="cursor-pointer text-black">ETR</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="impostos"
              checked={tasks.impostos}
              onCheckedChange={(checked) => onTaskChange('impostos', !!checked)}
              className="border-black text-black"
            />
            <Label htmlFor="impostos" className="cursor-pointer text-black">Impostos</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="inpsExtrato"
              checked={tasks.inpsExtrato}
              onCheckedChange={(checked) => onTaskChange('inpsExtrato', !!checked)}
              className="border-black text-black"
            />
            <Label htmlFor="inpsExtrato" className="cursor-pointer text-black">INPS/Extrato</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="vistoUsa"
              checked={tasks.vistoUsa}
              onCheckedChange={(checked) => onTaskChange('vistoUsa', !!checked)}
              className="border-black text-black"
            />
            <Label htmlFor="vistoUsa" className="cursor-pointer text-black">Visto USA</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="ben"
              checked={tasks.ben}
              onCheckedChange={(checked) => onTaskChange('ben', !!checked)}
              className="border-black text-black"
            />
            <Label htmlFor="ben" className="cursor-pointer text-black">BEN</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="bcta"
              checked={tasks.bcta}
              onCheckedChange={(checked) => onTaskChange('bcta', !!checked)}
              className="border-black text-black"
            />
            <Label htmlFor="bcta" className="cursor-pointer text-black">BCTA</Label>
          </div>
        </div>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="verificarDebitos"
          checked={tasks.verificarDebitos}
          onCheckedChange={(checked) => onTaskChange('verificarDebitos', !!checked)}
          className="border-black text-black"
        />
        <Label htmlFor="verificarDebitos" className="cursor-pointer text-black">Verificar Débitos/Créditos aplicados no dia Anterior</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox 
          id="enviarReportes"
          checked={tasks.enviarReportes}
          onCheckedChange={(checked) => onTaskChange('enviarReportes', !!checked)}
          className="border-black text-black"
        />
        <Label htmlFor="enviarReportes" className="cursor-pointer text-black">Enviar Reportes (INPS, Visto USA, BCV, IMPC)</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox 
          id="verificarRecepcaoSisp"
          checked={tasks.verificarRecepcaoSisp}
          onCheckedChange={(checked) => onTaskChange('verificarRecepcaoSisp', !!checked)}
          className="border-black text-black"
        />
        <Label htmlFor="verificarRecepcaoSisp" className="cursor-pointer text-black">
          Verificar Recep. dos Ficheiros Enviados à SISP: 
          <span className="inline-flex items-center ml-2 space-x-4">
            <span className="flex items-center">
              <Checkbox 
                id="verificarAsc"
                checked={tasks.verificarAsc}
                onCheckedChange={(checked) => onTaskChange('verificarAsc', !!checked)}
                className="mr-1 border-black text-black"
              />
              <Label htmlFor="verificarAsc" className="cursor-pointer text-black">ASC</Label>
            </span>
            <span className="flex items-center">
              <Checkbox 
                id="verificarCsv"
                checked={tasks.verificarCsv}
                onCheckedChange={(checked) => onTaskChange('verificarCsv', !!checked)}
                className="mr-1 border-black text-black"
              />
              <Label htmlFor="verificarCsv" className="cursor-pointer text-black">CSV</Label>
            </span>
            <span className="flex items-center">
              <Checkbox 
                id="verificarEci"
                checked={tasks.verificarEci}
                onCheckedChange={(checked) => onTaskChange('verificarEci', !!checked)}
                className="mr-1 border-black text-black"
              />
              <Label htmlFor="verificarEci" className="cursor-pointer text-black">ECI</Label>
            </span>
          </span>
        </Label>
      </div>

      <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="backupsDiferidos"
            checked={tasks.backupsDiferidos}
            onCheckedChange={(checked) => onTaskChange('backupsDiferidos', !!checked)}
            className="border-black text-black"
          />
          <Label htmlFor="backupsDiferidos" className="cursor-pointer font-medium text-black">Backups Diferidos:</Label>
        </div>
        <div className="ml-6 mt-2 space-y-2">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="bmjrn"
              checked={tasks.bmjrn}
              onCheckedChange={(checked) => onTaskChange('bmjrn', !!checked)}
              className="border-black text-black"
            />
            <Label htmlFor="bmjrn" className="cursor-pointer text-black">BMJRN (2 tapes/alterar 1 por mês/inicializar no inicio do mês)</Label>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="grjrcv"
              checked={tasks.grjrcv}
              onCheckedChange={(checked) => onTaskChange('grjrcv', !!checked)}
              className="border-black text-black"
            />
            <Label htmlFor="grjrcv" className="cursor-pointer text-black">GRJRCV (1 tape)</Label>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="aujrn"
              checked={tasks.aujrn}
              onCheckedChange={(checked) => onTaskChange('aujrn', !!checked)}
              className="border-black text-black"
            />
            <Label htmlFor="aujrn" className="cursor-pointer text-black">AUJRN (1tape)</Label>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="mvdia1"
              checked={tasks.mvdia1}
              onCheckedChange={(checked) => onTaskChange('mvdia1', !!checked)}
              className="border-black text-black"
            />
            <Label htmlFor="mvdia1" className="cursor-pointer text-black">MVDIA1 (eliminar obj. após save N)</Label>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="mvdia2"
              checked={tasks.mvdia2}
              onCheckedChange={(checked) => onTaskChange('mvdia2', !!checked)}
              className="border-black text-black"
            />
            <Label htmlFor="mvdia2" className="cursor-pointer text-black">MVDIA2 (eliminar obj. após save S)</Label>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="brjrn"
              checked={tasks.brjrn}
              onCheckedChange={(checked) => onTaskChange('brjrn', !!checked)}
              className="border-black text-black"
            />
            <Label htmlFor="brjrn" className="cursor-pointer text-black">BRJRN (1tape)</Label>
          </div>
        </div>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="processarTef"
          checked={tasks.processarTef}
          onCheckedChange={(checked) => onTaskChange('processarTef', !!checked)}
          className="border-black text-black"
        />
        <Label htmlFor="processarTef" className="cursor-pointer text-black">Processar ficheiros TEF - ERR/RTR/RCT</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="processarTelecomp"
          checked={tasks.processarTelecomp}
          onCheckedChange={(checked) => onTaskChange('processarTelecomp', !!checked)}
          className="border-black text-black"
        />
        <Label htmlFor="processarTelecomp" className="cursor-pointer text-black">Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="enviarSegundoEtr"
          checked={tasks.enviarSegundoEtr}
          onCheckedChange={(checked) => onTaskChange('enviarSegundoEtr', !!checked)}
          className="border-black text-black"
        />
        <Label htmlFor="enviarSegundoEtr" className="cursor-pointer text-black">Enviar 2º Ficheiro ETR (13h:30)</Label>
      </div>
      
      <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="enviarFicheiroCom"
            checked={tasks.enviarFicheiroCom}
            onCheckedChange={(checked) => onTaskChange('enviarFicheiroCom', !!checked)}
            className="border-black text-black"
          />
          <Label htmlFor="enviarFicheiroCom" className="cursor-pointer font-medium text-black">Enviar Ficheiro COM, dias:</Label>
        </div>
        <div className="flex flex-wrap gap-4 mt-2 ml-6">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="dia01"
              checked={tasks.dia01}
              onCheckedChange={(checked) => onTaskChange('dia01', !!checked)}
              className="border-black text-black"
            />
            <Label htmlFor="dia01" className="cursor-pointer text-black">01</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="dia08"
              checked={tasks.dia08}
              onCheckedChange={(checked) => onTaskChange('dia08', !!checked)}
              className="border-black text-black"
            />
            <Label htmlFor="dia08" className="cursor-pointer text-black">08</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="dia16"
              checked={tasks.dia16}
              onCheckedChange={(checked) => onTaskChange('dia16', !!checked)}
              className="border-black text-black"
            />
            <Label htmlFor="dia16" className="cursor-pointer text-black">16</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="dia23"
              checked={tasks.dia23}
              onCheckedChange={(checked) => onTaskChange('dia23', !!checked)}
              className="border-black text-black"
            />
            <Label htmlFor="dia23" className="cursor-pointer text-black">23</Label>
          </div>
        </div>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="atualizarCentralRisco"
          checked={tasks.atualizarCentralRisco}
          onCheckedChange={(checked) => onTaskChange('atualizarCentralRisco', !!checked)}
          className="border-black text-black"
        />
        <Label htmlFor="atualizarCentralRisco" className="cursor-pointer text-black">Atualizar Nº Central de Risco (Todas as Sextas-Feiras)</Label>
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
