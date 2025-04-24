import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Turno3Tasks } from '@/types/taskboard';

interface DepoisFechoTasksProps {
  tasks: Turno3Tasks;
  onTaskChange: (task: keyof Turno3Tasks, checked: boolean) => void;
  onTimeChange?: (field: string, value: string) => void;
  onSaldoChange?: (value: string) => void;
  aberturaRealTime?: string;
  saldoConta?: string;
}

export const DepoisFechoTasks: React.FC<DepoisFechoTasksProps> = ({ 
  tasks, 
  onTaskChange,
  onTimeChange,
  onSaldoChange,
  aberturaRealTime,
  saldoConta
}) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium mt-6 mb-4">Depois do Fecho</h4>
      
      <div className="space-y-2">
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="validarFicheiroCcln"
            checked={tasks.validarFicheiroCcln}
            onCheckedChange={(checked) => onTaskChange('validarFicheiroCcln', !!checked)}
          />
          <Label htmlFor="validarFicheiroCcln" className="cursor-pointer">
            Validar ficheiro CCLN - 76853
          </Label>
        </div>

        {/* Saldo da conta section */}
        <div className="flex items-center gap-4 my-4 border p-4 rounded-md">
          <Label className="min-w-[200px]">Consultar saldo da conta 18/5488102:</Label>
          <Input
            type="number"
            value={saldoConta}
            onChange={(e) => onSaldoChange?.(e.target.value)}
            className="w-40"
          />
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="saldoNegativo"
                checked={tasks.saldoNegativo}
                onCheckedChange={(checked) => onTaskChange('saldoNegativo', !!checked)}
              />
              <Label htmlFor="saldoNegativo">Negativo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="saldoPositivo"
                checked={tasks.saldoPositivo}
                onCheckedChange={(checked) => onTaskChange('saldoPositivo', !!checked)}
              />
              <Label htmlFor="saldoPositivo">Positivo</Label>
            </div>
          </div>
        </div>

        {/* Real-Time opening time */}
        <div className="flex items-center gap-4 my-4">
          <Checkbox 
            id="abrirRealTime"
            checked={tasks.abrirRealTime}
            onCheckedChange={(checked) => onTaskChange('abrirRealTime', !!checked)}
          />
          <Label htmlFor="abrirRealTime" className="cursor-pointer min-w-[200px]">
            Abrir o Real-Time com a SISP
          </Label>
          <div className="flex items-center gap-2">
            <Label htmlFor="aberturaRealTime">Abertura Real-Time:</Label>
            <Input
              id="aberturaRealTime"
              type="time"
              value={aberturaRealTime}
              onChange={(e) => onTimeChange?.('aberturaRealTime', e.target.value)}
              className="w-32"
            />
          </div>
        </div>

        {/* Continue with other tasks */}
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="verificarTransacoes"
            checked={tasks.verificarTransacoes}
            onCheckedChange={(checked) => onTaskChange('verificarTransacoes', !!checked)}
          />
          <Label htmlFor="verificarTransacoes" className="cursor-pointer">
            Verificar a entrada de transações 3100 4681
          </Label>
        </div>

        {/* Keep remaining checkboxes */}
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

        <h4 className="font-medium mt-6 mb-4">Impressões</h4>
        
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="impressaoCheques"
            checked={tasks.impressaoCheques}
            onCheckedChange={(checked) => onTaskChange('impressaoCheques', !!checked)}
          />
          <Label htmlFor="impressaoCheques" className="cursor-pointer">
            Impressão Cheques e respectivos Diários (verificação dos mesmos)
          </Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox 
            id="arquivarCheques"
            checked={tasks.arquivarCheques}
            onCheckedChange={(checked) => onTaskChange('arquivarCheques', !!checked)}
          />
          <Label htmlFor="arquivarCheques" className="cursor-pointer">
            Arquivar Cheques e respectivos Diários
          </Label>
        </div>

        <div className="mt-6">
          <Label htmlFor="situacoesPontuais" className="font-medium block mb-2">
            Situações Pontuais
          </Label>
          <div className="border-t pt-4">
            <textarea
              id="situacoesPontuais"
              className="w-full min-h-[100px] p-2 border rounded-md"
              placeholder="Digite aqui as situações pontuais..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
