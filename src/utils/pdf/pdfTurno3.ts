
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Turno3Tasks } from '@/types/taskboard';

export function addTurno3TasksToPDF(doc: jsPDF, tasks: Turno3Tasks, startY: number, isEndOfMonth: boolean = false): number {
  let currentY = startY;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Turno 3 Tasks:", 14, currentY);
  currentY += 6;

  // Standard task list regardless of month date
  const standardTaskList = [
    { label: "Verificar Débitos", value: tasks.verificarDebitos },
    { label: "Tratar Tapes", value: tasks.tratarTapes },
    { label: "Fechar Servidores", value: tasks.fecharServidores },
    { label: "Fechar Impressoras", value: tasks.fecharImpressoras },
    { label: "User Fecho", value: tasks.userFecho },
    { label: "Lista Requisições Cheques", value: tasks.listaRequisicoesCheques },
    { label: "Cancelar Cartões Clientes", value: tasks.cancelarCartoesClientes },
    { label: "Preparar Enviar ASC", value: tasks.prepararEnviarAsc },
    { label: "Adicionar Registros Banka", value: tasks.adicionarRegistrosBanka },
    { label: "Fechar Servidores Banka", value: tasks.fecharServidoresBanka },
    { label: "Alterar Internet Banking", value: tasks.alterarInternetBanking },
    { label: "Preparar Enviar CSV", value: tasks.prepararEnviarCsv },
    { label: "Fechar Real Time", value: tasks.fecharRealTime },
    { label: "Preparar Enviar ETR", value: tasks.prepararEnviarEtr },
    { label: "Fazer Logg Off AML", value: tasks.fazerLoggOffAml },
    { label: "Aplicar Ficheiro Erro ETR", value: tasks.aplicarFicheiroErroEtr },
    { label: "Validar Balcao 14", value: tasks.validarBalcao14 },
    { label: "Fechar Balcao 14", value: tasks.fecharBalcao14 },
    { label: "Arranque Manual", value: tasks.arranqueManual },
    { label: "Início Fecho", value: tasks.inicioFecho },
    { label: "Validar Envio Email", value: tasks.validarEnvioEmail },
    { label: "Controlar Trabalhos", value: tasks.controlarTrabalhos },
    { label: "Save BMBCK", value: tasks.saveBmbck },
    { label: "Abrir Servidores Internet", value: tasks.abrirServidoresInternet },
    { label: "Imprimir Cheques", value: tasks.imprimirCheques },
    { label: "Backup BM", value: tasks.backupBm },
    { label: "Validar Ficheiro CCLN", value: tasks.validarFicheiroCcln },
    { label: "Aplicar Ficheiros Compensacao", value: tasks.aplicarFicheirosCompensacao },
    { label: "Validar Saldo Conta", value: tasks.validarSaldoConta },
    { label: "Abrir Real Time", value: tasks.abrirRealTime },
    { label: "Verificar Transacoes", value: tasks.verificarTransacoes },
    { label: "Aplicar Ficheiro Visa", value: tasks.aplicarFicheiroVisa },
    { label: "Cativar Cartoes", value: tasks.cativarCartoes },
    { label: "Abrir BCA Direto", value: tasks.abrirBcaDireto },
    { label: "Abrir Servidores Banka", value: tasks.abrirServidoresBanka },
    { label: "Atualizar Telefones Offline", value: tasks.atualizarTelefonesOffline },
    { label: "Verificar Replicacao", value: tasks.verificarReplicacao },
    { label: "Enviar Ficheiro CSV", value: tasks.enviarFicheiroCsv },
    { label: "Transferir Ficheiros Liquidity", value: tasks.transferirFicheirosLiquidity },
    { label: "Percurso 76921", value: tasks.percurso76921 },
    { label: "Percurso 76922", value: tasks.percurso76922 },
    { label: "Percurso 76923", value: tasks.percurso76923 },
    { label: "Abrir Servidores Teste Producao", value: tasks.abrirServidoresTesteProducao },
    { label: "Impressão Cheques", value: tasks.impressaoCheques },
    { label: "Arquivar Cheques", value: tasks.arquivarCheques },
    { label: "Término do Fecho", value: tasks.terminoFecho },
    { label: "Transferir Ficheiros DSI", value: tasks.transferirFicheirosDsi },
  ];
  
  // Create the taskList based on whether it's end of month or not
  let taskList = [...standardTaskList];
  
  // Add the limparGbtrlog task only if it's end of month
  if (isEndOfMonth) {
    taskList.push({ label: "Chamar Opção 16 - Limpa GBTRLOG Após o Fecho", value: tasks.limparGbtrlog });
  }

  doc.setFont('helvetica', 'normal');
  taskList.forEach(task => {
    if (task.value) {
      doc.text(`- ${task.label}`, 14, currentY);
      currentY += 5;
    }
  });

  return currentY;
}

// Export function that's referenced in pdfGenerator.ts
export function renderTurno3Tasks(doc: jsPDF, tasks: Turno3Tasks, observations: string, y: number, isDiaNaoUtil: boolean = false, isEndOfMonth: boolean = false): number {
  // Start with adding the tasks, passing the isEndOfMonth parameter
  let currentY = addTurno3TasksToPDF(doc, tasks, y, isEndOfMonth);
  
  // Add observation section if there are observations
  if (observations && observations.trim() !== '') {
    currentY += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', 14, currentY);
    currentY += 6;
    
    doc.setFont('helvetica', 'normal');
    const observationLines = doc.splitTextToSize(observations, 180);
    doc.text(observationLines, 14, currentY);
    currentY += 10 * (observationLines.length || 1);
  }
  
  return currentY;
}
