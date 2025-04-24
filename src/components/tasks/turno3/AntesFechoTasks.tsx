
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Turno3Tasks } from '@/types/taskboard';

interface AntesFechoTasksProps {
  tasks: Turno3Tasks;
  onTaskChange: (task: keyof Turno3Tasks, checked: boolean) => void;
}

export const AntesFechoTasks: React.FC<AntesFechoTasksProps> = ({ tasks, onTaskChange }) => {
  return (
    <div className="space-y-2">
      <h4 className="font-medium mb-4">Antes do Fecho</h4>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="verificarDebitos3" 
          checked={tasks.verificarDebitos}
          onCheckedChange={(checked) => onTaskChange('verificarDebitos', !!checked)}
        />
        <Label htmlFor="verificarDebitos3" className="cursor-pointer">Verificar Débitos/Créditos Aplicados no Turno Anterior</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="tratarTapes"
          checked={tasks.tratarTapes}
          onCheckedChange={(checked) => onTaskChange('tratarTapes', !!checked)}
        />
        <Label htmlFor="tratarTapes" className="cursor-pointer">Tratar e trocar Tapes BM, BMBCK – percurso 7622</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox 
          id="fecharServidores"
          checked={tasks.fecharServidores}
          onCheckedChange={(checked) => onTaskChange('fecharServidores', !!checked)}
        />
        <Label htmlFor="fecharServidores" className="cursor-pointer">Fechar Servidores Teste e Produção</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="fecharImpressoras"
          checked={tasks.fecharImpressoras}
          onCheckedChange={(checked) => onTaskChange('fecharImpressoras', !!checked)}
        />
        <Label htmlFor="fecharImpressoras" className="cursor-pointer">Fechar Impressoras e balcões centrais abertos exceto 14 - DSI</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="userFecho"
          checked={tasks.userFecho}
          onCheckedChange={(checked) => onTaskChange('userFecho', !!checked)}
        />
        <Label htmlFor="userFecho" className="cursor-pointer">User Fecho Executar o percurso 7624 Save SYS1OB</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox 
          id="listaRequisicoesCheques"
          checked={tasks.listaRequisicoesCheques}
          onCheckedChange={(checked) => onTaskChange('listaRequisicoesCheques', !!checked)}
        />
        <Label htmlFor="listaRequisicoesCheques" className="cursor-pointer">Lista requisições de cheques do dia 7633. > do que 5, sem comprov. Estornar, 21911</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox 
          id="cancelarCartoesClientes"
          checked={tasks.cancelarCartoesClientes}
          onCheckedChange={(checked) => onTaskChange('cancelarCartoesClientes', !!checked)}
        />
        <Label htmlFor="cancelarCartoesClientes" className="cursor-pointer">User Fecho Cancela os cartões dos Clientes Bloqueados - percurso 76857</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox 
          id="prepararEnviarAsc"
          checked={tasks.prepararEnviarAsc}
          onCheckedChange={(checked) => onTaskChange('prepararEnviarAsc', !!checked)}
        />
        <Label htmlFor="prepararEnviarAsc" className="cursor-pointer">Preparar e enviar ficheiro e ASC (alteração situação cartão) – percurso 4132</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="adicionarRegistrosBanka"
          checked={tasks.adicionarRegistrosBanka}
          onCheckedChange={(checked) => onTaskChange('adicionarRegistrosBanka', !!checked)}
        />
        <Label htmlFor="adicionarRegistrosBanka" className="cursor-pointer">User Fecho Adiciona registos na Banka Remota- percurso 768975</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="fecharServidoresBanka"
          checked={tasks.fecharServidoresBanka}
          onCheckedChange={(checked) => onTaskChange('fecharServidoresBanka', !!checked)}
        />
        <Label htmlFor="fecharServidoresBanka" className="cursor-pointer">User Fecho, fechar servidores Banka remota IN1/IN3/IN4</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="alterarInternetBanking"
          checked={tasks.alterarInternetBanking}
          onCheckedChange={(checked) => onTaskChange('alterarInternetBanking', !!checked)}
        />
        <Label htmlFor="alterarInternetBanking" className="cursor-pointer">User Fecho Alterar Internet Banking para OFFLINE – percurso 49161</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="prepararEnviarCsv"
          checked={tasks.prepararEnviarCsv}
          onCheckedChange={(checked) => onTaskChange('prepararEnviarCsv', !!checked)}
        />
        <Label htmlFor="prepararEnviarCsv" className="cursor-pointer">Preparar e enviar ficheiro CSV (saldos)</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="fecharRealTime"
          checked={tasks.fecharRealTime}
          onCheckedChange={(checked) => onTaskChange('fecharRealTime', !!checked)}
        />
        <Label htmlFor="fecharRealTime" className="cursor-pointer">Interromper o Real-Time com a SISP</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="prepararEnviarEtr"
          checked={tasks.prepararEnviarEtr}
          onCheckedChange={(checked) => onTaskChange('prepararEnviarEtr', !!checked)}
        />
        <Label htmlFor="prepararEnviarEtr" className="cursor-pointer">Preparar e enviar Ficheiro ETR - percurso 7538, consultar conta 18 5488103</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="fazerLoggOffAml"
          checked={tasks.fazerLoggOffAml}
          onCheckedChange={(checked) => onTaskChange('fazerLoggOffAml', !!checked)}
        />
        <Label htmlFor="fazerLoggOffAml" className="cursor-pointer">Fazer Logg-Off do utilizador AML – Percurso 161 (utilizadores ativos)</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="aplicarFicheiroErroEtr"
          checked={tasks.aplicarFicheiroErroEtr}
          onCheckedChange={(checked) => onTaskChange('aplicarFicheiroErroEtr', !!checked)}
        />
        <Label htmlFor="aplicarFicheiroErroEtr" className="cursor-pointer">Aplicar Ficheiro Erro ETR</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="validarBalcao14"
          checked={tasks.validarBalcao14}
          onCheckedChange={(checked) => onTaskChange('validarBalcao14', !!checked)}
        />
        <Label htmlFor="validarBalcao14" className="cursor-pointer">Validar balção 14 7185</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="fecharBalcao14"
          checked={tasks.fecharBalcao14}
          onCheckedChange={(checked) => onTaskChange('fecharBalcao14', !!checked)}
        />
        <Label htmlFor="fecharBalcao14" className="cursor-pointer">Fechar o balcão 14 - DSI e confirmar se todos os balcões encontram-se fechados</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="arranqueManual"
          checked={tasks.arranqueManual}
          onCheckedChange={(checked) => onTaskChange('arranqueManual', !!checked)}
        />
        <Label htmlFor="arranqueManual" className="cursor-pointer">Arranque Manual - Verificar Data da Aplicação – Percurso 431</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="inicioFecho"
          checked={tasks.inicioFecho}
          onCheckedChange={(checked) => onTaskChange('inicioFecho', !!checked)}
        />
        <Label htmlFor="inicioFecho" className="cursor-pointer">Início do Fecho</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="validarEnvioEmail"
          checked={tasks.validarEnvioEmail}
          onCheckedChange={(checked) => onTaskChange('validarEnvioEmail', !!checked)}
        />
        <Label htmlFor="validarEnvioEmail" className="cursor-pointer">Validar envio email(Notificação Inicio Fecho) a partir do ISeries</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="controlarTrabalhos"
          checked={tasks.controlarTrabalhos}
          onCheckedChange={(checked) => onTaskChange('controlarTrabalhos', !!checked)}
        />
        <Label htmlFor="controlarTrabalhos" className="cursor-pointer">Controlar os trabalhos no QBATCH (opções 5, 10, F10, F5, F18)</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="saveBmbck"
          checked={tasks.saveBmbck}
          onCheckedChange={(checked) => onTaskChange('saveBmbck', !!checked)}
        />
        <Label htmlFor="saveBmbck" className="cursor-pointer">Save BMBCK – Automático</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="abrirServidoresInternet"
          checked={tasks.abrirServidoresInternet}
          onCheckedChange={(checked) => onTaskChange('abrirServidoresInternet', !!checked)}
        />
        <Label htmlFor="abrirServidoresInternet" className="cursor-pointer">Abrir Servidores Internet Banking – Percurso 161</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="imprimirCheques"
          checked={tasks.imprimirCheques}
          onCheckedChange={(checked) => onTaskChange('imprimirCheques', !!checked)}
        />
        <Label htmlFor="imprimirCheques" className="cursor-pointer">Imprimir Cheques e Diários de Cheques (depois do Save BMBCK)</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="backupBm"
          checked={tasks.backupBm}
          onCheckedChange={(checked) => onTaskChange('backupBm', !!checked)}
        />
        <Label htmlFor="backupBm" className="cursor-pointer">Backup BM – Automático</Label>
      </div>
    </div>
  );
};
