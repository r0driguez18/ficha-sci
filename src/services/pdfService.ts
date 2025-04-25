
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TurnDataType, TasksType, TurnKey } from '@/types/taskboard';

// Add autoTable to jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

export const generateTaskboardPDF = (date: string, turnData: TurnDataType, tasks: TasksType): void => {
  const doc = new jsPDF();
  
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().split('T')[0].replace(/-/g, '');
  
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let y = 20;
  
  const centerText = (text: string, y: number) => {
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);
  };
  
  const drawCheckbox = (x: number, y: number, checked: boolean) => {
    doc.rect(x, y, 3, 3);
    if (checked) {
      doc.line(x, y, x + 3, y + 3);
      doc.line(x + 3, y, x, y + 3);
    }
  };
  
  const checkPageSpace = (y: number, requiredSpace: number): number => {
    if (y + requiredSpace > pageHeight - 20) {
      doc.addPage();
      return 20;
    }
    return y;
  };
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  centerText("CENTRO INFORMÁTICA", y);
  y += 10;
  
  doc.setFontSize(16);
  centerText("Ficha de Procedimentos", y);
  y += 15;
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Processamentos Diários", 15, y);
  doc.text(`Data: ${date}`, pageWidth - 50, y);
  y += 10;
  
  const turnKeys: TurnKey[] = ['turno1', 'turno2', 'turno3'];
  const turnNames = ['Turno 1', 'Turno 2', 'Turno 3'];
  
  turnKeys.forEach((turnKey, index) => {
    const turnName = turnNames[index];
    const turn = turnData[turnKey];
    
    y = checkPageSpace(y, 30);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`${turnName}:`, 15, y);
    doc.setFont("helvetica", "normal");
    
    doc.text(`Operador: ${turn.operator}`, 50, y);
    doc.text(`Entrada: ${turn.entrada}`, 120, y);
    doc.text(`Saída: ${turn.saida}`, 170, y);
    y += 10;
    
    if (turnKey === 'turno3') {
      y = checkPageSpace(y, 8);
      doc.setFont("helvetica", "bold");
      doc.text("Antes do Fecho", 15, y);
      y += 8;
    }
    
    const processTask = (taskKey: string, taskText: string, checked: boolean) => {
      y = checkPageSpace(y, 8);
      drawCheckbox(15, y - 3, checked);
      doc.setFontSize(10);
      doc.text(taskText, 20, y);
      y += 6;
    };
    
    if (turnKey === 'turno1') {
      
      const regularTasksToProcess = ['datacenter', 'sistemas', 'servicos', 'abrirServidores', 'percurso76931'];
      
      regularTasksToProcess.forEach(taskKey => {
        const taskTexts: Record<string, string> = {
          datacenter: "Verificar DATA CENTER",
          sistemas: "Verificar Sistemas: BCACV1/BCACV2",
          servicos: "Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA",
          abrirServidores: "Abrir Servidores (SWIFT, OPDIF, TRMSG, CDGOV, AML)",
          percurso76931: "Percurso 76931 - Atualiza os alertas nos clientes com dados desatualizados"
        };
        
        const typedTaskKey = taskKey as keyof typeof tasks.turno1;
        processTask(taskKey, taskTexts[taskKey], tasks.turno1[typedTaskKey] as boolean);
      });
      
      y = checkPageSpace(y, 8);
      drawCheckbox(15, y - 3, tasks.turno1.enviar);
      doc.setFontSize(10);
      doc.text("Enviar:", 20, y);
      
      let xOffset = 35;
      const subItems = [
        { key: 'etr', text: 'ETR' },
        { key: 'impostos', text: 'Impostos' },
        { key: 'inpsExtrato', text: 'INPS/Extrato' },
        { key: 'vistoUsa', text: 'Visto USA' },
        { key: 'ben', text: 'BEN' },
        { key: 'bcta', text: 'BCTA' }
      ];
      
      subItems.forEach(item => {
        const itemKey = item.key as keyof typeof tasks.turno1;
        drawCheckbox(xOffset, y - 3, tasks.turno1[itemKey] as boolean);
        doc.text(item.text, xOffset + 5, y);
        xOffset += doc.getTextWidth(item.text) + 15;
      });
      
      y += 8;
      
      const remainingTasks = ['verificarDebitos', 'processarTef', 'processarTelecomp'];
      
      remainingTasks.forEach(taskKey => {
        const taskTexts: Record<string, string> = {
          verificarDebitos: "Verificar Débitos/Créditos aplicados no dia Anterior",
          processarTef: "Processar ficheiros TEF - ERR/RTR/RCT",
          processarTelecomp: "Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR"
        };
        
        const typedTaskKey = taskKey as keyof typeof tasks.turno1;
        processTask(taskKey, taskTexts[taskKey], tasks.turno1[typedTaskKey] as boolean);
      });
    }
    
    if (turnKey === 'turno2') {
      
      const regularTasksToProcess = ['datacenter', 'sistemas', 'servicos', 'verificarReportes'];
      
      regularTasksToProcess.forEach(taskKey => {
        const taskTexts: Record<string, string> = {
          datacenter: "Verificar DATA CENTER",
          sistemas: "Verificar Sistemas: BCACV1/BCACV2",
          servicos: "Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA",
          verificarReportes: "Verificar envio de reportes(INPS, VISTO USA, BCV, IMPC)"
        };
        
        const typedTaskKey = taskKey as keyof typeof tasks.turno2;
        processTask(taskKey, taskTexts[taskKey], tasks.turno2[typedTaskKey] as boolean);
      });
      
      y = checkPageSpace(y, 8);
      doc.setFontSize(10);
      doc.text("Ficheiros INPS:", 20, y);
      
      let xOffset = 55;
      
      drawCheckbox(xOffset, y - 3, tasks.turno2.inpsProcessar);
      doc.text("Processar", xOffset + 5, y);
      
      xOffset += 35;
      
      drawCheckbox(xOffset, y - 3, tasks.turno2.inpsEnviarRetorno);
      doc.text("Enviar Retorno", xOffset + 5, y);
      
      y += 8;
      
      const middleTasksToProcess = ['processarTef', 'processarTelecomp'];
      
      middleTasksToProcess.forEach(taskKey => {
        const taskTexts: Record<string, string> = {
          processarTef: "Processar ficheiros TEF - ERR/RTR/RCT",
          processarTelecomp: "Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR"
        };
        
        const typedTaskKey = taskKey as keyof typeof tasks.turno2;
        processTask(taskKey, taskTexts[taskKey], tasks.turno2[typedTaskKey] as boolean);
      });
      
      y = checkPageSpace(y, 8);
      doc.setFontSize(10);
      doc.text("Enviar Ficheiro:", 20, y);
      
      xOffset = 55;
      
      drawCheckbox(xOffset, y - 3, tasks.turno2.enviarEci);
      doc.text("ECI", xOffset + 5, y);
      
      xOffset += 20;
      
      drawCheckbox(xOffset, y - 3, tasks.turno2.enviarEdv);
      doc.text("EDV", xOffset + 5, y);
      
      y += 8;
      
      const finalTasksToProcess = ['validarSaco', 'verificarPendentes', 'fecharBalcoes'];
      
      finalTasksToProcess.forEach(taskKey => {
        const taskTexts: Record<string, string> = {
          validarSaco: "Validar Saco 1935",
          verificarPendentes: "Verificar Pendentes dos Balcões",
          fecharBalcoes: "Fechar os Balcoes Centrais"
        };
        
        const typedTaskKey = taskKey as keyof typeof tasks.turno2;
        processTask(taskKey, taskTexts[taskKey], tasks.turno2[typedTaskKey] as boolean);
      });
    }
    
    if (turnKey === 'turno3') {
      const beforeCloseTasks = ['verificarDebitos', 'tratarTapes', 'fecharServidores', 'fecharImpressoras', 'userFecho', 'listaRequisicoesCheques', 'cancelarCartoesClientes', 'prepararEnviarAsc', 'adicionarRegistrosBanka', 'fecharServidoresBanka', 'alterarInternetBanking', 'prepararEnviarCsv', 'fecharRealTime', 'prepararEnviarEtr', 'fazerLoggOffAml', 'aplicarFicheiroErroEtr', 'validarBalcao14', 'fecharBalcao14', 'arranqueManual', 'inicioFecho', 'validarEnvioEmail', 'controlarTrabalhos', 'saveBmbck', 'abrirServidoresInternet', 'imprimirCheques', 'backupBm'];
      
      beforeCloseTasks.forEach(taskKey => {
        const taskTexts: Record<string, string> = {
          verificarDebitos: "Verificar Débitos/Créditos Aplicados no Turno Anterior",
          tratarTapes: "Tratar e trocar Tapes BM, BMBCK – percurso 7622",
          fecharServidores: "Fechar Servidores Teste e Produção",
          fecharImpressoras: "Fechar Impressoras e balcões centrais abertos exceto 14 - DSI",
          userFecho: "User Fecho Executar o percurso 7624 Save SYS1OB",
          listaRequisicoesCheques: "Lista requisições de cheques do dia 7633. > do que 5, sem comprov. Estornar, 21911",
          cancelarCartoesClientes: "User Fecho Cancela os cartões dos Clientes Bloqueados - percurso 76857",
          prepararEnviarAsc: "Preparar e enviar ficheiro e ASC (alteração situação cartão) – percurso 4132",
          adicionarRegistrosBanka: "User Fecho Adiciona registos na Banka Remota- percurso 768975",
          fecharServidoresBanka: "User Fecho, fechar servidores Banka remota IN1/IN3/IN4",
          alterarInternetBanking: "User Fecho Alterar Internet Banking para OFFLINE – percurso 49161",
          prepararEnviarCsv: "Preparar e enviar ficheiro CSV (saldos)",
          fecharRealTime: "Interromper o Real-Time com a SISP",
          prepararEnviarEtr: "Preparar e enviar Ficheiro ETR - percurso 7538, consultar conta 18   5488103",
          fazerLoggOffAml: "Fazer Logg-Off do utilizador AML – Percurso 161 (utilizadores ativos)",
          aplicarFicheiroErroEtr: "Aplicar Ficheiro Erro ETR",
          validarBalcao14: "Validar balção 14 7185",
          fecharBalcao14: "Fechar o balcão 14 - DSI e confirmar se todos os balcões encontram-se fechados",
          arranqueManual: "Arranque Manual - Verificar Data da Aplicação – Percurso 431",
          inicioFecho: "Início do Fecho",
          validarEnvioEmail: "Validar envio email( Notificação Inicio Fecho)  a partir do ISeries",
          controlarTrabalhos: "Controlar os trabalhos no QBATCH (opções 5, 10, F10, F5, F18)",
          saveBmbck: "Save BMBCK – Automático",
          abrirServidoresInternet: "Abrir Servidores Internet Banking – Percurso 161–",
          imprimirCheques: "Imprimir Cheques e Diários de Cheques (depois do Save BMBCK)",
          backupBm: "Backup BM – Automático"
        };
        
        const typedTaskKey = taskKey as keyof typeof tasks.turno3;
        processTask(taskKey, taskTexts[taskKey], tasks.turno3[typedTaskKey] as boolean);
      });
      
      y = checkPageSpace(y, 8);
      doc.setFont("helvetica", "bold");
      doc.text("Depois do Fecho", 15, y);
      y += 8;
      
      const afterCloseTasks = ['validarFicheiroCcln', 'aplicarFicheirosCompensacao', 'validarSaldoConta', 'saldoNegativo', 'saldoPositivo', 'abrirRealTime', 'verificarTransacoes', 'aplicarFicheiroVisa', 'cativarCartoes'];
      
      afterCloseTasks.forEach(taskKey => {
        const taskTexts: Record<string, string> = {
          validarFicheiroCcln: "Validar ficheiro CCLN - 76853",
          aplicarFicheirosCompensacao: "Aplicar ficheiros compensação SISP (CCLN, EDST, EORI, ERMB)",
          validarSaldoConta: "Validar saldo da conta 18/5488102:",
          saldoNegativo: "Negativo",
          saldoPositivo: "Positivo",
          abrirRealTime: "Abrir o Real-Time",
          verificarTransacoes: "Verificar a entrada de transações 3100 4681",
          aplicarFicheiroVisa: "Aplicar ficheiro VISA DAF - com o user FECHO 4131",
          cativarCartoes: "Cativar cartões de crédito em incumprimento - com o user FECHO – 76727"
        };
        
        const typedTaskKey = taskKey as keyof typeof tasks.turno3;
        processTask(taskKey, taskTexts[taskKey], tasks.turno3[typedTaskKey] as boolean);
      });
      
      const finalAfterCloseTasks = ['abrirBcaDireto', 'abrirServidoresBanka', 'atualizarTelefonesOffline', 'verificarReplicacao', 'enviarFicheiroCsv', 'transferirFicheirosLiquidity', 'percurso76921', 'percurso76922', 'percurso76923', 'abrirServidoresTesteProducao', 'impressaoCheques', 'arquivarCheques', 'terminoFecho', 'transferirFicheirosDsi'];
      
      finalAfterCloseTasks.forEach(taskKey => {
        const taskTexts: Record<string, string> = {
          abrirBcaDireto: "Abrir BCA Direto/MB/Extrato Digital/Paypal – 49162",
          abrirServidoresBanka: "Abrir servidores Banka Remota",
          atualizarTelefonesOffline: "Atualizar telefones OFFLINE",
          verificarReplicacao: "Verificar a replicação entre servidores",
          enviarFicheiroCsv: "Enviar ficheiro CSV (saldos) para MIA",
          transferirFicheirosLiquidity: "Transferir ficheiros para a pasta Liquidity",
          percurso76921: "Percurso 76921 (Produção de diversos ficheiros)",
          percurso76922: "Percurso 76922 (Transmissão de ficheiros)",
          percurso76923: "Percurso 76923 (Tratamento dos ficheiros)",
          abrirServidoresTesteProducao: "Abrir Servidores Teste e Produção",
          impressaoCheques: "Impressão Cheques dia seguinte",
          arquivarCheques: "Arquivar Cheques e Extratos Impressos",
          terminoFecho: "Termino do Fecho",
          transferirFicheirosDsi: "Transferir Ficheiros DSI"
        };
        
        const typedTaskKey = taskKey as keyof typeof tasks.turno3;
        processTask(taskKey, taskTexts[taskKey], tasks.turno3[typedTaskKey] as boolean);
      });
    }
  });
  
  doc.save(`Ficha de Procedimentos - ${formattedDate}.pdf`);
};
