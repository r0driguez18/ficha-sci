
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Turno3Tasks } from '@/types/taskboard';

interface Turno3TasksProps {
  tasks: Turno3Tasks;
  onTaskChange: (task: keyof Turno3Tasks, value: boolean | string) => void;
  observations: string;
  onObservationsChange: (value: string) => void;
}

export const Turno3TasksComponent: React.FC<Turno3TasksProps> = ({
  tasks,
  onTaskChange,
  observations,
  onObservationsChange
}) => {
  // Helper function to handle checkbox changes
  const handleCheckboxChange = (task: keyof Turno3Tasks, checked: boolean | "indeterminate") => {
    onTaskChange(task, checked === "indeterminate" ? false : Boolean(checked));
  };

  // Helper function to handle input changes for string values
  const handleInputChange = (task: keyof Turno3Tasks, value: string) => {
    onTaskChange(task, value);
  };

  return (
    <div className="space-y-2">
      <h4 className="font-medium mb-4">Operações Fecho Dia</h4>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="verificarDebitos3" 
          checked={tasks.verificarDebitos}
          onCheckedChange={(checked) => handleCheckboxChange('verificarDebitos', checked)}
        />
        <Label htmlFor="verificarDebitos3" className="cursor-pointer ml-2">Verificar Débitos/Créditos Aplicados no Turno Anterior</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="tratarTapes"
          checked={tasks.tratarTapes}
          onCheckedChange={(checked) => handleCheckboxChange('tratarTapes', checked)}
        />
        <Label htmlFor="tratarTapes" className="cursor-pointer ml-2">Tratar e trocar Tapes BM, BMBCK – percurso 7622</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="fecharServidores"
          checked={tasks.fecharServidores}
          onCheckedChange={(checked) => handleCheckboxChange('fecharServidores', checked)}
        />
        <Label htmlFor="fecharServidores" className="cursor-pointer ml-2">Fechar Servidores Teste e Produção</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="fecharImpressoras"
          checked={tasks.fecharImpressoras}
          onCheckedChange={(checked) => handleCheckboxChange('fecharImpressoras', checked)}
        />
        <Label htmlFor="fecharImpressoras" className="cursor-pointer ml-2">Fechar Impressoras e balcões centrais abertos exceto 14 - DSI</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="userFecho"
          checked={tasks.userFecho}
          onCheckedChange={(checked) => handleCheckboxChange('userFecho', checked)}
        />
        <Label htmlFor="userFecho" className="cursor-pointer ml-2">User Fecho Executar o percurso 7624 Save SYS1OB</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="listaRequisicoesCheques"
          checked={tasks.listaRequisicoesCheques}
          onCheckedChange={(checked) => handleCheckboxChange('listaRequisicoesCheques', checked)}
        />
        <Label htmlFor="listaRequisicoesCheques" className="cursor-pointer ml-2">Lista requisições de cheques do dia 7633. {"> "} do que 5, sem comprov. Estornar, 21911</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="cancelarCartoesClientes"
          checked={tasks.cancelarCartoesClientes}
          onCheckedChange={(checked) => handleCheckboxChange('cancelarCartoesClientes', checked)}
        />
        <Label htmlFor="cancelarCartoesClientes" className="cursor-pointer ml-2">User Fecho Cancela os cartões dos Clientes Bloqueados - percurso 76857</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="prepararEnviarAsc"
          checked={tasks.prepararEnviarAsc}
          onCheckedChange={(checked) => handleCheckboxChange('prepararEnviarAsc', checked)}
        />
        <Label htmlFor="prepararEnviarAsc" className="cursor-pointer ml-2">Preparar e enviar ficheiro e ASC (alteração situação cartão) – percurso 4132</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="adicionarRegistrosBanka"
          checked={tasks.adicionarRegistrosBanka}
          onCheckedChange={(checked) => handleCheckboxChange('adicionarRegistrosBanka', checked)}
        />
        <Label htmlFor="adicionarRegistrosBanka" className="cursor-pointer ml-2">User Fecho Adiciona registos na Banka Remota- percurso 768975</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="fecharServidoresBanka"
          checked={tasks.fecharServidoresBanka}
          onCheckedChange={(checked) => handleCheckboxChange('fecharServidoresBanka', checked)}
        />
        <Label htmlFor="fecharServidoresBanka" className="cursor-pointer ml-2">User Fecho, fechar servidores Banka remota IN1/IN3/IN4</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="alterarInternetBanking"
          checked={tasks.alterarInternetBanking}
          onCheckedChange={(checked) => handleCheckboxChange('alterarInternetBanking', checked)}
        />
        <Label htmlFor="alterarInternetBanking" className="cursor-pointer ml-2">User Fecho Alterar Internet Banking para OFFLINE – percurso 49161</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="prepararEnviarCsv"
          checked={tasks.prepararEnviarCsv}
          onCheckedChange={(checked) => handleCheckboxChange('prepararEnviarCsv', checked)}
        />
        <Label htmlFor="prepararEnviarCsv" className="cursor-pointer ml-2">Preparar e enviar ficheiro CSV (saldos)</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="fecharRealTime"
          checked={tasks.fecharRealTime}
          onCheckedChange={(checked) => handleCheckboxChange('fecharRealTime', checked)}
        />
        <Label htmlFor="fecharRealTime" className="cursor-pointer flex-grow ml-2">
          Interromper o Real-Time com a SISP
        </Label>
        <Input
          type="time"
          value={tasks.fecharRealTimeHora || ""}
          onChange={(e) => handleInputChange('fecharRealTimeHora', e.target.value)}
          className="w-32 ml-2"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="prepararEnviarEtr"
          checked={tasks.prepararEnviarEtr}
          onCheckedChange={(checked) => handleCheckboxChange('prepararEnviarEtr', checked)}
        />
        <Label htmlFor="prepararEnviarEtr" className="cursor-pointer ml-2">Preparar e enviar Ficheiro ETR - percurso 7538, consultar conta 18 5488103</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="fazerLoggOffAml"
          checked={tasks.fazerLoggOffAml}
          onCheckedChange={(checked) => handleCheckboxChange('fazerLoggOffAml', checked)}
        />
        <Label htmlFor="fazerLoggOffAml" className="cursor-pointer ml-2">Fazer Logg-Off do utilizador AML – Percurso 161 (utilizadores ativos)</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="aplicarFicheiroErroEtr"
          checked={tasks.aplicarFicheiroErroEtr}
          onCheckedChange={(checked) => handleCheckboxChange('aplicarFicheiroErroEtr', checked)}
        />
        <Label htmlFor="aplicarFicheiroErroEtr" className="cursor-pointer ml-2">Aplicar Ficheiro Erro ETR</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="validarBalcao14"
          checked={tasks.validarBalcao14}
          onCheckedChange={(checked) => handleCheckboxChange('validarBalcao14', checked)}
        />
        <Label htmlFor="validarBalcao14" className="cursor-pointer ml-2">Validar balção 14 7185</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="fecharBalcao14"
          checked={tasks.fecharBalcao14}
          onCheckedChange={(checked) => handleCheckboxChange('fecharBalcao14', checked)}
        />
        <Label htmlFor="fecharBalcao14" className="cursor-pointer ml-2">Fechar o balcão 14 - DSI e confirmar se todos os balcões encontram-se fechados</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="arranqueManual"
          checked={tasks.arranqueManual}
          onCheckedChange={(checked) => handleCheckboxChange('arranqueManual', checked)}
        />
        <Label htmlFor="arranqueManual" className="cursor-pointer ml-2">Arranque Manual - Verificar Data da Aplicação – Percurso 431</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="inicioFecho"
          checked={tasks.inicioFecho}
          onCheckedChange={(checked) => handleCheckboxChange('inicioFecho', checked)}
        />
        <Label htmlFor="inicioFecho" className="cursor-pointer flex-grow ml-2">
          Início do Fecho
        </Label>
        <Input
          type="time"
          value={tasks.inicioFechoHora || ""}
          onChange={(e) => handleInputChange('inicioFechoHora', e.target.value)}
          className="w-32 ml-2"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="validarEnvioEmail"
          checked={tasks.validarEnvioEmail}
          onCheckedChange={(checked) => handleCheckboxChange('validarEnvioEmail', checked)}
        />
        <Label htmlFor="validarEnvioEmail" className="cursor-pointer ml-2">Validar envio email (Notificação Inicio Fecho) a partir do ISeries</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="controlarTrabalhos"
          checked={tasks.controlarTrabalhos}
          onCheckedChange={(checked) => handleCheckboxChange('controlarTrabalhos', checked)}
        />
        <Label htmlFor="controlarTrabalhos" className="cursor-pointer ml-2">Controlar os trabalhos no QBATCH (opções 5, 10, F10, F5, F18)</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="saveBmbck"
          checked={tasks.saveBmbck}
          onCheckedChange={(checked) => handleCheckboxChange('saveBmbck', checked)}
        />
        <Label htmlFor="saveBmbck" className="cursor-pointer ml-2">Save BMBCK – Automático</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="abrirServidoresInternet"
          checked={tasks.abrirServidoresInternet}
          onCheckedChange={(checked) => handleCheckboxChange('abrirServidoresInternet', checked)}
        />
        <Label htmlFor="abrirServidoresInternet" className="cursor-pointer ml-2">Abrir Servidores Internet Banking – Percurso 161–</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="imprimirCheques"
          checked={tasks.imprimirCheques}
          onCheckedChange={(checked) => handleCheckboxChange('imprimirCheques', checked)}
        />
        <Label htmlFor="imprimirCheques" className="cursor-pointer ml-2">Imprimir Cheques e Diários de Cheques (depois do Save BMBCK)</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="backupBm"
          checked={tasks.backupBm}
          onCheckedChange={(checked) => handleCheckboxChange('backupBm', checked)}
        />
        <Label htmlFor="backupBm" className="cursor-pointer ml-2">Backup BM – Automático</Label>
      </div>

      <h4 className="font-medium mt-6 mb-4">Depois do Fecho</h4>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="validarFicheiroCcln"
          checked={tasks.validarFicheiroCcln}
          onCheckedChange={(checked) => handleCheckboxChange('validarFicheiroCcln', checked)}
        />
        <Label htmlFor="validarFicheiroCcln" className="cursor-pointer ml-2">Validar ficheiro CCLN - 76853</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="aplicarFicheirosCompensacao"
          checked={tasks.aplicarFicheirosCompensacao}
          onCheckedChange={(checked) => handleCheckboxChange('aplicarFicheirosCompensacao', checked)}
        />
        <Label htmlFor="aplicarFicheirosCompensacao" className="cursor-pointer ml-2">Aplicar ficheiros compensação SISP (CCLN, EDST, EORI, ERMB)</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="validarSaldoConta"
          checked={tasks.validarSaldoConta}
          onCheckedChange={(checked) => handleCheckboxChange('validarSaldoConta', checked)}
        />
        <Label htmlFor="validarSaldoConta" className="cursor-pointer flex-grow ml-2">
          Validar saldo da conta 18/5488102:
        </Label>
        <Input
          type="text"
          value={tasks.saldoContaValor || ""}
          onChange={(e) => handleInputChange('saldoContaValor', e.target.value)}
          className="w-32 ml-2"
          placeholder="0.00"
        />
      </div>
      
      <div className="ml-6 flex space-x-4 mb-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="saldoNegativo"
            checked={tasks.saldoNegativo}
            onCheckedChange={(checked) => handleCheckboxChange('saldoNegativo', checked)}
          />
          <Label htmlFor="saldoNegativo" className="cursor-pointer">Negativo</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="saldoPositivo"
            checked={tasks.saldoPositivo}
            onCheckedChange={(checked) => handleCheckboxChange('saldoPositivo', checked)}
          />
          <Label htmlFor="saldoPositivo" className="cursor-pointer">Positivo</Label>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="abrirRealTime"
          checked={tasks.abrirRealTime}
          onCheckedChange={(checked) => handleCheckboxChange('abrirRealTime', checked)}
        />
        <Label htmlFor="abrirRealTime" className="cursor-pointer flex-grow ml-2">
          Abrir o Real-Time
        </Label>
        <Input
          type="time"
          value={tasks.abrirRealTimeHora || ""}
          onChange={(e) => handleInputChange('abrirRealTimeHora', e.target.value)}
          className="w-32 ml-2"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="verificarTransacoes"
          checked={tasks.verificarTransacoes}
          onCheckedChange={(checked) => handleCheckboxChange('verificarTransacoes', checked)}
        />
        <Label htmlFor="verificarTransacoes" className="cursor-pointer ml-2">Verificar a entrada de transações 3100 4681</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="aplicarFicheiroVisa"
          checked={tasks.aplicarFicheiroVisa}
          onCheckedChange={(checked) => handleCheckboxChange('aplicarFicheiroVisa', checked)}
        />
        <Label htmlFor="aplicarFicheiroVisa" className="cursor-pointer ml-2">Aplicar ficheiro VISA DAF - com o user FECHO 4131</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="cativarCartoes"
          checked={tasks.cativarCartoes}
          onCheckedChange={(checked) => handleCheckboxChange('cativarCartoes', checked)}
        />
        <Label htmlFor="cativarCartoes" className="cursor-pointer ml-2">Cativar cartões de crédito em incumprimento - com o user FECHO – 7675</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="abrirBcaDireto"
          checked={tasks.abrirBcaDireto}
          onCheckedChange={(checked) => handleCheckboxChange('abrirBcaDireto', checked)}
        />
        <Label htmlFor="abrirBcaDireto" className="cursor-pointer ml-2">Abrir o BCADireto percurso 49162 – Validar transações</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="abrirServidoresBanka"
          checked={tasks.abrirServidoresBanka}
          onCheckedChange={(checked) => handleCheckboxChange('abrirServidoresBanka', checked)}
        />
        <Label htmlFor="abrirServidoresBanka" className="cursor-pointer ml-2">User Fecho, Abril servidores Banka remota IN1/IN3/IN4</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="atualizarTelefonesOffline"
          checked={tasks.atualizarTelefonesOffline}
          onCheckedChange={(checked) => handleCheckboxChange('atualizarTelefonesOffline', checked)}
        />
        <Label htmlFor="atualizarTelefonesOffline" className="cursor-pointer ml-2">Atualiza Telefones tratados no OFFLINE- percurso 768976</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="verificarReplicacao"
          checked={tasks.verificarReplicacao}
          onCheckedChange={(checked) => handleCheckboxChange('verificarReplicacao', checked)}
        />
        <Label htmlFor="verificarReplicacao" className="cursor-pointer ml-2">Verificar Replicação</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="enviarFicheiroCsv"
          checked={tasks.enviarFicheiroCsv}
          onCheckedChange={(checked) => handleCheckboxChange('enviarFicheiroCsv', checked)}
        />
        <Label htmlFor="enviarFicheiroCsv" className="cursor-pointer ml-2">Enviar ficheiro CSV (Comunicação Saldo Véspera)</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="transferirFicheirosLiquidity"
          checked={tasks.transferirFicheirosLiquidity}
          onCheckedChange={(checked) => handleCheckboxChange('transferirFicheirosLiquidity', checked)}
        />
        <Label htmlFor="transferirFicheirosLiquidity" className="cursor-pointer ml-2">Transferência ficheiros SSM Liquidity Exercices (Confirmação)</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="percurso76921"
          checked={tasks.percurso76921}
          onCheckedChange={(checked) => handleCheckboxChange('percurso76921', checked)}
        />
        <Label htmlFor="percurso76921" className="cursor-pointer ml-2">Fazer o percurso 76921 – Limpeza Ficheiro BRLOGED (Dia 1 de cada Mês)</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="percurso76922"
          checked={tasks.percurso76922}
          onCheckedChange={(checked) => handleCheckboxChange('percurso76922', checked)}
        />
        <Label htmlFor="percurso76922" className="cursor-pointer ml-2">Fazer o percurso 76922 - Reorganiza BRLOGED (Dia 2 de cada Mês)</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="percurso76923"
          checked={tasks.percurso76923}
          onCheckedChange={(checked) => handleCheckboxChange('percurso76923', checked)}
        />
        <Label htmlFor="percurso76923" className="cursor-pointer ml-2">Fazer o percurso 76923 - Reorganiza GBMVCO (Dia 3 de cada Mês)</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="abrirServidoresTesteProducao"
          checked={tasks.abrirServidoresTesteProducao}
          onCheckedChange={(checked) => handleCheckboxChange('abrirServidoresTesteProducao', checked)}
        />
        <Label htmlFor="abrirServidoresTesteProducao" className="cursor-pointer ml-2">Abrir Servidores Teste e Produção</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="impressaoCheques"
          checked={tasks.impressaoCheques}
          onCheckedChange={(checked) => handleCheckboxChange('impressaoCheques', checked)}
        />
        <Label htmlFor="impressaoCheques" className="cursor-pointer ml-2">Impressão Cheques e respectivos Diários (verificação dos mesmos)</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="arquivarCheques"
          checked={tasks.arquivarCheques}
          onCheckedChange={(checked) => handleCheckboxChange('arquivarCheques', checked)}
        />
        <Label htmlFor="arquivarCheques" className="cursor-pointer ml-2">Arquivar Cheques e respectivos Diários</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="terminoFecho"
          checked={tasks.terminoFecho}
          onCheckedChange={(checked) => handleCheckboxChange('terminoFecho', checked)}
        />
        <Label htmlFor="terminoFecho" className="cursor-pointer flex-grow ml-2">
          Término do Fecho
        </Label>
        <Input
          type="time"
          value={tasks.terminoFechoHora || ""}
          onChange={(e) => handleInputChange('terminoFechoHora', e.target.value)}
          className="w-32 ml-2"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="transferirFicheirosDsi"
          checked={tasks.transferirFicheirosDsi}
          onCheckedChange={(checked) => handleCheckboxChange('transferirFicheirosDsi', checked)}
        />
        <Label htmlFor="transferirFicheirosDsi" className="cursor-pointer ml-2">Transferência ficheiros SSM Liquidity ExercicesDSI-CI/2023</Label>
      </div>
      
      <div className="mt-6">
        <Label htmlFor="observations3">Observaçes</Label>
        <Textarea 
          id="observations3" 
          value={observations}
          onChange={(e) => onObservationsChange(e.target.value)}
          className="mt-2"
        />
      </div>
    </div>
  );
};
