
import { jsPDF } from 'jspdf';
import { Turno3Tasks } from '@/types/taskboard';
import { checkPageSpace, drawCheckbox, drawObservationsBox, ensureBoolean } from './pdfCommon';

export const renderTurno3Tasks = (
  doc: jsPDF, 
  tasks: Turno3Tasks,
  observations: string,
  startY: number,
  isDiaNaoUtil: boolean = false, // Parameter to handle the non-utility day case
  isEndOfMonth: boolean = false  // New parameter to handle end-of-month specific tasks
): number => {
  let y = startY;
  
  // Add Header for Turno 3
  y = checkPageSpace(doc, y, 10);
  doc.setFont("helvetica", "normal"); // Changed from bold to normal
  
  // If it's a "Dia Não Útil", change the header
  if (isDiaNaoUtil) {
    doc.text("Operações Dia Não Útil", 15, y);
  } else {
    doc.text("Operações Fecho Dia", 15, y);
  }
  
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
    y = checkPageSpace(doc, y, 8);
    drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks[item.key as keyof typeof tasks]));
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal"); // Ensure consistent normal font weight
    doc.text(item.text, 20, y);
    y += 6;
  });

  // Handle "Interromper o Real-Time" with time inline
  y = checkPageSpace(doc, y, 8);
  drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks.fecharRealTime));
  const realTimeText = tasks.fecharRealTimeHora ? 
    `Interromper o Real-Time com a SISP - ${tasks.fecharRealTimeHora}` :
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
    y = checkPageSpace(doc, y, 8);
    drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks[item.key as keyof typeof tasks]));
    doc.text(item.text, 20, y);
    y += 6;
  });
  
  // Handle "Início do Fecho" with time inline
  y = checkPageSpace(doc, y, 8);
  drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks.inicioFecho));
  const inicioFechoText = tasks.inicioFechoHora ? 
    `Início do Fecho - ${tasks.inicioFechoHora}` :
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
    y = checkPageSpace(doc, y, 8);
    drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks[item.key as keyof typeof tasks]));
    doc.text(item.text, 20, y);
    y += 6;
  });
  
  // Add header for "Depois do Fecho" section
  y = checkPageSpace(doc, y, 15);
  doc.setFont("helvetica", "normal"); // Changed from bold to normal
  doc.text("Depois do Fecho", 15, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  
  const depoisFechoTasks = [
    {key: 'validarFicheiroCcln', text: "Validar ficheiro CCLN - 76853"},
    {key: 'aplicarFicheirosCompensacao', text: "Aplicar ficheiros compensação SISP (CCLN, EDST, EORI, ERMB)"}
  ];
  
  depoisFechoTasks.forEach(item => {
    y = checkPageSpace(doc, y, 8);
    drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks[item.key as keyof typeof tasks]));
    doc.text(item.text, 20, y);
    y += 6;
  });
  
  // Handle "Validar saldo da conta" with value and checkboxes
  y = checkPageSpace(doc, y, 8);
  drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks.validarSaldoConta));
  const saldoText = tasks.saldoContaValor ? 
    `Validar saldo da conta 18/5488102 - ${tasks.saldoContaValor}` :
    "Validar saldo da conta 18/5488102";
  doc.text(saldoText, 20, y);
  y += 6;
  
  // Add the saldoPositivo and saldoNegativo checkboxes
  y = checkPageSpace(doc, y, 8);
  drawCheckbox(doc, 20, y - 3, ensureBoolean(tasks.saldoPositivo));
  doc.text("Positivo", 25, y);
  drawCheckbox(doc, 60, y - 3, ensureBoolean(tasks.saldoNegativo));
  doc.text("Negativo", 65, y);
  y += 6;
  
  // Handle "Abrir o Real-Time" with time inline
  y = checkPageSpace(doc, y, 8);
  drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks.abrirRealTime));
  const abrirRealTimeText = tasks.abrirRealTimeHora ? 
    `Abrir o Real-Time - ${tasks.abrirRealTimeHora}` :
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
    {key: 'percurso76923', text: "Fazer o percurso 76923 - Reorganiza GBMVCO (Dia 3 de cada Mês)"}
  ];
  
  remainingTasks.forEach(item => {
    y = checkPageSpace(doc, y, 8);
    drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks[item.key as keyof typeof tasks]));
    doc.text(item.text, 20, y);
    y += 6;
  });
  
  // End of month specific task
  if (isEndOfMonth && tasks.limpaGbtrlogFimMes !== undefined) {
    y = checkPageSpace(doc, y, 8);
    drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks.limpaGbtrlogFimMes));
    doc.text("Chamar Opção 16 - Limpa o GBTRLOG após o Fecho do mês", 20, y);
    y += 6;
  }
  
  // Final tasks
  const finalTasks = [
    {key: 'abrirServidoresTesteProducao', text: "Abrir Servidores Teste e Produção"},
    {key: 'impressaoCheques', text: "Impressão Cheques e respectivos Diários (verificação dos mesmos)"},
    {key: 'arquivarCheques', text: "Arquivar Cheques e respectivos Diários"}
  ];
  
  finalTasks.forEach(item => {
    y = checkPageSpace(doc, y, 8);
    drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks[item.key as keyof typeof tasks]));
    doc.text(item.text, 20, y);
    y += 6;
  });
  
  // Handle "Término do Fecho" with time inline
  y = checkPageSpace(doc, y, 8);
  drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks.terminoFecho));
  const terminoFechoText = tasks.terminoFechoHora ? 
    `Término do Fecho - ${tasks.terminoFechoHora}` :
    "Término do Fecho";
  doc.text(terminoFechoText, 20, y);
  y += 6;
  
  // Final task
  y = checkPageSpace(doc, y, 8);
  drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks.transferirFicheirosDsi));
  doc.text("Transferência ficheiros SSM Liquidity ExercicesDSI-CI/2023", 20, y);
  y += 6;
  
  // Observations with rectangle
  y = checkPageSpace(doc, y, 30);
  return drawObservationsBox(doc, y, observations);
};
