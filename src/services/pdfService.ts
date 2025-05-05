import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TurnDataType, TasksType, TurnKey } from '@/types/taskboard';
import type { TaskTableRow } from '@/components/taskboard/TableRows';

// Add autoTable to jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

export const generateTaskboardPDF = (
  date: string, 
  turnData: TurnDataType, 
  tasks: TasksType, 
  tableRows: TaskTableRow[] = []
): void => {
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
  
  // Header
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
    
    const processTask = (taskKey: string, taskText: string, checked: boolean, timeValue?: string) => {
      y = checkPageSpace(y, 8);
      drawCheckbox(15, y - 3, checked);
      doc.setFontSize(10);
      doc.text(taskText, 20, y);
      
      // If a time value is provided, display it on the same line
      if (timeValue) {
        doc.text(`Hora: ${timeValue}`, 120, y);
      }
      
      y += 6;
    };

    // Process Turno 1 tasks
    if (turnKey === 'turno1') {
      const turno1Tasks = [
        { key: 'datacenter', text: 'Verificar DATA CENTER' },
        { key: 'sistemas', text: 'Verificar Sistemas: BCACV1/BCACV2' },
        { key: 'servicos', text: 'Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA' },
        { key: 'abrirServidores', text: 'Abrir Servidores (SWIFT, OPDIF, TRMSG, CDGOV, AML)' },
        { key: 'percurso76931', text: 'Percurso 76931 - Atualiza os alertas nos clientes com dados desatualizados' },
        { key: 'verificarDebitos', text: 'Verificar Débitos/Créditos aplicados no dia Anterior' },
        { key: 'processarTef', text: 'Processar ficheiros TEF - ERR/RTR/RCT' },
        { key: 'processarTelecomp', text: 'Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR' },
        { key: 'enviarSegundoEtr', text: 'Enviar 2º Ficheiro ETR (13h:30)' }
      ];

      turno1Tasks.forEach(task => {
        const typedKey = task.key as keyof typeof tasks.turno1;
        processTask(task.key, task.text, tasks.turno1[typedKey] as boolean);
      });

      // Enviar section
      y = checkPageSpace(y, 8);
      doc.text('Enviar:', 15, y);
      let xOffset = 35;
      
      const enviarItems = [
        { key: 'etr', text: 'ETR' },
        { key: 'impostos', text: 'Impostos' },
        { key: 'inpsExtrato', text: 'INPS/Extrato' },
        { key: 'vistoUsa', text: 'Visto USA' },
        { key: 'ben', text: 'BEN' },
        { key: 'bcta', text: 'BCTA' }
      ];

      enviarItems.forEach(item => {
        drawCheckbox(xOffset, y - 3, tasks.turno1[item.key as keyof typeof tasks.turno1] as boolean);
        doc.text(item.text, xOffset + 5, y);
        xOffset += doc.getTextWidth(item.text) + 15;
      });
      y += 8;

      // Backups Diferidos section
      y = checkPageSpace(y, 8);
      doc.text('Backups Diferidos:', 15, y);
      y += 8;

      const backupTasks = [
        { key: 'bmjrn', text: 'BMJRN (2 tapes/alterar 1 por mês/inicializar no inicio do mês)' },
        { key: 'grjrcv', text: 'GRJRCV (1 tape)' },
        { key: 'aujrn', text: 'AUJRN (1tape)' },
        { key: 'mvdia1', text: 'MVDIA1 (eliminar obj. após save N)' },
        { key: 'mvdia2', text: 'MVDIA2 (eliminar obj. após save S)' },
        { key: 'brjrn', text: 'BRJRN (1tape)' }
      ];

      backupTasks.forEach(task => {
        const typedKey = task.key as keyof typeof tasks.turno1;
        processTask(task.key, task.text, tasks.turno1[typedKey] as boolean);
      });

      // Ficheiro COM section
      y = checkPageSpace(y, 8);
      doc.text('Enviar Ficheiro COM, dias:', 15, y);
      xOffset = 80;

      const comDays = [
        { key: 'dia01', text: '01' },
        { key: 'dia08', text: '08' },
        { key: 'dia16', text: '16' },
        { key: 'dia23', text: '23' }
      ];

      comDays.forEach(day => {
        drawCheckbox(xOffset, y - 3, tasks.turno1[day.key as keyof typeof tasks.turno1] as boolean);
        doc.text(day.text, xOffset + 5, y);
        xOffset += 20;
      });
      y += 8;

      // Additional tasks
      const additionalTasks = [
        { key: 'atualizarCentralRisco', text: 'Atualizar Nº Central de Risco (Todas as Sextas-Feiras)' }
      ];

      additionalTasks.forEach(task => {
        const typedKey = task.key as keyof typeof tasks.turno1;
        processTask(task.key, task.text, tasks.turno1[typedKey] as boolean);
      });
    }

    // Process Turno 2 tasks
    if (turnKey === 'turno2') {
      const turno2Tasks = [
        { key: 'datacenter', text: 'Verificar DATA CENTER' },
        { key: 'sistemas', text: 'Verificar Sistemas: BCACV1/BCACV2' },
        { key: 'servicos', text: 'Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA' },
        { key: 'verificarReportes', text: 'Verificar envio de reportes(INPS, VISTO USA, BCV, IMPC)' },
        { key: 'verificarDebitos', text: 'Verificar Débitos/Créditos Aplicados no Turno Anterior' },
        { key: 'confirmarAtualizacaoSisp', text: 'Confirmar Atualização SISP' },
        { key: 'processarTef', text: 'Processar ficheiros TEF - ERR/RTR/RCT' },
        { key: 'processarTelecomp', text: 'Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR' }
      ];

      turno2Tasks.forEach(task => {
        const typedKey = task.key as keyof typeof tasks.turno2;
        processTask(task.key, task.text, tasks.turno2[typedKey] as boolean);
      });

      // INPS section
      y = checkPageSpace(y, 8);
      doc.text('Ficheiros INPS:', 15, y);
      let xOffset = 55;

      const inpsTasks = [
        { key: 'inpsProcessar', text: 'Processar' },
        { key: 'inpsEnviarRetorno', text: 'Enviar Retorno' }
      ];

      inpsTasks.forEach(task => {
        drawCheckbox(xOffset, y - 3, tasks.turno2[task.key as keyof typeof tasks.turno2] as boolean);
        doc.text(task.text, xOffset + 5, y);
        xOffset += doc.getTextWidth(task.text) + 25;
      });
      y += 8;

      // Enviar Ficheiro section
      y = checkPageSpace(y, 8);
      doc.text('Enviar Ficheiro:', 15, y);
      xOffset = 55;

      const enviarTasks = [
        { key: 'enviarEci', text: 'ECI' },
        { key: 'enviarEdv', text: 'EDV' }
      ];

      enviarTasks.forEach(task => {
        drawCheckbox(xOffset, y - 3, tasks.turno2[task.key as keyof typeof tasks.turno2] as boolean);
        doc.text(task.text, xOffset + 5, y);
        xOffset += 20;
      });
      y += 8;

      // Add confirmarAtualizacaoFicheirosSisp after Enviar Ficheiro section
      processTask(
        'confirmarAtualizacaoFicheirosSisp', 
        'Confirmar Atualização Ficheiros Enviados à SISP (ECI * ENV/IMA)', 
        tasks.turno2.confirmarAtualizacaoFicheirosSisp
      );

      // Additional tasks after Enviar Ficheiro
      const additionalTurno2Tasks = [
        { key: 'validarSaco', text: 'Validar Saco 1935' },
        { key: 'verificarPendentes', text: 'Verificar Pendentes dos Balcões' },
        { key: 'fecharBalcoes', text: 'Fechar os Balcoes Centrais' }
      ];

      additionalTurno2Tasks.forEach(task => {
        const typedKey = task.key as keyof typeof tasks.turno2;
        processTask(task.key, task.text, tasks.turno2[typedKey] as boolean);
      });
    }

    // Process Turno 3 tasks
    if (turnKey === 'turno3') {
      // Before closing tasks
      y = checkPageSpace(y, 8);
      doc.setFont("helvetica", "bold");
      doc.text("Antes do Fecho", 15, y);
      y += 8;
      doc.setFont("helvetica", "normal");

      const beforeClosingTasks = [
        { key: 'verificarDebitos', text: 'Verificar Débitos/Créditos Aplicados no Turno Anterior' },
        { key: 'tratarTapes', text: 'Tratar e trocar Tapes BM, BMBCK – percurso 7622' },
        { key: 'fecharServidores', text: 'Fechar Servidores Teste e Produção' },
        { key: 'fecharImpressoras', text: 'Fechar Impressoras e balcões centrais abertos exceto 14 - DSI' },
        { key: 'userFecho', text: 'User Fecho Executar o percurso 7624 Save SYS1OB' },
        { key: 'listaRequisicoesCheques', text: 'Lista requisições de cheques do dia 7633. > do que 5, sem comprov. Estornar, 21911' },
        { key: 'cancelarCartoesClientes', text: 'User Fecho Cancela os cartões dos Clientes Bloqueados - percurso 76857' },
        { key: 'prepararEnviarAsc', text: 'Preparar e enviar ficheiro e ASC (alteração situação cartão) – percurso 4132' },
        { key: 'adicionarRegistrosBanka', text: 'User Fecho Adiciona registos na Banka Remota- percurso 768975' },
        { key: 'fecharServidoresBanka', text: 'User Fecho, fechar servidores Banka remota IN1/IN3/IN4' },
        { key: 'alterarInternetBanking', text: 'User Fecho Alterar Internet Banking para OFFLINE – percurso 49161' },
        { key: 'prepararEnviarCsv', text: 'Preparar e enviar ficheiro CSV (saldos)' },
        { key: 'fecharRealTime', text: 'Interromper o Real-Time com a SISP' },
        { key: 'prepararEnviarEtr', text: 'Preparar e enviar Ficheiro ETR - percurso 7538, consultar conta 18   5488103' },
        { key: 'fazerLoggOffAml', text: 'Fazer Logg-Off do utilizador AML – Percurso 161 (utilizadores ativos)' },
        { key: 'aplicarFicheiroErroEtr', text: 'Aplicar Ficheiro Erro ETR' },
        { key: 'validarBalcao14', text: 'Validar balção 14 7185' },
        { key: 'fecharBalcao14', text: 'Fechar o balcão 14 - DSI e confirmar se todos os balcões encontram-se fechados' },
        { key: 'arranqueManual', text: 'Arranque Manual - Verificar Data da Aplicação – Percurso 431' },
        { key: 'inicioFecho', text: 'Início do Fecho' },
        { key: 'validarEnvioEmail', text: 'Validar envio email( Notificação Inicio Fecho)  a partir do ISeries' },
        { key: 'controlarTrabalhos', text: 'Controlar os trabalhos no QBATCH (opções 5, 10, F10, F5, F18)' },
        { key: 'saveBmbck', text: 'Save BMBCK – Automático' },
        { key: 'abrirServidoresInternet', text: 'Abrir Servidores Internet Banking – Percurso 161–' },
        { key: 'imprimirCheques', text: 'Imprimir Cheques e Diários de Cheques (depois do Save BMBCK)' },
        { key: 'backupBm', text: 'Backup BM – Automático' }
      ];

      beforeClosingTasks.forEach(task => {
        const typedKey = task.key as keyof typeof tasks.turno3;
        const isChecked = tasks.turno3[typedKey] as boolean;
        
        // Handle special cases with time fields
        if (task.key === 'fecharRealTime') {
          const timeValue = tasks.turno3.fecharRealTimeHora || '';
          processTask(task.key, `${task.text} - ${timeValue ? `Hora: ${timeValue}` : ''}`, isChecked);
        } else if (task.key === 'inicioFecho') {
          const timeValue = tasks.turno3.inicioFechoHora || '';
          processTask(task.key, `${task.text} - ${timeValue ? `Hora: ${timeValue}` : ''}`, isChecked);
        } else {
          processTask(task.key, task.text, isChecked);
        }
      });

      // After closing tasks
      y = checkPageSpace(y, 8);
      doc.setFont("helvetica", "bold");
      doc.text("Depois do Fecho", 15, y);
      y += 8;
      doc.setFont("helvetica", "normal");

      const afterClosingTasks = [
        { key: 'validarFicheiroCcln', text: 'Validar ficheiro CCLN - 76853' },
        { key: 'aplicarFicheirosCompensacao', text: 'Aplicar ficheiros compensação SISP (CCLN, EDST, EORI, ERMB)' },
        { key: 'validarSaldoConta', text: 'Validar saldo da conta 18/5488102:' },
        { key: 'abrirRealTime', text: 'Abrir o Real-Time' },
        { key: 'verificarTransacoes', text: 'Verificar a entrada de transações 3100 4681' },
        { key: 'aplicarFicheiroVisa', text: 'Aplicar ficheiro VISA DAF - com o user FECHO 4131' },
        { key: 'cativarCartoes', text: 'Cativar cartões de crédito em incumprimento - com o user FECHO – 76727' },
        { key: 'abrirBcaDireto', text: 'Abrir BCA Direto/MB/Extrato Digital/Paypal – 49162' },
        { key: 'abrirServidoresBanka', text: 'Abrir servidores Banka Remota' },
        { key: 'atualizarTelefonesOffline', text: 'Atualizar telefones OFFLINE' },
        { key: 'verificarReplicacao', text: 'Verificar a replicação entre servidores' },
        { key: 'enviarFicheiroCsv', text: 'Enviar ficheiro CSV (saldos) para MIA' },
        { key: 'transferirFicheirosLiquidity', text: 'Transferir ficheiros para a pasta Liquidity' },
        { key: 'percurso76921', text: 'Percurso 76921 (Produção de diversos ficheiros)' },
        { key: 'percurso76922', text: 'Percurso 76922 (Transmissão de ficheiros)' },
        { key: 'percurso76923', text: 'Percurso 76923 (Tratamento dos ficheiros)' },
        { key: 'abrirServidoresTesteProducao', text: 'Abrir Servidores Teste e Produção' },
        { key: 'impressaoCheques', text: 'Impressão Cheques dia seguinte' },
        { key: 'arquivarCheques', text: 'Arquivar Cheques e Extratos Impressos' },
        { key: 'terminoFecho', text: 'Termino do Fecho' },
        { key: 'transferirFicheirosDsi', text: 'Transferir Ficheiros DSI' }
      ];

      afterClosingTasks.forEach(task => {
        const typedKey = task.key as keyof typeof tasks.turno3;
        const isChecked = tasks.turno3[typedKey] as boolean;
        
        // Handle special cases with time or number fields
        if (task.key === 'validarSaldoConta') {
          const saldoValor = tasks.turno3.saldoContaValor || '';
          const saldoTipo = tasks.turno3.saldoPositivo ? 'Positivo' : tasks.turno3.saldoNegativo ? 'Negativo' : '';
          
          processTask(task.key, `${task.text} ${saldoValor}${saldoTipo ? ` (${saldoTipo})` : ''}`, isChecked);
        } else if (task.key === 'abrirRealTime') {
          const timeValue = tasks.turno3.abrirRealTimeHora || '';
          processTask(task.key, `${task.text} - ${timeValue ? `Hora: ${timeValue}` : ''}`, isChecked);
        } else if (task.key === 'terminoFecho') {
          const timeValue = tasks.turno3.terminoFechoHora || '';
          processTask(task.key, `${task.text} - ${timeValue ? `Hora: ${timeValue}` : ''}`, isChecked);
        } else {
          processTask(task.key, task.text, isChecked);
        }
      });
    }

    if (turn.observations) {
      y = checkPageSpace(y, 12);
      doc.setFont("helvetica", "bold");
      doc.text("Observações:", 15, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      const maxWidth = pageWidth - 30;
      const lines = doc.splitTextToSize(turn.observations, maxWidth);
      lines.forEach((line: string) => {
        y = checkPageSpace(y, 6);
        doc.text(line, 15, y);
        y += 6;
      });
    }

    y += 10;
  });
  
  // Add the processamentos table to the PDF if there are any rows
  if (tableRows && tableRows.length > 0) {
    y = checkPageSpace(y, 40); // Check if we need a new page for the table
    
    // Add a title for the processamentos section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Processamentos", 15, y);
    y += 10;
    
    const tableData = tableRows.map(row => [
      row.hora || '',
      row.tarefa || '',
      row.nomeAs || '',
      row.operacao || '',
      row.executado || ''
    ]);
    
    autoTable(doc, {
      startY: y,
      head: [['Hora', 'Tarefa', 'Nome AS/400', 'Operação', 'Executado Por']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
      },
      margin: { top: 10 }
    });
  }
  
  doc.save(`Ficha de Procedimentos - ${formattedDate}.pdf`);
};
