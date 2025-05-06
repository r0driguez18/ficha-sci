
import { jsPDF } from 'jspdf';
import { Turno2Tasks } from '@/types/taskboard';
import { checkPageSpace, drawCheckbox, drawObservationsBox, ensureBoolean } from './pdfCommon';

export const renderTurno2Tasks = (
  doc: jsPDF, 
  tasks: Turno2Tasks,
  observations: string,
  startY: number
): number => {
  let y = startY;
  
  // Process basic tasks
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
    y = checkPageSpace(doc, y, 8);
    drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks[item.key as keyof typeof tasks]));
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal"); // Ensure normal font weight
    doc.text(item.text, 20, y);
    y += 6;
  });
  
  // Ficheiros INPS
  y = checkPageSpace(doc, y, 10);
  doc.setFont("helvetica", "normal"); // Changed to normal, not bold
  doc.text("Ficheiros INPS:", 15, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  
  const inpsItems = [
    { key: 'inpsProcessar', text: "Processar" },
    { key: 'inpsEnviarRetorno', text: "Enviar Retorno" }
  ];
  
  inpsItems.forEach(item => {
    y = checkPageSpace(doc, y, 8);
    drawCheckbox(doc, 20, y - 3, ensureBoolean(tasks[item.key as keyof typeof tasks]));
    doc.text(item.text, 25, y);
    y += 6;
  });
  
  // Continue with remaining tasks in order
  const remainingTasks = [
    {key: 'processarTef', text: "Processar ficheiros TEF - ERR/RTR/RCT"},
    {key: 'processarTelecomp', text: "Processar ficheiros Telecompensação - RCB/RTC/FCT/IMR"}
  ];
  
  remainingTasks.forEach(item => {
    y = checkPageSpace(doc, y, 8);
    drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks[item.key as keyof typeof tasks]));
    doc.text(item.text, 20, y);
    y += 6;
  });
  
  // Enviar Ficheiro
  y = checkPageSpace(doc, y, 10);
  doc.setFont("helvetica", "normal"); // Changed to normal, not bold
  doc.text("Enviar Ficheiro:", 15, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  
  const ficheirosItems = [
    { key: 'enviarEci', text: "ECI" },
    { key: 'enviarEdv', text: "EDV" }
  ];
  
  ficheirosItems.forEach(item => {
    y = checkPageSpace(doc, y, 8);
    drawCheckbox(doc, 20, y - 3, ensureBoolean(tasks[item.key as keyof typeof tasks]));
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
    y = checkPageSpace(doc, y, 8);
    drawCheckbox(doc, 15, y - 3, ensureBoolean(tasks[item.key as keyof typeof tasks]));
    doc.text(item.text, 20, y);
    y += 6;
  });
  
  // Observations with rectangle
  y = checkPageSpace(doc, y, 30);
  return drawObservationsBox(doc, y, observations);
};
