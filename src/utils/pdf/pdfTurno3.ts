
import { jsPDF } from 'jspdf';
import { Turno3Tasks } from '@/types/taskboard';
import { 
  checkPageSpace, 
  drawCheckbox, 
  drawObservationsBox, 
  ensureBoolean, 
  drawSectionHeader,
  drawSubsectionTitle,
  BCA_COLORS,
  drawHighlightedTask
} from './pdfCommon';

export const renderTurno3Tasks = (
  doc: jsPDF, 
  tasks: Turno3Tasks,
  observations: string,
  startY: number,
  isDiaNaoUtil: boolean = false,
  isEndOfMonth: boolean = false
): number => {
  let y = startY;
  
  // Section Header with colored background
  y = checkPageSpace(doc, y, 15);
  const sectionTitle = isDiaNaoUtil ? "Operações Dia Não Útil" : "Operações Fecho Dia";
  y = drawSectionHeader(doc, sectionTitle, y);
  y += 4;
  
  // --- PAGE 1 TASKS ---
  const page1Tasks = [
    {key: 'datacenter', text: "Verificar Alarmes e Sistemas/Climatização DATA CENTER"},
    {key: 'sistemas', text: "Verificar Sistemas: BCACV1 / BCACV2 - Verificar Replicação"},
    {key: 'verificarDebitos', text: "Verificar Débitos/Créditos Aplicados no Turno Anterior"},
    {key: 'tratarTapes', text: "Tratar Tapes BM, BMBCK –7622 e Confirmar estado tapes no robot"},
    {key: 'fecharServidores', text: "Fechar Servidores SWIFT, STPCV, OPDIF, TRMSG, CDGOV MWEXT e AML"},
    {key: 'fecharImpressoras', text: "Fechar Impressoras e balcões centrais abertos exceto 14 DSI e 22 DMC"},
    {key: 'requisicoesCheques', text: "Requisições cheques do dia 7633. Estornar se superior a 5, sem pedido balcão, 21911"},
    {key: 'gerarFicheiroAsc', text: "Gerar e enviar ficheiro e ASC – percurso 4132 / Validar sequência portal SISP"},
    {key: 'fecharBalcao22', text: "Fechar balcão 22 DMC (Pedir utilizadores para saírem do sistema) (23h00)"},
    {key: 'userFecho7624', text: "User Fecho Executar o percurso 7624 Save SYS1OB (23h00)"},
    {key: 'userFechoBankaRemota', text: "User Fecho Adiciona registos na Banka Remota- percurso 768975"},
    {key: 'userFechoServidoresBanka', text: "User Fecho, fechar servidores Banka Remota IN1/IN3/IN4"},
    {key: 'userFechoInternetBanking', text: "User Fecho Alterar Internet Banking para OFFLINE – percurso 49161"},
    {key: 'fecharPfs', text: "Fechar Servidores PFS"},
    {key: 'prepararCsv', text: "Preparar e enviar ficheiro CSV (saldos)"},
    {key: 'interromperRealTime', text: "Interromper o Real-Time com a SISP"},
    {key: 'percurso768989', text: "Percurso 768989 (Alterar fecho transferências de 2 para 1)"},
    {key: 'prepararFicheiroEtr', text: "Preparar e enviar Ficheiro ETR - percurso 7538, consultar conta 18 5488103"},
    {key: 'loggOffUtilizadores', text: "Fazer Logg-Off utilizadores AML PFS, MWEXT"},
    {key: 'aplicarFicheiroErro', text: "Aplicar Ficheiro Erro ETR"},
    {key: 'validarBalcao14', text: "Validar balcão 14 7185"},
    {key: 'bloquearNearsoft', text: "Bloquear NEARSOFT e Remover Utilizadores ativos"},
    {key: 'fecharBalcao14', text: "Fechar o balcão 14 - DSI e confirmar se todos os balcões encontram-se fechados"},
    {key: 'percurso43', text: "Percurso 43 Verificar Data da Aplicação"},
    {key: 'inicioFecho', text: "Início do Fecho"},
    {key: 'enviarSmsArranque', text: "Enviar SMS de Notificação de Arranque do Fecho"},
    {key: 'validarEnvioEmail', text: "Validar envio email (Notificação Inicio Fecho) a partir do ISeries"},
    {key: 'controlarTrabalhos', text: "Controlar os trabalhos no QBATCH (opções 5, 10, F10, F5, F18)"},
    {key: 'paragemAberturaServidores', text: "Paragem abertura Servidores Banka Remota CT2/IAR/INT/IV2"},
    {key: 'ativarNearsoft', text: "Ativar NEARSOFT"}
  ];

  page1Tasks.forEach((item, index) => {
    y = checkPageSpace(doc, y, 7);
    drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks[item.key as keyof typeof tasks]));
    doc.setFontSize(10);
    
    // Bold specific tasks or portions of string based on the requirements
    let cx = 22;
    if (item.key === 'percurso768989') {
      doc.setFont("helvetica", "normal");
      doc.text(item.text, cx, y);
      const textWidth = doc.getTextWidth(item.text);
      doc.line(cx, y + 1, cx + textWidth, y + 1);
    } else if (item.key === 'interromperRealTime') {
      doc.setFont("helvetica", "normal");
      doc.text("Interromper o Real-Time com a SISP           Fecho Real-Time: ", cx, y);
      cx += doc.getTextWidth("Interromper o Real-Time com a SISP           Fecho Real-Time: ");
      if (tasks.interromperRealTimeHora) {
        doc.text(tasks.interromperRealTimeHora, cx, y);
      } else {
        doc.text("___:___", cx, y);
      }
    } else if (item.key === 'inicioFecho') {
      doc.setFont("helvetica", "bold");
      doc.text("Início do Fecho ", cx, y);
      cx += doc.getTextWidth("Início do Fecho   ");
      doc.setFont("helvetica", "normal");
      if (tasks.inicioFechoHora) {
        doc.text(tasks.inicioFechoHora, cx, y);
      } else {
        doc.text("____:____", cx, y);
      }
    } else if (item.key === 'enviarSmsArranque') {
      doc.setFont("helvetica", "bold");
      doc.text(item.text, cx, y);
      const textWidth = doc.getTextWidth(item.text);
      doc.line(cx, y + 1, cx + textWidth, y + 1); // Underlined
      doc.setFont("helvetica", "normal");
    } else if (item.key === 'ativarNearsoft') {
      doc.setFont("helvetica", "bold");
      doc.text(item.text, cx, y);
      doc.setFont("helvetica", "normal");
    } else if (item.key === 'fecharServidores') {
      doc.setFont("helvetica", "normal");
      doc.text("Fechar Servidores ", cx, y);
      cx += doc.getTextWidth("Fechar Servidores ");
      doc.setFont("helvetica", "bold");
      doc.text("SWIFT, STPCV, OPDIF, TRMSG, CDGOV MWEXT e AML", cx, y);
      doc.setFont("helvetica", "normal");
    } else if (item.key === 'fecharPfs') {
      doc.setFont("helvetica", "normal");
      doc.text("Fechar Servidores ", cx, y);
      cx += doc.getTextWidth("Fechar Servidores ");
      doc.setFont("helvetica", "bold");
      doc.text("PFS", cx, y);
      doc.setFont("helvetica", "normal");
    } else if (item.key === 'sistemas') {
      doc.setFont("helvetica", "normal");
      doc.text("Verificar Sistemas: ", cx, y);
      cx += doc.getTextWidth("Verificar Sistemas: ");
      doc.setFont("helvetica", "bold");
      doc.text("BCACV1 / BCACV2 - Verificar Replicação", cx, y);
      doc.setFont("helvetica", "normal");
    } else if (item.key === 'datacenter') {
      doc.setFont("helvetica", "normal");
      doc.text("Verificar Alarmes e Sistemas/Climatização ", cx, y);
      cx += doc.getTextWidth("Verificar Alarmes e Sistemas/Climatização ");
      doc.setFont("helvetica", "bold");
      doc.text("DATA CENTER", cx, y);
      doc.setFont("helvetica", "normal");
    } else {
      doc.setFont("helvetica", "normal");
      doc.text(item.text, cx, y);
    }
    
    y += 6;
  });

  // Forçar Página 2! O array é enorme, se nao houver espaco.
  doc.addPage();
  y = 20;

  // --- PAGE 2 TASKS ---
  const page2Tasks = [
    {key: 'saveBmbck', text: "Save BMBCK – Automático"},
    {key: 'imprimirCheques', text: "Imprimir Cheques, Diários de Cheques e Arquivar OUTQ(HLDSPOOL)"},
    {key: 'backupBm', text: "Backup BM – Automático"},
    {key: 'aplicarFicheirosCompensacao', text: "Aplicar ficheiros compensação SISP com user SISP (CCLN, EDST, EORI, ERMB)"},
    {key: 'tratarPendentesCartoes', text: "Tratar Pendentes CARTÕES (Conta contabilística 18 5488106)"},
    {key: 'consultarSaldoConta', text: "Consultar saldo da conta 18/5488102:"}, // With Neg Pos inside
    {key: 'abrirRealTime', text: "Abrir o Real-Time com a SISP"},
    {key: 'verificarEntradaTransacoes', text: "Verificar a entrada de transações 3100 4681"},
    {key: 'abrirBcaDireto', text: "Abrir o BCADireto percurso 49162 – Validar transações"},
    {key: 'userFechoAbrirServidores', text: "User Fecho, Abrir servidores Banka remota IN1/IN3/IN4"},
    {key: 'abrirServidoresPfs', text: "Abrir Servidores PFS, MWEXT e AML"},
    {key: 'atualizaTelefones', text: "Atualiza Telefones tratados no OFFLINE- percurso 768976"},
    {key: 'efetuarTesteCarregamento', text: "Efetuar Teste Carregamento e enviar evidência"},
    {key: 'verificarReplicacao', text: "Verificar Replicação"},
    {key: 'enviarFicheiroCsv', text: "Enviar ficheiro CSV (Comunicação Saldo Véspera)"},
    {key: 'terminoFecho', text: "Término do Fecho"},
    {key: 'enviarSmsFim', text: "Enviar SMS de Notificação de Fim do Fecho"}
  ];

  page2Tasks.forEach((item) => {
    y = checkPageSpace(doc, y, 7);
    drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks[item.key as keyof typeof tasks]));
    doc.setFont("helvetica", "normal");

    let cx = 22;
    if (item.key === 'aplicarFicheirosCompensacao') {
      doc.text("Aplicar ficheiros compensação SISP com user SISP (", cx, y);
      cx += doc.getTextWidth("Aplicar ficheiros compensação SISP com user SISP (");
      doc.setFont("helvetica", "bold");
      doc.text("CCLN, EDST, EORI, ERMB", cx, y);
      cx += doc.getTextWidth("CCLN, EDST, EORI, ERMB");
      doc.setFont("helvetica", "normal");
      doc.text(")", cx, y);
    } else if (item.key === 'consultarSaldoConta') {
      doc.text("Consultar saldo da conta ", cx, y);
      cx += doc.getTextWidth("Consultar saldo da conta ");
      doc.setFont("helvetica", "bold");
      doc.text("18/5488102:   ", cx, y);
      cx += doc.getTextWidth("18/5488102:   ");
      doc.setFont("helvetica", "normal");
      
      if (tasks.saldoContaValor) {
        doc.text(tasks.saldoContaValor.toString(), cx, y);
        cx += doc.getTextWidth(tasks.saldoContaValor.toString()) + 5;
      } else {
        doc.text("0", cx, y);
        cx += doc.getTextWidth("0") + 5;
      }

      doc.text("Negativo ", cx, y);
      drawCheckbox(doc, cx + 15, y - 3, ensureBoolean(tasks.saldoNegativo));
      
      cx += 25;
      doc.text("Positivo ", cx, y);
      drawCheckbox(doc, cx + 14, y - 3, ensureBoolean(tasks.saldoPositivo));

    } else if (item.key === 'abrirRealTime') {
      doc.setFont("helvetica", "bold");
      doc.text("Abrir o Real-Time ", cx, y);
      cx += doc.getTextWidth("Abrir o Real-Time ");
      doc.setFont("helvetica", "normal");
      doc.text("com a SISP           ", cx, y);
      cx += doc.getTextWidth("com a SISP           ");
      
      doc.setFont("helvetica", "bold");
      doc.text("Abertura Real-Time: ", cx, y);
      cx += doc.getTextWidth("Abertura Real-Time: ");
      doc.setFont("helvetica", "normal");
      if (tasks.abrirRealTimeHora) {
        doc.text(tasks.abrirRealTimeHora, cx, y);
      } else {
        doc.text("___:___", cx, y);
      }
    } else if (item.key === 'verificarEntradaTransacoes') {
      doc.text("Verificar a entrada de transações ", cx, y);
      cx += doc.getTextWidth("Verificar a entrada de transações ");
      doc.setFont("helvetica", "bold");
      doc.text("3100 4681", cx, y);
    } else if (item.key === 'abrirBcaDireto') {
      doc.text("Abrir o ", cx, y);
      cx += doc.getTextWidth("Abrir o ");
      doc.setFont("helvetica", "bold");
      doc.text("BCADireto", cx, y);
      cx += doc.getTextWidth("BCADireto");
      doc.setFont("helvetica", "normal");
      doc.text(" percurso ", cx, y);
      cx += doc.getTextWidth(" percurso ");
      doc.setFont("helvetica", "bold");
      doc.text("49162 – Validar transações", cx, y);
    } else if (item.key === 'atualizaTelefones') {
      doc.text("Atualiza Telefones tratados no OFFLINE- ", cx, y);
      cx += doc.getTextWidth("Atualiza Telefones tratados no OFFLINE- ");
      doc.setFont("helvetica", "bold");
      doc.text("percurso 768976", cx, y);
    } else if (item.key === 'enviarFicheiroCsv') {
      doc.text("Enviar ficheiro ", cx, y);
      cx += doc.getTextWidth("Enviar ficheiro ");
      doc.setFont("helvetica", "bold");
      doc.text("CSV (Comunicação Saldo Véspera)", cx, y);
    } else if (item.key === 'terminoFecho') {
      doc.setFont("helvetica", "bold");
      doc.text("Término do Fecho  ", cx, y);
      cx += doc.getTextWidth("Término do Fecho  ");
      doc.setFont("helvetica", "normal");
      if (tasks.terminoFechoHora) {
        doc.text(tasks.terminoFechoHora, cx, y);
      } else {
        doc.text("____:____", cx, y);
      }
    } else if (item.key === 'enviarSmsFim') {
      doc.setFont("helvetica", "bold");
      doc.text(item.text, cx, y);
      const textWidth = doc.getTextWidth(item.text);
      doc.line(cx, y + 1, cx + textWidth, y + 1); // Underlined
      doc.setFont("helvetica", "normal");
    } else {
      doc.text(item.text, cx, y);
    }
    y += 6;
  });

  // End of Month tasks block
  y += 10;
  const mensalTasks = [
    {key: 'percurso76921', text: "Fazer o percurso 76921 – Limpeza Ficheiro BRLOGED (Dia 1 de cada Mês)"},
    {key: 'percurso76922', text: "Fazer o percurso 76922 - Reorganiza BRLOGED (Dia 2 de cada Mês)"},
    {key: 'percurso76923', text: "Fazer o percurso 76923 - Reorganiza GBMVCO (Dia 3 de cada Mês)"}
  ];
  
  mensalTasks.forEach((item) => {
    drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks[item.key as keyof typeof tasks]));
    doc.text(item.text, 22, y);
    y += 6;
  });

  // Impressões
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Impressões", 15, y);
  const impWidth = doc.getTextWidth("Impressões");
  doc.line(15, y + 1, 15 + impWidth, y + 1);
  doc.setFont("helvetica", "normal");
  y += 8;

  doc.text("• Ter em atenção ao stock/substituição de Toner/Fita impressora PRT", 20, y);
  const imp2Width = doc.getTextWidth("• Ter em atenção ao stock/substituição de Toner/Fita impressora PRT");
  doc.line(20, y + 1, 20 + imp2Width, y + 1);
  y += 8;

  const impressaoTasks = [
    {key: 'impressaoCheques', text: "Impressão Cheques e respectivos Diários (verificação dos mesmos)"},
    {key: 'arquivarCheques', text: "Arquivar Cheques e respectivos Diários"}
  ];

  impressaoTasks.forEach((item) => {
    drawCheckbox(doc, 25, y - 3, ensureBoolean(tasks[item.key as keyof typeof tasks]));
    doc.text(item.text, 32, y);
    y += 6;
  });

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Situações Pontuais", 15, y);
  doc.line(15, y + 1, 15 + doc.getTextWidth("Situações Pontuais"), y + 1);
  doc.setFont("helvetica", "normal");
  
  y += 10;
  return drawObservationsBox(doc, y, observations);
};
