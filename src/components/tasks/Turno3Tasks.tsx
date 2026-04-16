
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Turno3Tasks } from '@/types/taskboard';

interface Turno3TasksProps {
  tasks: Turno3Tasks;
  onTaskChange: (task: keyof Turno3Tasks, value: boolean | string) => void;
  observations: string;
  onObservationsChange: (value: string) => void;
  isEndOfMonth?: boolean;
}

export const Turno3TasksComponent: React.FC<Turno3TasksProps> = ({
  tasks,
  onTaskChange,
  observations,
  onObservationsChange,
  isEndOfMonth = false
}) => {
  return (
    <div className="space-y-4 text-black pb-10">
      <h3 className="font-bold text-lg mb-2 text-primary uppercase">OPERAÇÕES FECHO DIA</h3>

      <div className="flex items-start space-x-2">
        <Checkbox id="datacenter3" checked={tasks.datacenter} onCheckedChange={(c) => onTaskChange('datacenter', !!c)} />
        <Label htmlFor="datacenter3" className="cursor-pointer font-medium">Verificar Alarmes e Sistemas/Climatização <span className="font-bold tracking-wide">DATA CENTER</span></Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="sistemas3" checked={tasks.sistemas} onCheckedChange={(c) => onTaskChange('sistemas', !!c)} />
        <Label htmlFor="sistemas3" className="cursor-pointer">Verificar Sistemas: <span className="font-bold">BCACV1 / BCACV2 - Verificar Replicação</span></Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="verificarDebitos3" checked={tasks.verificarDebitos} onCheckedChange={(c) => onTaskChange('verificarDebitos', !!c)} />
        <Label htmlFor="verificarDebitos3" className="cursor-pointer">Verificar Débitos/Créditos Aplicados no Turno Anterior</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="tratarTapes" checked={tasks.tratarTapes} onCheckedChange={(c) => onTaskChange('tratarTapes', !!c)} />
        <Label htmlFor="tratarTapes" className="cursor-pointer">Tratar Tapes BM, BMBCK –7622 e Confirmar estado tapes no robot</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="fecharServidores" checked={tasks.fecharServidores} onCheckedChange={(c) => onTaskChange('fecharServidores', !!c)} />
        <Label htmlFor="fecharServidores" className="cursor-pointer">Fechar Servidores <span className="font-bold">SWIFT, STPCV, OPDIF, TRMSG, CDGOV MWEXT e AML</span></Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="fecharImpressoras" checked={tasks.fecharImpressoras} onCheckedChange={(c) => onTaskChange('fecharImpressoras', !!c)} />
        <Label htmlFor="fecharImpressoras" className="cursor-pointer">Fechar Impressoras e balcões centrais abertos exceto 14 DSI e 22 DMC</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="requisicoesCheques" checked={tasks.requisicoesCheques} onCheckedChange={(c) => onTaskChange('requisicoesCheques', !!c)} />
        <Label htmlFor="requisicoesCheques" className="cursor-pointer">Requisições cheques do dia 7633. Estornar se superior a 5, sem pedido balcão, 21911</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="gerarFicheiroAsc" checked={tasks.gerarFicheiroAsc} onCheckedChange={(c) => onTaskChange('gerarFicheiroAsc', !!c)} />
        <Label htmlFor="gerarFicheiroAsc" className="cursor-pointer">Gerar e enviar ficheiro e ASC – percurso 4132 / Validar sequência portal SISP</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="fecharBalcao22" checked={tasks.fecharBalcao22} onCheckedChange={(c) => onTaskChange('fecharBalcao22', !!c)} />
        <Label htmlFor="fecharBalcao22" className="cursor-pointer">Fechar balcão 22 DMC (Pedir utilizadores para saírem do sistema) (23h00)</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="userFecho7624" checked={tasks.userFecho7624} onCheckedChange={(c) => onTaskChange('userFecho7624', !!c)} />
        <Label htmlFor="userFecho7624" className="cursor-pointer">User Fecho Executar o percurso 7624 Save SYS1OB (23h00)</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="userFechoBankaRemota" checked={tasks.userFechoBankaRemota} onCheckedChange={(c) => onTaskChange('userFechoBankaRemota', !!c)} />
        <Label htmlFor="userFechoBankaRemota" className="cursor-pointer">User Fecho Adiciona registos na Banka Remota- percurso 768975</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="userFechoServidoresBanka" checked={tasks.userFechoServidoresBanka} onCheckedChange={(c) => onTaskChange('userFechoServidoresBanka', !!c)} />
        <Label htmlFor="userFechoServidoresBanka" className="cursor-pointer">User Fecho, fechar servidores Banka Remota IN1/IN3/IN4</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="userFechoInternetBanking" checked={tasks.userFechoInternetBanking} onCheckedChange={(c) => onTaskChange('userFechoInternetBanking', !!c)} />
        <Label htmlFor="userFechoInternetBanking" className="cursor-pointer">User Fecho Alterar Internet Banking para OFFLINE – percurso 49161</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="fecharPfs" checked={tasks.fecharPfs} onCheckedChange={(c) => onTaskChange('fecharPfs', !!c)} />
        <Label htmlFor="fecharPfs" className="cursor-pointer">Fechar Servidores <span className="font-bold">PFS</span></Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="prepararCsv" checked={tasks.prepararCsv} onCheckedChange={(c) => onTaskChange('prepararCsv', !!c)} />
        <Label htmlFor="prepararCsv" className="cursor-pointer">Preparar e enviar ficheiro CSV (saldos)</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="interromperRealTime" checked={tasks.interromperRealTime} onCheckedChange={(c) => onTaskChange('interromperRealTime', !!c)} />
        <div className="flex items-center">
          <Label htmlFor="interromperRealTime" className="cursor-pointer mr-3">
            Interromper o Real-Time com a SISP
          </Label>
          <span className="text-sm font-medium">Fecho Real-Time:</span>
          <Input 
            className="w-20 h-7 mx-2 shadow-inner border-gray-300 [&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-calendar-picker-indicator]:hidden" 
            type="time" 
            value={tasks.interromperRealTimeHora || ''}
            onChange={(e) => onTaskChange('interromperRealTimeHora', e.target.value)} 
          />
        </div>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="percurso768989" checked={tasks.percurso768989} onCheckedChange={(c) => onTaskChange('percurso768989', !!c)} />
        <Label htmlFor="percurso768989" className="cursor-pointer underline font-medium">Percurso 768989 (Alterar fecho transferências de 2 para 1)</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="prepararFicheiroEtr" checked={tasks.prepararFicheiroEtr} onCheckedChange={(c) => onTaskChange('prepararFicheiroEtr', !!c)} />
        <Label htmlFor="prepararFicheiroEtr" className="cursor-pointer">Preparar e enviar Ficheiro ETR - percurso 7538, consultar conta 18 5488103</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="loggOffUtilizadores" checked={tasks.loggOffUtilizadores} onCheckedChange={(c) => onTaskChange('loggOffUtilizadores', !!c)} />
        <Label htmlFor="loggOffUtilizadores" className="cursor-pointer">Fazer Logg-Off utilizadores AML PFS, MWEXT</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="aplicarFicheiroErro" checked={tasks.aplicarFicheiroErro} onCheckedChange={(c) => onTaskChange('aplicarFicheiroErro', !!c)} />
        <Label htmlFor="aplicarFicheiroErro" className="cursor-pointer">Aplicar Ficheiro Erro ETR</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="validarBalcao14" checked={tasks.validarBalcao14} onCheckedChange={(c) => onTaskChange('validarBalcao14', !!c)} />
        <Label htmlFor="validarBalcao14" className="cursor-pointer">Validar balcão 14 7185</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="bloquearNearsoft" checked={tasks.bloquearNearsoft} onCheckedChange={(c) => onTaskChange('bloquearNearsoft', !!c)} />
        <Label htmlFor="bloquearNearsoft" className="cursor-pointer">Bloquear NEARSOFT e Remover Utilizadores ativos</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="fecharBalcao14" checked={tasks.fecharBalcao14} onCheckedChange={(c) => onTaskChange('fecharBalcao14', !!c)} />
        <Label htmlFor="fecharBalcao14" className="cursor-pointer">Fechar o balcão 14 - DSI e confirmar se todos os balcões encontram-se fechados</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="percurso43" checked={tasks.percurso43} onCheckedChange={(c) => onTaskChange('percurso43', !!c)} />
        <Label htmlFor="percurso43" className="cursor-pointer">Percurso 43 Verificar Data da Aplicação</Label>
      </div>

      <div className="flex items-center space-x-2 ml-1 mt-4">
        <Checkbox id="inicioFecho" checked={tasks.inicioFecho} onCheckedChange={(c) => onTaskChange('inicioFecho', !!c)} />
        <div className="flex items-center">
          <Label htmlFor="inicioFecho" className="cursor-pointer font-bold mr-2">
            Início do Fecho
          </Label>
          <Input 
            className="w-20 h-7 mx-2 shadow-inner border-gray-300 [&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-calendar-picker-indicator]:hidden" 
            type="time" 
            value={tasks.inicioFechoHora || ''}
            onChange={(e) => onTaskChange('inicioFechoHora', e.target.value)} 
          />
        </div>
      </div>

      <div className="flex items-start space-x-2 mt-2">
        <Checkbox id="enviarSmsArranque" checked={tasks.enviarSmsArranque} onCheckedChange={(c) => onTaskChange('enviarSmsArranque', !!c)} />
        <Label htmlFor="enviarSmsArranque" className="cursor-pointer font-bold underline">Enviar SMS de Notificação de Arranque do Fecho</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="validarEnvioEmail" checked={tasks.validarEnvioEmail} onCheckedChange={(c) => onTaskChange('validarEnvioEmail', !!c)} />
        <Label htmlFor="validarEnvioEmail" className="cursor-pointer">Validar envio email (Notificação Inicio Fecho) a partir do ISeries</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="controlarTrabalhos" checked={tasks.controlarTrabalhos} onCheckedChange={(c) => onTaskChange('controlarTrabalhos', !!c)} />
        <Label htmlFor="controlarTrabalhos" className="cursor-pointer">Controlar os trabalhos no QBATCH (opções 5, 10, F10, F5, F18)</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="paragemAberturaServidores" checked={tasks.paragemAberturaServidores} onCheckedChange={(c) => onTaskChange('paragemAberturaServidores', !!c)} />
        <Label htmlFor="paragemAberturaServidores" className="cursor-pointer">Paragem abertura Servidores Banka Remota CT2/IAR/INT/IV2</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="ativarNearsoft" checked={tasks.ativarNearsoft} onCheckedChange={(c) => onTaskChange('ativarNearsoft', !!c)} />
        <Label htmlFor="ativarNearsoft" className="cursor-pointer font-bold">Ativar NEARSOFT</Label>
      </div>

      {/* CONTINUAÇÃO PÁGINA 2 */}

      <div className="flex items-start space-x-2">
        <Checkbox id="saveBmbck" checked={tasks.saveBmbck} onCheckedChange={(c) => onTaskChange('saveBmbck', !!c)} />
        <Label htmlFor="saveBmbck" className="cursor-pointer">Save BMBCK – Automático</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="imprimirCheques" checked={tasks.imprimirCheques} onCheckedChange={(c) => onTaskChange('imprimirCheques', !!c)} />
        <Label htmlFor="imprimirCheques" className="cursor-pointer">Imprimir Cheques, Diários de Cheques e Arquivar OUTQ(HLDSPOOL)</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="backupBm" checked={tasks.backupBm} onCheckedChange={(c) => onTaskChange('backupBm', !!c)} />
        <Label htmlFor="backupBm" className="cursor-pointer">Backup BM – Automático</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="aplicarFicheirosCompensacao" checked={tasks.aplicarFicheirosCompensacao} onCheckedChange={(c) => onTaskChange('aplicarFicheirosCompensacao', !!c)} />
        <Label htmlFor="aplicarFicheirosCompensacao" className="cursor-pointer">Aplicar ficheiros compensação SISP com user SISP (<span className="font-bold">CCLN, EDST, EORI, ERMB</span>)</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="tratarPendentesCartoes" checked={tasks.tratarPendentesCartoes} onCheckedChange={(c) => onTaskChange('tratarPendentesCartoes', !!c)} />
        <Label htmlFor="tratarPendentesCartoes" className="cursor-pointer">Tratar Pendentes CARTÕES (Conta contabilística. 18 5488106)</Label>
      </div>

      <div className="flex items-center space-x-2 ml-1">
        <Checkbox id="consultarSaldoConta" checked={tasks.consultarSaldoConta} onCheckedChange={(c) => onTaskChange('consultarSaldoConta', !!c)} />
        <div className="flex items-center space-x-4">
          <Label htmlFor="consultarSaldoConta" className="cursor-pointer">
            Consultar saldo da conta <span className="font-bold">18/5488102:</span>
          </Label>
          <Input 
            className="w-32 h-7 shadow-inner border-gray-300" 
            type="number" 
            placeholder="0"
            value={tasks.saldoContaValor || ''}
            onChange={(e) => onTaskChange('saldoContaValor', e.target.value)} 
          />
          <div className="flex items-center space-x-1">
            <span className="text-sm">Negativo</span>
            <Checkbox id="saldoNeg" checked={tasks.saldoNegativo} onCheckedChange={(c) => onTaskChange('saldoNegativo', !!c)} />
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-sm">Positivo</span>
            <Checkbox id="saldoPos" checked={tasks.saldoPositivo} onCheckedChange={(c) => onTaskChange('saldoPositivo', !!c)} />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 mt-2">
        <Checkbox id="abrirRealTime" checked={tasks.abrirRealTime} onCheckedChange={(c) => onTaskChange('abrirRealTime', !!c)} />
        <div className="flex items-center">
          <Label htmlFor="abrirRealTime" className="cursor-pointer">
            <span className="font-bold mr-1">Abrir o Real-Time</span> com a SISP
          </Label>
          <span className="font-bold ml-6 mr-1 text-sm">Abertura Real-Time:</span>
          <Input 
            className="w-20 h-7 mx-2 shadow-inner border-gray-300 [&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-calendar-picker-indicator]:hidden" 
            type="time" 
            value={tasks.abrirRealTimeHora || ''}
            onChange={(e) => onTaskChange('abrirRealTimeHora', e.target.value)} 
          />
        </div>
      </div>

      <div className="flex items-start space-x-2 mt-2">
        <Checkbox id="verificarEntradaTransacoes" checked={tasks.verificarEntradaTransacoes} onCheckedChange={(c) => onTaskChange('verificarEntradaTransacoes', !!c)} />
        <Label htmlFor="verificarEntradaTransacoes" className="cursor-pointer">Verificar a entrada de transações <span className="font-bold">3100 4681</span></Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="abrirBcaDireto" checked={tasks.abrirBcaDireto} onCheckedChange={(c) => onTaskChange('abrirBcaDireto', !!c)} />
        <Label htmlFor="abrirBcaDireto" className="cursor-pointer">Abrir o <span className="font-bold">BCADireto</span> percurso <span className="font-bold">49162 – Validar transações</span></Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="userFechoAbrirServidores" checked={tasks.userFechoAbrirServidores} onCheckedChange={(c) => onTaskChange('userFechoAbrirServidores', !!c)} />
        <Label htmlFor="userFechoAbrirServidores" className="cursor-pointer">User Fecho, Abrir servidores Banka remota IN1/IN3/IN4</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="abrirServidoresPfs" checked={tasks.abrirServidoresPfs} onCheckedChange={(c) => onTaskChange('abrirServidoresPfs', !!c)} />
        <Label htmlFor="abrirServidoresPfs" className="cursor-pointer">Abrir Servidores PFS, MWEXT e AML</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="atualizaTelefones" checked={tasks.atualizaTelefones} onCheckedChange={(c) => onTaskChange('atualizaTelefones', !!c)} />
        <Label htmlFor="atualizaTelefones" className="cursor-pointer">Atualiza Telefones tratados no OFFLINE- <span className="font-bold">percurso 768976</span></Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="efetuarTesteCarregamento" checked={tasks.efetuarTesteCarregamento} onCheckedChange={(c) => onTaskChange('efetuarTesteCarregamento', !!c)} />
        <Label htmlFor="efetuarTesteCarregamento" className="cursor-pointer">Efetuar Teste Carregamento e enviar evidência</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="verificarReplicacao" checked={tasks.verificarReplicacao} onCheckedChange={(c) => onTaskChange('verificarReplicacao', !!c)} />
        <Label htmlFor="verificarReplicacao" className="cursor-pointer">Verificar Replicação</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="enviarFicheiroCsv" checked={tasks.enviarFicheiroCsv} onCheckedChange={(c) => onTaskChange('enviarFicheiroCsv', !!c)} />
        <Label htmlFor="enviarFicheiroCsv" className="cursor-pointer">Enviar ficheiro <span className="font-bold">CSV (Comunicação Saldo Véspera)</span></Label>
      </div>

      <div className="flex items-center space-x-2 ml-1 mt-4">
        <Checkbox id="terminoFecho" checked={tasks.terminoFecho} onCheckedChange={(c) => onTaskChange('terminoFecho', !!c)} />
        <div className="flex items-center">
          <Label htmlFor="terminoFecho" className="cursor-pointer font-bold mr-2">
            Término do Fecho
          </Label>
          <Input 
            className="w-20 h-7 mx-2 shadow-inner border-gray-300 [&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-calendar-picker-indicator]:hidden" 
            type="time" 
            value={tasks.terminoFechoHora || ''}
            onChange={(e) => onTaskChange('terminoFechoHora', e.target.value)} 
          />
        </div>
      </div>

      <div className="flex items-start space-x-2 mt-2">
        <Checkbox id="enviarSmsFim" checked={tasks.enviarSmsFim} onCheckedChange={(c) => onTaskChange('enviarSmsFim', !!c)} />
        <Label htmlFor="enviarSmsFim" className="cursor-pointer font-bold underline">Enviar SMS de Notificação de Fim do Fecho</Label>
      </div>

      {/* BLOCO MENSAL */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-start space-x-2">
          <Checkbox id="percurso76921" checked={tasks.percurso76921} onCheckedChange={(c) => onTaskChange('percurso76921', !!c)} />
          <Label htmlFor="percurso76921" className="cursor-pointer">Fazer o percurso 76921 – Limpeza Ficheiro BRLOGED (Dia 1 de cada Mês)</Label>
        </div>
        <div className="flex items-start space-x-2 mt-3">
          <Checkbox id="percurso76922" checked={tasks.percurso76922} onCheckedChange={(c) => onTaskChange('percurso76922', !!c)} />
          <Label htmlFor="percurso76922" className="cursor-pointer">Fazer o percurso 76922 - Reorganiza BRLOGED (Dia 2 de cada Mês)</Label>
        </div>
        <div className="flex items-start space-x-2 mt-3">
          <Checkbox id="percurso76923" checked={tasks.percurso76923} onCheckedChange={(c) => onTaskChange('percurso76923', !!c)} />
          <Label htmlFor="percurso76923" className="cursor-pointer">Fazer o percurso 76923 - Reorganiza GBMVCO (Dia 3 de cada Mês)</Label>
        </div>
      </div>

      {/* IMPRESSÕES */}
      <div className="mt-8 pt-6 border-t border-gray-200 pl-2">
        <h3 className="font-bold text-lg mb-4 underline">Impressões</h3>
        <p className="font-medium text-sm ml-4 mb-4 underline decoration-1 underline-offset-4">• Ter em atenção ao stock/substituição de Toner/Fita impressora PRT</p>
        
        <div className="flex items-start space-x-2 ml-10">
          <Checkbox id="impressaoCheques" checked={tasks.impressaoCheques} onCheckedChange={(c) => onTaskChange('impressaoCheques', !!c)} />
          <Label htmlFor="impressaoCheques" className="cursor-pointer">Impressão Cheques e respectivos Diários (verificação dos mesmos)</Label>
        </div>
        
        <div className="flex items-start space-x-2 ml-10 mt-3">
          <Checkbox id="arquivarCheques" checked={tasks.arquivarCheques} onCheckedChange={(c) => onTaskChange('arquivarCheques', !!c)} />
          <Label htmlFor="arquivarCheques" className="cursor-pointer">Arquivar Cheques e respectivos Diários</Label>
        </div>
      </div>

      {/* OBSERVAÇÕES */}
      <div className="pt-8 mt-6">
        <Label htmlFor="observations3" className="text-lg font-bold underline">Situações Pontuais</Label>
        <Textarea 
          id="observations3" 
          value={observations}
          onChange={(e) => onObservationsChange(e.target.value)}
          className="mt-3 min-h-[150px] resize-y"
        />
      </div>
    </div>
  );
};
