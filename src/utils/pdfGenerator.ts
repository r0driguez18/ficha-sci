import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TasksType, TurnDataType, TurnKey } from '@/types/taskboard';
import { TaskTableRow } from '@/types/taskTableRow';

export const generateTaskboardPDF = (
  date: string,
  turnData: TurnDataType, 
  tasks: TasksType,
  tableRows: TaskTableRow[]
) => {
  const doc = new jsPDF();
  
  const formattedDate = date;
  
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let y = 20;
  
  const centerText = (text: string, y: number) => {
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);
  };
  
  // Helper function to ensure we only pass boolean values to drawCheckbox
  const ensureBoolean = (value: boolean | string): boolean => {
    if (typeof value === 'string') {
      return value === 'true' || value === 'indeterminate';
    }
    return Boolean(value);
  };
  
  const drawCheckbox = (x: number, y: number, checked: boolean | string) => {
    const isChecked = ensureBoolean(checked);
    // Standardize all checkbox colors to black
    doc.setDrawColor(0, 0, 0);
    doc.setFillColor(0, 0, 0);
    doc.rect(x, y, 3, 3);
    if (isChecked) {
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
  
  // Helper function to draw a rectangle around observations
  const drawObservationsBox = (startY: number, text: string): number => {
    const padding = 5;
    const lineHeight = 5;
    
    doc.setFont("helvetica", "bold");
    doc.text("Observações:", 15, startY);
    startY += 6;
    
    // Calculate the height needed for the observations text
    const splitText = doc.splitTextToSize(text || "", pageWidth - 30 - (padding * 2));
    const textHeight = splitText.length * lineHeight;
    
    // Draw rectangle with padding
    const boxHeight = Math.max(20, textHeight + padding * 2); // Minimum 20px height
    doc.setDrawColor(0, 0, 0); // Always black
    doc.setLineWidth(0.5);
    doc.rect(15 - padding, startY - padding, pageWidth - 30, boxHeight);
    
    // If there is text, add it inside the rectangle
    if (text) {
      doc.setFont("helvetica", "normal");
      doc.text(splitText, 15, startY + padding);
      return startY + textHeight + (padding * 2);
    }
    
    return startY + boxHeight;
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
    
    // Add extra spacing between turns (20 pixels)
    if (index > 0) {
      y = checkPageSpace(y, 20);
      y += 15; // Add extra spacing between turns
    }
    
    y = checkPageSpace(y, 30);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`${turnName}:`, 15, y);
    doc.setFont("helvetica", "normal");
    
    doc.text(`Operador: ${turn.operator}`, 50, y);
    doc.text(`Entrada: ${turn.entrada}`, 120, y);
    doc.text(`Saída: ${turn.saida}`, 170, y);
    y += 10;
    
    // Process tasks for Turno 1
    if (turnKey === 'turno1') {
      // Process basic tasks
      const taskList = [
        {key: 'datacenter', text: "Verificar Alarmes e Sistemas/Climatização DATA CENTER"},
        {key: 'sistemas', text: "Verificar Sistemas: BCACV1/BCACV2"},
        {key: 'servicos', text: "Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA"},
        {key: 'abrirServidores', text: "Abrir Servidores (SWIFT, OPDIF, TRMSG, CDGOV, AML)"},
        {key: 'percurso76931', text: "Percurso 76931 - Atualiza os alertas nos clientes com dados desatualizados"},
        {key: 'enviar', text: "Enviar:"},
        {key: 'verificarDebitos', text: "Verificar Débitos/Créditos aplicados no dia Anterior"},
        {key: 'enviarReportes', text: "Enviar Reportes (INPS, Visto USA, BCV, IMPC)"},
        {key: 'verificarRecepcaoSisp', text: "Verificar Recep. dos Ficheiros Enviados à SISP:"},
        {key: 'backupsDiferidos', text: "Backups Diferidos"},
        {key: 'processarTef', text: "Processar ficheiros TEF - ERR/RTR/RCT"},
        {key: 'processarTelecomp', text: "Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR"},
        {key: 'enviarSegundoEtr', text: "Enviar 2º Ficheiro ETR (13h:30)"},
        {key: 'enviarFicheiroCom', text: "Enviar Ficheiro COM, dias específicos"},
        {key: 'atualizarCentralRisco', text: "Atualizar Nº Central de Risco (Todas as Sextas-Feiras)"}
      ];
      
      taskList.forEach(item => {
        y = checkPageSpace(y, 8);
        
        drawCheckbox(15, y - 3, ensureBoolean(tasks.turno1[item.key as keyof typeof tasks.turno1]));
        doc.setFontSize(10);
        
        // Handle the "Enviar:" special case
        if (item.key === 'enviar') {
          doc.text(item.text, 20, y);
          y += 6;  // Add extra line space after "Enviar:" label
          
          // Process sub-items in rows rather than inline for "Enviar"
          const enviarSubItems = [
            { key: 'etr', text: 'ETR' },
            { key: 'impostos', text: 'Impostos' },
            { key: 'inpsExtrato', text: 'INPS/Extrato' },
            { key: 'vistoUsa', text: 'Visto USA' },
            { key: 'ben', text: 'BEN' },
            { key: 'bcta', text: 'BCTA' }
          ];
          
          // Display in two columns, 3 items per row
          for (let i = 0; i < enviarSubItems.length; i += 3) {
            y = checkPageSpace(y, 8);
            
            // First column items (up to 3 per row)
            for (let j = 0; j < 3; j++) {
              if (i + j < enviarSubItems.length) {
                const subItem = enviarSubItems[i + j];
                const itemKey = subItem.key as keyof typeof tasks.turno1;
                const xOffset = 25 + (j * 40); // Space items horizontally
                
                drawCheckbox(xOffset, y - 3, ensureBoolean(tasks.turno1[itemKey]));
                doc.text(subItem.text, xOffset + 5, y);
              }
            }
            
            y += 6; // Move to next row after displaying up to 3 items
          }
        } else if (item.key === 'verificarRecepcaoSisp') {
          // Handle Verificar Recepção SISP with ASC, CSV, ECI checkboxes
          doc.text(item.text, 20, y);
          
          let xOffset = 115;
          const sispItems = [
            { key: 'verificarAsc', text: 'ASC' },
            { key: 'verificarCsv', text: 'CSV' },
            { key: 'verificarEci', text: 'ECI' }
          ];
          
          sispItems.forEach(subItem => {
            const itemKey = subItem.key as keyof typeof tasks.turno1;
            drawCheckbox(xOffset, y - 3, ensureBoolean(tasks.turno1[itemKey]));
            doc.text(subItem.text, xOffset + 5, y);
            xOffset += 20;
          });
          
          y += 6;
        } else {
          doc.text(item.text, 20, y);
          y += 6;
        }
        
        // Add sub-items for backupsDiferidos
        if (item.key === 'backupsDiferidos') {
          const backupItems = [
            { key: 'bmjrn', text: "BMJRN (2 tapes/alterar 1 por mês/inicializar no inicio do mês)" },
            { key: 'grjrcv', text: "GRJRCV (1 tape)" },
            { key: 'aujrn', text: "AUJRN (1tape)" },
            { key: 'mvdia1', text: "MVDIA1 (eliminar obj. após save N)" },
            { key: 'mvdia2', text: "MVDIA2 (eliminar obj. após save S)" },
            { key: 'brjrn', text: "BRJRN (1tape)" }
          ];
          
          backupItems.forEach(item => {
            y = checkPageSpace(y, 8);
            drawCheckbox(25, y - 3, ensureBoolean(tasks.turno1[item.key as keyof typeof tasks.turno1]));
            doc.text(item.text, 30, y);
            y += 6;
          });
        }
        
        // Add sub-items for enviarFicheiroCom
        if (item.key === 'enviarFicheiroCom') {
          y = checkPageSpace(y, 8);
          doc.text("Dias:", 25, y);
          
          let xOffset = 40;
          const comDaysItems = [
            { key: 'dia01', text: '01' },
            { key: 'dia08', text: '08' },
            { key: 'dia16', text: '16' },
            { key: 'dia23', text: '23' }
          ];
          
          comDaysItems.forEach(item => {
            drawCheckbox(xOffset, y - 3, ensureBoolean(tasks.turno1[item.key as keyof typeof tasks.turno1]));
            doc.text(item.text, xOffset + 5, y);
            xOffset += 20;
          });
          y += 6;
        }
      });
      
      // Observations with rectangle
      y = checkPageSpace(y, 30);
      y = drawObservationsBox(y, turn.observations);
    }
    
    // Process tasks for Turno 2
    if (turnKey === 'turno2') {
      const taskList = [
        {key: 'datacenter', text: "Verificar Alarmes e Sistemas/Climatização DATA CENTER"},
        {key: 'sistemas', text: "Verificar Sistemas: BCACV1/BCACV2"},
        {key: 'servicos', text: "Verificar Serviços: Vinti24/BCADireto/Replicação/Servidor MIA"},
        {key: 'verificarReportes', text: "Verificar envio de reportes (INPS, VISTO USA, BCV, IMPC)"},
        {key: 'verificarDebitos', text: "Verificar Débitos/Créditos Aplicados no Turno Anterior"},
        {key: 'confirmarAtualizacaoSisp', text: "Confirmar Atualização SISP"}
      ];
      
      // Process basic tasks
      taskList.forEach(item => {
        y = checkPageSpace(y, 8);
        drawCheckbox(15, y - 3, ensureBoolean(tasks.turno2[item.key as keyof typeof tasks.turno2]));
        doc.setFontSize(10);
        doc.text(item.text, 20, y);
        y += 6;
      });
      
      // Ficheiros INPS
      y = checkPageSpace(y, 10);
      doc.setFont("helvetica", "bold");
      doc.text("Ficheiros INPS:", 15, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      
      const inpsItems = [
        { key: 'inpsProcessar', text: "Processar" },
        { key: 'inpsEnviarRetorno', text: "Enviar Retorno" }
      ];
      
      inpsItems.forEach(item => {
        y = checkPageSpace(y, 8);
        drawCheckbox(20, y - 3, ensureBoolean(tasks.turno2[item.key as keyof typeof tasks.turno2]));
        doc.text(item.text, 25, y);
        y += 6;
      });
      
      // Continue with remaining tasks in order
      const remainingTasks = [
        {key: 'processarTef', text: "Processar ficheiros TEF - ERR/RTR/RCT"},
        {key: 'processarTelecomp', text: "Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR"}
      ];
      
      remainingTasks.forEach(item => {
        y = checkPageSpace(y, 8);
        drawCheckbox(15, y - 3, ensureBoolean(tasks.turno2[item.key as keyof typeof tasks.turno2]));
        doc.text(item.text, 20, y);
        y += 6;
      });
      
      // Enviar Ficheiro
      y = checkPageSpace(y, 10);
      doc.setFont("helvetica", "bold");
      doc.text("Enviar Ficheiro:", 15, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      
      const ficheirosItems = [
        { key: 'enviarEci', text: "ECI" },
        { key: 'enviarEdv', text: "EDV" }
      ];
      
      ficheirosItems.forEach(item => {
        y = checkPageSpace(y, 8);
        drawCheckbox(20, y - 3, ensureBoolean(tasks.turno2[item.key as keyof typeof tasks.turno2]));
        doc.text(item.text, 25, y);
        y += 6;
      });
      
      // Final tasks
      const finalTasks = [
        {key: 'confirmarAtualizacaoFicheiros', text: "Confirmar Atualização Ficheiros Enviados à SISP (ECI * ENV/IMA)"},
        {key: 'validarSaco', text: "Validar Saco 1935"},
        {key: 'verificarPendentes', text: "Verificar Pendentes dos Balcões"},
        {key: 'fecharBalcoes', text: "Fechar os Balcões Centrais"}
      ];
      
      finalTasks.forEach(item => {
        y = checkPageSpace(y, 8);
        drawCheckbox(15, y - 3, ensureBoolean(tasks.turno2[item.key as keyof typeof tasks.turno2]));
        doc.text(item.text, 20, y);
        y += 6;
      });
      
      // Observations with rectangle
      y = checkPageSpace(y, 30);
      y = drawObservationsBox(y, turn.observations);
    }
    
    // Process tasks for Turno 3
    if (turnKey === 'turno3') {
      // Add Header for Turno 3
      y = checkPageSpace(y, 10);
      doc.setFont("helvetica", "bold");
      doc.text("Operações Fecho Dia", 15, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      
      // List all turno3 tasks in the correct order
      const operacoesFechoTasks = [
        {key: 'verificarDebitos', text: "Verificar Débitos/Créditos Aplicados no Turno Anterior"},
        {key: 'tratarTapes', text: "Tratar e trocar Tapes BM, BMBCK – percurso 7622"},
        {key: 'fecharServidores', text: "Fechar Servidores Teste e Produção"},
        {key: 'fecharImpressoras', text: "Fechar Impressoras e balcões centrais abertos exceto 14 - DSI"},
        {key: 'userFecho', text: "User Fecho Executar o percurso 7624 Save SYS1OB"},
        {key: 'listaRequisicoesCheques', text: "Lista requisições de cheques do dia 7633. > do que 5, sem comprov. Estornar, 21911"},
        {key: 'cancelarCartoesClientes', text: "User Fecho Cancela os cartões dos Clientes Bloqueados - percurso 76857"},
        {key: 'prepararEnviarAsc', text: "Preparar e enviar ficheiro e ASC (alteração situação cartão) – percurso 4132"},
        {key: 'adicionarRegistrosBanka', text: "User Fecho Adiciona registos na Banka Remota- percurso 768975"},
        {key: 'fecharServidoresBanka', text: "User Fecho, fechar servidores Banka remota IN1/IN3/IN4"},
        {key: 'alterarInternetBanking', text: "User Fecho Alterar Internet Banking para OFFLINE – percurso 49161"},
        {key: 'prepararEnviarCsv', text: "Preparar e enviar ficheiro CSV (saldos)"}
      ];
      
      operacoesFechoTasks.forEach(item => {
        y = checkPageSpace(y, 8);
        drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[item.key as keyof typeof tasks.turno3]));
        doc.setFontSize(10);
        doc.text(item.text, 20, y);
        y += 6;
      });

      // Handle "Interromper o Real-Time" with time inline
      y = checkPageSpace(y, 8);
      drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3.fecharRealTime));
      const realTimeText = tasks.turno3.fecharRealTimeHora ? 
        `Interromper o Real-Time com a SISP - ${tasks.turno3.fecharRealTimeHora}` :
        "Interromper o Real-Time com a SISP";
      doc.text(realTimeText, 20, y);
      y += 6;
      
      // Continue with remaining tasks in order
      const midTasks = [
        {key: 'prepararEnviarEtr', text: "Preparar e enviar Ficheiro ETR - percurso 7538, consultar conta 18 5488103"},
        {key: 'fazerLoggOffAml', text: "Fazer Logg-Off do utilizador AML – Percurso 161 (utilizadores ativos)"},
        {key: 'aplicarFicheiroErroEtr', text: "Aplicar Ficheiro Erro ETR"},
        {key: 'validarBalcao14', text: "Validar balção 14 7185"},
        {key: 'fecharBalcao14', text: "Fechar o balcão 14 - DSI e confirmar se todos os balcões encontram-se fechados"},
        {key: 'arranqueManual', text: "Arranque Manual - Verificar Data da Aplicação – Percurso 431"}
      ];
      
      midTasks.forEach(item => {
        y = checkPageSpace(y, 8);
        drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[item.key as keyof typeof tasks.turno3]));
        doc.text(item.text, 20, y);
        y += 6;
      });
      
      // Handle "Início do Fecho" with time inline
      y = checkPageSpace(y, 8);
      drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3.inicioFecho));
      const inicioFechoText = tasks.turno3.inicioFechoHora ? 
        `Início do Fecho - ${tasks.turno3.inicioFechoHora}` :
        "Início do Fecho";
      doc.text(inicioFechoText, 20, y);
      y += 6;
      
      // Continue with the rest of the tasks
      const finalOperacoesTasks = [
        {key: 'validarEnvioEmail', text: "Validar envio email (Notificação Inicio Fecho) a partir do ISeries"},
        {key: 'controlarTrabalhos', text: "Controlar os trabalhos no QBATCH (opções 5, 10, F10, F5, F18)"},
        {key: 'saveBmbck', text: "Save BMBCK – Automático"},
        {key: 'abrirServidoresInternet', text: "Abrir Servidores Internet Banking – Percurso 161–"},
        {key: 'imprimirCheques', text: "Imprimir Cheques e Diários de Cheques (depois do Save BMBCK)"},
        {key: 'backupBm', text: "Backup BM – Automático"}
      ];
      
      finalOperacoesTasks.forEach(item => {
        y = checkPageSpace(y, 8);
        drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[item.key as keyof typeof tasks.turno3]));
        doc.text(item.text, 20, y);
        y += 6;
      });
      
      // Add header for "Depois do Fecho" section
      y = checkPageSpace(y, 15);
      doc.setFont("helvetica", "bold");
      doc.text("Depois do Fecho", 15, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      
      const depoisFechoTasks = [
        {key: 'validarFicheiroCcln', text: "Validar ficheiro CCLN - 76853"},
        {key: 'aplicarFicheirosCompensacao', text: "Aplicar ficheiros compensação SISP (CCLN, EDST, EORI, ERMB)"}
      ];
      
      depoisFechoTasks.forEach(item => {
        y = checkPageSpace(y, 8);
        drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[item.key as keyof typeof tasks.turno3]));
        doc.text(item.text, 20, y);
        y += 6;
      });
      
      // Handle "Validar saldo da conta" with value and checkboxes
      y = checkPageSpace(y, 8);
      drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3.validarSaldoConta));
      const saldoText = tasks.turno3.saldoContaValor ? 
        `Validar saldo da conta 18/5488102 - ${tasks.turno3.saldoContaValor}` :
        "Validar saldo da conta 18/5488102";
      doc.text(saldoText, 20, y);
      y += 6;
      
      // Add the saldoPositivo and saldoNegativo checkboxes
      y = checkPageSpace(y, 8);
      drawCheckbox(20, y - 3, ensureBoolean(tasks.turno3.saldoPositivo));
      doc.text("Positivo", 25, y);
      drawCheckbox(60, y - 3, ensureBoolean(tasks.turno3.saldoNegativo));
      doc.text("Negativo", 65, y);
      y += 6;
      
      // Handle "Abrir o Real-Time" with time inline
      y = checkPageSpace(y, 8);
      drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3.abrirRealTime));
      const abrirRealTimeText = tasks.turno3.abrirRealTimeHora ? 
        `Abrir o Real-Time - ${tasks.turno3.abrirRealTimeHora}` :
        "Abrir o Real-Time";
      doc.text(abrirRealTimeText, 20, y);
      y += 6;
      
      // Remaining tasks
      const remainingTasks = [
        {key: 'verificarTransacoes', text: "Verificar a entrada de transações 3100 4681"},
        {key: 'aplicarFicheiroVisa', text: "Aplicar ficheiro VISA DAF - com o user FECHO 4131"},
        {key: 'cativarCartoes', text: "Cativar cartões de crédito em incumprimento - com o user FECHO – 7675"},
        {key: 'abrirBcaDireto', text: "Abrir o BCADireto percurso 49162 – Validar transações"},
        {key: 'abrirServidoresBanka', text: "User Fecho, Abril servidores Banka remota IN1/IN3/IN4"},
        {key: 'atualizarTelefonesOffline', text: "Atualiza Telefones tratados no OFFLINE- percurso 768976"},
        {key: 'verificarReplicacao', text: "Verificar Replicação"},
        {key: 'enviarFicheiroCsv', text: "Enviar ficheiro CSV (Comunicação Saldo Véspera)"},
        {key: 'transferirFicheirosLiquidity', text: "Transferência ficheiros SSM Liquidity Exercices (Confirmação)"},
        {key: 'percurso76921', text: "Fazer o percurso 76921 – Limpeza Ficheiro BRLOGED (Dia 1 de cada Mês)"},
        {key: 'percurso76922', text: "Fazer o percurso 76922 - Reorganiza BRLOGED (Dia 2 de cada Mês)"},
        {key: 'percurso76923', text: "Fazer o percurso 76923 - Reorganiza GBMVCO (Dia 3 de cada Mês)"},
        {key: 'abrirServidoresTesteProducao', text: "Abrir Servidores Teste e Produção"},
        {key: 'impressaoCheques', text: "Impressão Cheques e respectivos Diários (verificação dos mesmos)"},
        {key: 'arquivarCheques', text: "Arquivar Cheques e respectivos Diários"}
      ];
      
      remainingTasks.forEach(item => {
        y = checkPageSpace(y, 8);
        drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3[item.key as keyof typeof tasks.turno3]));
        doc.text(item.text, 20, y);
        y += 6;
      });
      
      // Handle "Término do Fecho" with time inline
      y = checkPageSpace(y, 8);
      drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3.terminoFecho));
      const terminoFechoText = tasks.turno3.terminoFechoHora ? 
        `Término do Fecho - ${tasks.turno3.terminoFechoHora}` :
        "Término do Fecho";
      doc.text(terminoFechoText, 20, y);
      y += 6;
      
      // Final task
      y = checkPageSpace(y, 8);
      drawCheckbox(15, y - 3, ensureBoolean(tasks.turno3.transferirFicheirosDsi));
      doc.text("Transferência ficheiros SSM Liquidity ExercicesDSI-CI/2023", 20, y);
      y += 6;
      
      // Observations with rectangle
      y = checkPageSpace(y, 30);
      y = drawObservationsBox(y, turn.observations);
    }
  });
  
  // Add table if there are any valid rows
  const validRows = tableRows.filter(row => 
    row.hora.trim() !== '' || 
    row.tarefa.trim() !== '' || 
    row.nomeAs.trim() !== '' || 
    row.operacao.trim() !== '' || 
    row.executado.trim() !== ''
  );
  
  if (validRows.length > 0) {
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.text("Tabela de Processamentos", 15, 20);
    
    const data = validRows.map(row => [
      row.hora, 
      row.tarefa, 
      row.nomeAs, 
      row.operacao, 
      row.executado
    ]);
    
    autoTable(doc, {
      head: [['Hora', 'Tarefa', 'Nome AS400', 'Nº Operação', 'Executado Por']],
      body: data,
      startY: 25,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 0, 0], // Changed to black
        textColor: [255, 255, 255], // White text
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: [0, 0, 0] // Black text
      }
    });
  }
  
  return doc;
};
