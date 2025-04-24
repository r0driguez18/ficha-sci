import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Turno3Tasks } from '@/types/taskboard';

interface DepoisFechoTasksProps {
  tasks: Turno3Tasks;
  onTaskChange: (task: keyof Turno3Tasks, checked: boolean) => void;
}

export const DepoisFechoTasks: React.FC<DepoisFechoTasksProps> = ({ tasks, onTaskChange }) => {
  return (
    <div className="space-y-2">
      <div className="flex flex-col space-y-4">
        <h4 className="font-medium mt-6 mb-4">Depois do Fecho</h4>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="inicioFecho">Início do Fecho</Label>
            <Input type="time" id="inicioFecho" className="w-full" />
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="fimFecho">Fim do Fecho</Label>
            <Input type="time" id="fimFecho" className="w-full" />
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <Label htmlFor="saldoConta">Consultar saldo da conta 18/5488102</Label>
          <Input 
            type="number" 
            id="saldoConta" 
            className="w-full" 
            placeholder="Digite o saldo"
            step="0.01"
          />
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="validarFicheiroCcln"
            checked={tasks.validarFicheiroCcln}
            onCheckedChange={(checked) => onTaskChange('validarFicheiroCcln', !!checked)}
          />
          <Label htmlFor="validarFicheiroCcln" className="cursor-pointer">Validar ficheiro CCLN - 76853</Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="aplicarFicheirosCompensacao"
            checked={tasks.aplicarFicheirosCompensacao}
            onCheckedChange={(checked) => onTaskChange('aplicarFicheirosCompensacao', !!checked)}
          />
          <Label htmlFor="aplicarFicheirosCompensacao" className="cursor-pointer">Aplicar ficheiros compensação SISP (CCLN, EDST, EORI, ERMB)</Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="validarSaldoConta"
            checked={tasks.validarSaldoConta}
            onCheckedChange={(checked) => onTaskChange('validarSaldoConta', !!checked)}
          />
          <Label htmlFor="validarSaldoConta" className="cursor-pointer">Consultar saldo da conta 18/5488102:</Label>
        </div>

        <div className="ml-6 flex space-x-4 mb-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="saldoNegativo"
              checked={tasks.saldoNegativo}
              onCheckedChange={(checked) => onTaskChange('saldoNegativo', !!checked)}
            />
            <Label htmlFor="saldoNegativo" className="cursor-pointer">Negativo</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="saldoPositivo"
              checked={tasks.saldoPositivo}
              onCheckedChange={(checked) => onTaskChange('saldoPositivo', !!checked)}
            />
            <Label htmlFor="saldoPositivo" className="cursor-pointer">Positivo</Label>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="abrirRealTime"
            checked={tasks.abrirRealTime}
            onCheckedChange={(checked) => onTaskChange('abrirRealTime', !!checked)}
          />
          <Label htmlFor="abrirRealTime" className="cursor-pointer">Abrir o Real-Time com a SISP</Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="verificarTransacoes"
            checked={tasks.verificarTransacoes}
            onCheckedChange={(checked) => onTaskChange('verificarTransacoes', !!checked)}
          />
          <Label htmlFor="verificarTransacoes" className="cursor-pointer">Verificar a entrada de transações 3100 4681</Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="aplicarFicheiroVisa"
            checked={tasks.aplicarFicheiroVisa}
            onCheckedChange={(checked) => onTaskChange('aplicarFicheiroVisa', !!checked)}
          />
          <Label htmlFor="aplicarFicheiroVisa" className="cursor-pointer">Aplicar ficheiro VISA DAF - com o user FECHO 4131</Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="cativarCartoes"
            checked={tasks.cativarCartoes}
            onCheckedChange={(checked) => onTaskChange('cativarCartoes', !!checked)}
          />
          <Label htmlFor="cativarCartoes" className="cursor-pointer">Cativar cartões de crédito em incumprimento - com o user FECHO – 7675</Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="abrirBcaDireto"
            checked={tasks.abrirBcaDireto}
            onCheckedChange={(checked) => onTaskChange('abrirBcaDireto', !!checked)}
          />
          <Label htmlFor="abrirBcaDireto" className="cursor-pointer">Abrir o BCADireto percurso 49162 – Validar transações</Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="abrirServidoresBanka"
            checked={tasks.abrirServidoresBanka}
            onCheckedChange={(checked) => onTaskChange('abrirServidoresBanka', !!checked)}
          />
          <Label htmlFor="abrirServidoresBanka" className="cursor-pointer">User Fecho, Abril servidores Banka remota IN1/IN3/IN4</Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="atualizarTelefonesOffline"
            checked={tasks.atualizarTelefonesOffline}
            onCheckedChange={(checked) => onTaskChange('atualizarTelefonesOffline', !!checked)}
          />
          <Label htmlFor="atualizarTelefonesOffline" className="cursor-pointer">Atualiza Telefones tratados no OFFLINE- percurso 768976</Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="verificarReplicacao"
            checked={tasks.verificarReplicacao}
            onCheckedChange={(checked) => onTaskChange('verificarReplicacao', !!checked)}
          />
          <Label htmlFor="verificarReplicacao" className="cursor-pointer">Verificar Replicação</Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="enviarFicheiroCsv"
            checked={tasks.enviarFicheiroCsv}
            onCheckedChange={(checked) => onTaskChange('enviarFicheiroCsv', !!checked)}
          />
          <Label htmlFor="enviarFicheiroCsv" className="cursor-pointer">Enviar ficheiro CSV (Comunicação Saldo Véspera)</Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="transferirFicheirosLiquidity"
            checked={tasks.transferirFicheirosLiquidity}
            onCheckedChange={(checked) => onTaskChange('transferirFicheirosLiquidity', !!checked)}
          />
          <Label htmlFor="transferirFicheirosLiquidity" className="cursor-pointer">Transferência ficheiros SSM Liquidity Exercices (Confirmação)</Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="percurso76921"
            checked={tasks.percurso76921}
            onCheckedChange={(checked) => onTaskChange('percurso76921', !!checked)}
          />
          <Label htmlFor="percurso76921" className="cursor-pointer">Fazer o percurso 76921 – Limpeza Ficheiro BRLOGED (Dia 1 de cada Mês)</Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="percurso76922"
            checked={tasks.percurso76922}
            onCheckedChange={(checked) => onTaskChange('percurso76922', !!checked)}
          />
          <Label htmlFor="percurso76922" className="cursor-pointer">Fazer o percurso 76922 - Reorganiza BRLOGED (Dia 2 de cada Mês)</Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="percurso76923"
            checked={tasks.percurso76923}
            onCheckedChange={(checked) => onTaskChange('percurso76923', !!checked)}
          />
          <Label htmlFor="percurso76923" className="cursor-pointer">Fazer o percurso 76923 - Reorganiza GBMVCO (Dia 3 de cada Mês)</Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="abrirServidoresTesteProducao"
            checked={tasks.abrirServidoresTesteProducao}
            onCheckedChange={(checked) => onTaskChange('abrirServidoresTesteProducao', !!checked)}
          />
          <Label htmlFor="abrirServidoresTesteProducao" className="cursor-pointer">Abrir Servidores Teste e Produção</Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="terminoFecho"
            checked={tasks.terminoFecho}
            onCheckedChange={(checked) => onTaskChange('terminoFecho', !!checked)}
          />
          <Label htmlFor="terminoFecho" className="cursor-pointer">Término do Fecho</Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="transferirFicheirosDsi"
            checked={tasks.transferirFicheirosDsi}
            onCheckedChange={(checked) => onTaskChange('transferirFicheirosDsi', !!checked)}
          />
          <Label htmlFor="transferirFicheirosDsi" className="cursor-pointer">Transferência ficheiros SSM Liquidity Exercices</Label>
        </div>

        <h4 className="font-medium mt-6 mb-4">Impressões</h4>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="impressaoCheques"
            checked={tasks.impressaoCheques}
            onCheckedChange={(checked) => onTaskChange('impressaoCheques', !!checked)}
          />
          <Label htmlFor="impressaoCheques" className="cursor-pointer">Impressão Cheques e respectivos Diários (verificação dos mesmos)</Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="arquivarCheques"
            checked={tasks.arquivarCheques}
            onCheckedChange={(checked) => onTaskChange('arquivarCheques', !!checked)}
          />
          <Label htmlFor="arquivarCheques" className="cursor-pointer">Arquivar Cheques e respectivos Diários</Label>
        </div>
      </div>
    </div>
  );
};
