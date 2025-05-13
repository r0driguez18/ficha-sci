
import React from 'react';
import { CheckboxField } from './CheckboxField';
import { TimeCheckboxField } from './TimeCheckboxField';
import { SaldoContaField } from './SaldoContaField';

interface DepoisDoFechoProps {
  tasks: {
    validarFicheiroCcln: boolean;
    aplicarFicheirosCompensacao: boolean;
    validarSaldoConta: boolean;
    saldoContaValor: string;
    saldoNegativo: boolean;
    saldoPositivo: boolean;
    abrirRealTime: boolean;
    abrirRealTimeHora: string;
    verificarTransacoes: boolean;
    aplicarFicheiroVisa: boolean;
    cativarCartoes: boolean;
    abrirBcaDireto: boolean;
    abrirServidoresBanka: boolean;
    atualizarTelefonesOffline: boolean;
    verificarReplicacao: boolean;
    enviarFicheiroCsv: boolean;
    transferirFicheirosLiquidity: boolean;
    percurso76921: boolean;
    percurso76922: boolean;
    percurso76923: boolean;
    abrirServidoresTesteProducao: boolean;
    impressaoCheques: boolean;
    arquivarCheques: boolean;
    terminoFecho: boolean;
    terminoFechoHora: string;
    limparGbtrlog: boolean; // New task field
    transferirFicheirosDsi: boolean;
  };
  onTaskChange: (task: string, value: boolean | string) => void;
}

export const DepoisDoFecho: React.FC<DepoisDoFechoProps> = ({
  tasks,
  onTaskChange
}) => {
  // Helper function to handle checkbox changes
  const handleCheckboxChange = (task: string, checked: boolean | "indeterminate") => {
    onTaskChange(task, checked === "indeterminate" ? false : Boolean(checked));
  };

  return (
    <div className="space-y-2">
      <h4 className="font-medium mt-6 mb-4">Depois do Fecho</h4>
      
      <CheckboxField 
        id="validarFicheiroCcln" 
        checked={tasks.validarFicheiroCcln}
        onCheckedChange={(checked) => handleCheckboxChange('validarFicheiroCcln', checked)}
        label="Validar ficheiro CCLN - 76853"
      />
      
      <CheckboxField 
        id="aplicarFicheirosCompensacao" 
        checked={tasks.aplicarFicheirosCompensacao}
        onCheckedChange={(checked) => handleCheckboxChange('aplicarFicheirosCompensacao', checked)}
        label="Aplicar ficheiros compensação SISP (CCLN, EDST, EORI, ERMB)"
      />
      
      <SaldoContaField
        checked={tasks.validarSaldoConta}
        saldoValue={tasks.saldoContaValor}
        saldoNegativo={tasks.saldoNegativo}
        saldoPositivo={tasks.saldoPositivo}
        onCheckedChange={(checked) => handleCheckboxChange('validarSaldoConta', checked)}
        onSaldoValueChange={(value) => onTaskChange('saldoContaValor', value)}
        onSaldoNegativoChange={(checked) => handleCheckboxChange('saldoNegativo', checked)}
        onSaldoPositivoChange={(checked) => handleCheckboxChange('saldoPositivo', checked)}
      />
      
      <TimeCheckboxField
        id="abrirRealTime"
        checked={tasks.abrirRealTime}
        timeValue={tasks.abrirRealTimeHora}
        onCheckedChange={(checked) => handleCheckboxChange('abrirRealTime', checked)}
        onTimeChange={(value) => onTaskChange('abrirRealTimeHora', value)}
        label="Abrir o Real-Time"
      />
      
      <CheckboxField 
        id="verificarTransacoes" 
        checked={tasks.verificarTransacoes}
        onCheckedChange={(checked) => handleCheckboxChange('verificarTransacoes', checked)}
        label="Verificar a entrada de transações 3100 4681"
      />
      
      <CheckboxField 
        id="aplicarFicheiroVisa" 
        checked={tasks.aplicarFicheiroVisa}
        onCheckedChange={(checked) => handleCheckboxChange('aplicarFicheiroVisa', checked)}
        label="Aplicar ficheiro VISA DAF - com o user FECHO 4131"
      />
      
      <CheckboxField 
        id="cativarCartoes" 
        checked={tasks.cativarCartoes}
        onCheckedChange={(checked) => handleCheckboxChange('cativarCartoes', checked)}
        label="Cativar cartões de crédito em incumprimento - com o user FECHO – 7675"
      />
      
      <CheckboxField 
        id="abrirBcaDireto" 
        checked={tasks.abrirBcaDireto}
        onCheckedChange={(checked) => handleCheckboxChange('abrirBcaDireto', checked)}
        label="Abrir o BCADireto percurso 49162 – Validar transações"
      />
      
      <CheckboxField 
        id="abrirServidoresBanka" 
        checked={tasks.abrirServidoresBanka}
        onCheckedChange={(checked) => handleCheckboxChange('abrirServidoresBanka', checked)}
        label="User Fecho, Abril servidores Banka remota IN1/IN3/IN4"
      />
      
      <CheckboxField 
        id="atualizarTelefonesOffline" 
        checked={tasks.atualizarTelefonesOffline}
        onCheckedChange={(checked) => handleCheckboxChange('atualizarTelefonesOffline', checked)}
        label="Atualiza Telefones tratados no OFFLINE- percurso 768976"
      />
      
      <CheckboxField 
        id="verificarReplicacao" 
        checked={tasks.verificarReplicacao}
        onCheckedChange={(checked) => handleCheckboxChange('verificarReplicacao', checked)}
        label="Verificar Replicação"
      />
      
      <CheckboxField 
        id="enviarFicheiroCsv" 
        checked={tasks.enviarFicheiroCsv}
        onCheckedChange={(checked) => handleCheckboxChange('enviarFicheiroCsv', checked)}
        label="Enviar ficheiro CSV (Comunicação Saldo Véspera)"
      />
      
      <CheckboxField 
        id="transferirFicheirosLiquidity" 
        checked={tasks.transferirFicheirosLiquidity}
        onCheckedChange={(checked) => handleCheckboxChange('transferirFicheirosLiquidity', checked)}
        label="Transferência ficheiros SSM Liquidity Exercices (Confirmação)"
      />
      
      <CheckboxField 
        id="percurso76921" 
        checked={tasks.percurso76921}
        onCheckedChange={(checked) => handleCheckboxChange('percurso76921', checked)}
        label="Fazer o percurso 76921 – Limpeza Ficheiro BRLOGED (Dia 1 de cada Mês)"
      />
      
      <CheckboxField 
        id="percurso76922" 
        checked={tasks.percurso76922}
        onCheckedChange={(checked) => handleCheckboxChange('percurso76922', checked)}
        label="Fazer o percurso 76922 - Reorganiza BRLOGED (Dia 2 de cada Mês)"
      />
      
      <CheckboxField 
        id="percurso76923" 
        checked={tasks.percurso76923}
        onCheckedChange={(checked) => handleCheckboxChange('percurso76923', checked)}
        label="Fazer o percurso 76923 - Reorganiza GBMVCO (Dia 3 de cada Mês)"
      />
      
      <CheckboxField 
        id="abrirServidoresTesteProducao" 
        checked={tasks.abrirServidoresTesteProducao}
        onCheckedChange={(checked) => handleCheckboxChange('abrirServidoresTesteProducao', checked)}
        label="Abrir Servidores Teste e Produção"
      />
      
      <CheckboxField 
        id="impressaoCheques" 
        checked={tasks.impressaoCheques}
        onCheckedChange={(checked) => handleCheckboxChange('impressaoCheques', checked)}
        label="Impressão Cheques e respectivos Diários (verificação dos mesmos)"
      />
      
      <CheckboxField 
        id="arquivarCheques" 
        checked={tasks.arquivarCheques}
        onCheckedChange={(checked) => handleCheckboxChange('arquivarCheques', checked)}
        label="Arquivar Cheques e respectivos Diários"
      />
      
      <TimeCheckboxField
        id="terminoFecho"
        checked={tasks.terminoFecho}
        timeValue={tasks.terminoFechoHora}
        onCheckedChange={(checked) => handleCheckboxChange('terminoFecho', checked)}
        onTimeChange={(value) => onTaskChange('terminoFechoHora', value)}
        label="Término do Fecho"
      />
      
      <CheckboxField 
        id="limparGbtrlog" 
        checked={tasks.limparGbtrlog}
        onCheckedChange={(checked) => handleCheckboxChange('limparGbtrlog', checked)}
        label="Chamar Opção 16 - Limpa GBTRLOG Após o Fecho"
      />
      
      <CheckboxField 
        id="transferirFicheirosDsi" 
        checked={tasks.transferirFicheirosDsi}
        onCheckedChange={(checked) => handleCheckboxChange('transferirFicheirosDsi', checked)}
        label="Transferência ficheiros SSM Liquidity ExercicesDSI-CI/2023"
      />
    </div>
  );
};
