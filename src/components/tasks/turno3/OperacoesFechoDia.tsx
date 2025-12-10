
import React from 'react';
import { CheckboxField } from './CheckboxField';
import { TimeCheckboxField } from './TimeCheckboxField';

interface OperacoesFechoDiaProps {
  tasks: {
    verificarDebitos: boolean;
    tratarTapes: boolean;
    fecharServidores: boolean;
    fecharImpressoras: boolean;
    userFecho: boolean;
    listaRequisicoesCheques: boolean;
    cancelarCartoesClientes: boolean;
    prepararEnviarAsc: boolean;
    adicionarRegistrosBanka: boolean;
    fecharServidoresBanka: boolean;
    alterarInternetBanking: boolean;
    prepararEnviarCsv: boolean;
    fecharRealTime: boolean;
    fecharRealTimeHora: string;
    prepararEnviarEtr: boolean;
    fazerLoggOffAml: boolean;
    aplicarFicheiroErroEtr: boolean;
    validarBalcao14: boolean;
    fecharBalcao14: boolean;
    arranqueManual: boolean;
    inicioFecho: boolean;
    inicioFechoHora: string;
    validarEnvioEmail: boolean;
    controlarTrabalhos: boolean;
    saveBmbck: boolean;
    abrirServidoresInternet: boolean;
    imprimirCheques: boolean;
    backupBm: boolean;
  };
  onTaskChange: (task: string, value: boolean | string) => void;
}

export const OperacoesFechoDia: React.FC<OperacoesFechoDiaProps> = ({
  tasks,
  onTaskChange
}) => {
  const handleCheckboxChange = (task: string, checked: boolean | "indeterminate") => {
    onTaskChange(task, checked === "indeterminate" ? false : Boolean(checked));
  };

  return (
    <div className="space-y-1">
      <div className="bg-primary/10 border-l-4 border-primary px-4 py-2 rounded-r-lg mb-4">
        <h4 className="font-semibold text-primary text-base">Operações Fecho Dia</h4>
      </div>
      
      <div className="space-y-1 pl-2">
        <CheckboxField 
          id="verificarDebitos3" 
          checked={tasks.verificarDebitos}
          onCheckedChange={(checked) => handleCheckboxChange('verificarDebitos', checked)}
          label="Verificar Débitos/Créditos Aplicados no Turno Anterior"
        />
        
        <CheckboxField 
          id="tratarTapes" 
          checked={tasks.tratarTapes}
          onCheckedChange={(checked) => handleCheckboxChange('tratarTapes', checked)}
          label="Tratar e trocar Tapes BM, BMBCK – percurso 7622"
        />
        
        <CheckboxField 
          id="fecharServidores" 
          checked={tasks.fecharServidores}
          onCheckedChange={(checked) => handleCheckboxChange('fecharServidores', checked)}
          label="Fechar Servidores Teste e Produção"
        />
        
        <CheckboxField 
          id="fecharImpressoras" 
          checked={tasks.fecharImpressoras}
          onCheckedChange={(checked) => handleCheckboxChange('fecharImpressoras', checked)}
          label="Fechar Impressoras e balcões centrais abertos exceto 14 - DSI"
        />
        
        <CheckboxField 
          id="userFecho" 
          checked={tasks.userFecho}
          onCheckedChange={(checked) => handleCheckboxChange('userFecho', checked)}
          label="User Fecho Executar o percurso 7624 Save SYS1OB"
        />
        
        <CheckboxField 
          id="listaRequisicoesCheques" 
          checked={tasks.listaRequisicoesCheques}
          onCheckedChange={(checked) => handleCheckboxChange('listaRequisicoesCheques', checked)}
          label="Lista requisições de cheques do dia 7633. > do que 5, sem comprov. Estornar, 21911"
        />
        
        <CheckboxField 
          id="cancelarCartoesClientes" 
          checked={tasks.cancelarCartoesClientes}
          onCheckedChange={(checked) => handleCheckboxChange('cancelarCartoesClientes', checked)}
          label="User Fecho Cancela os cartões dos Clientes Bloqueados - percurso 76857"
        />
        
        <CheckboxField 
          id="prepararEnviarAsc" 
          checked={tasks.prepararEnviarAsc}
          onCheckedChange={(checked) => handleCheckboxChange('prepararEnviarAsc', checked)}
          label="Preparar e enviar ficheiro e ASC (alteração situação cartão) – percurso 4132"
        />
        
        <CheckboxField 
          id="adicionarRegistrosBanka" 
          checked={tasks.adicionarRegistrosBanka}
          onCheckedChange={(checked) => handleCheckboxChange('adicionarRegistrosBanka', checked)}
          label="User Fecho Adiciona registos na Banka Remota- percurso 768975"
        />
        
        <CheckboxField 
          id="fecharServidoresBanka" 
          checked={tasks.fecharServidoresBanka}
          onCheckedChange={(checked) => handleCheckboxChange('fecharServidoresBanka', checked)}
          label="User Fecho, fechar servidores Banka remota IN1/IN3/IN4"
        />
        
        <CheckboxField 
          id="alterarInternetBanking" 
          checked={tasks.alterarInternetBanking}
          onCheckedChange={(checked) => handleCheckboxChange('alterarInternetBanking', checked)}
          label="User Fecho Alterar Internet Banking para OFFLINE – percurso 49161"
        />
        
        <CheckboxField 
          id="prepararEnviarCsv" 
          checked={tasks.prepararEnviarCsv}
          onCheckedChange={(checked) => handleCheckboxChange('prepararEnviarCsv', checked)}
          label="Preparar e enviar ficheiro CSV (saldos)"
        />
        
        <TimeCheckboxField
          id="fecharRealTime"
          checked={tasks.fecharRealTime}
          timeValue={tasks.fecharRealTimeHora}
          onCheckedChange={(checked) => handleCheckboxChange('fecharRealTime', checked)}
          onTimeChange={(value) => onTaskChange('fecharRealTimeHora', value)}
          label="Interromper o Real-Time com a SISP"
        />
        
        <CheckboxField 
          id="prepararEnviarEtr" 
          checked={tasks.prepararEnviarEtr}
          onCheckedChange={(checked) => handleCheckboxChange('prepararEnviarEtr', checked)}
          label="Preparar e enviar Ficheiro ETR - percurso 7538, consultar conta 18 5488103"
        />
        
        <CheckboxField 
          id="fazerLoggOffAml" 
          checked={tasks.fazerLoggOffAml}
          onCheckedChange={(checked) => handleCheckboxChange('fazerLoggOffAml', checked)}
          label="Fazer Logg-Off do utilizador AML – Percurso 161 (utilizadores ativos)"
        />
        
        <CheckboxField 
          id="aplicarFicheiroErroEtr" 
          checked={tasks.aplicarFicheiroErroEtr}
          onCheckedChange={(checked) => handleCheckboxChange('aplicarFicheiroErroEtr', checked)}
          label="Aplicar Ficheiro Erro ETR"
        />
        
        <CheckboxField 
          id="validarBalcao14" 
          checked={tasks.validarBalcao14}
          onCheckedChange={(checked) => handleCheckboxChange('validarBalcao14', checked)}
          label="Validar balção 14 7185"
        />
        
        <CheckboxField 
          id="fecharBalcao14" 
          checked={tasks.fecharBalcao14}
          onCheckedChange={(checked) => handleCheckboxChange('fecharBalcao14', checked)}
          label="Fechar o balcão 14 - DSI e confirmar se todos os balcões encontram-se fechados"
        />
        
        <CheckboxField 
          id="arranqueManual" 
          checked={tasks.arranqueManual}
          onCheckedChange={(checked) => handleCheckboxChange('arranqueManual', checked)}
          label="Arranque Manual - Verificar Data da Aplicação – Percurso 431"
        />
        
        {/* Important task - Início do Fecho */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg my-2">
          <TimeCheckboxField
            id="inicioFecho"
            checked={tasks.inicioFecho}
            timeValue={tasks.inicioFechoHora}
            onCheckedChange={(checked) => handleCheckboxChange('inicioFecho', checked)}
            onTimeChange={(value) => onTaskChange('inicioFechoHora', value)}
            label="Início do Fecho"
          />
        </div>
        
        <CheckboxField 
          id="validarEnvioEmail" 
          checked={tasks.validarEnvioEmail}
          onCheckedChange={(checked) => handleCheckboxChange('validarEnvioEmail', checked)}
          label="Validar envio email (Notificação Inicio Fecho) a partir do ISeries"
        />
        
        <CheckboxField 
          id="controlarTrabalhos" 
          checked={tasks.controlarTrabalhos}
          onCheckedChange={(checked) => handleCheckboxChange('controlarTrabalhos', checked)}
          label="Controlar os trabalhos no QBATCH (opções 5, 10, F10, F5, F18)"
        />
        
        <CheckboxField 
          id="saveBmbck" 
          checked={tasks.saveBmbck}
          onCheckedChange={(checked) => handleCheckboxChange('saveBmbck', checked)}
          label="Save BMBCK – Automático"
        />
        
        <CheckboxField 
          id="abrirServidoresInternet" 
          checked={tasks.abrirServidoresInternet}
          onCheckedChange={(checked) => handleCheckboxChange('abrirServidoresInternet', checked)}
          label="Abrir Servidores Internet Banking – Percurso 161–"
        />
        
        <CheckboxField 
          id="imprimirCheques" 
          checked={tasks.imprimirCheques}
          onCheckedChange={(checked) => handleCheckboxChange('imprimirCheques', checked)}
          label="Imprimir Cheques e Diários de Cheques (depois do Save BMBCK)"
        />
        
        <CheckboxField 
          id="backupBm" 
          checked={tasks.backupBm}
          onCheckedChange={(checked) => handleCheckboxChange('backupBm', checked)}
          label="Backup BM – Automático"
        />
      </div>
    </div>
  );
};
