
import { jsPDF } from 'jspdf';
import { TasksType, TurnDataType, TurnKey } from '@/types/taskboard';
import { TaskTableRow } from '@/types/taskTableRow';
import { centerText } from './pdf/pdfCommon';
import { renderTurno1Tasks } from './pdf/pdfTurno1';
import { renderTurno2Tasks } from './pdf/pdfTurno2';
import { renderTurno3Tasks } from './pdf/pdfTurno3';
import { renderTaskTable } from './pdf/pdfTable';

export const generateTaskboardPDF = (
  date: string,
  turnData: TurnDataType, 
  tasks: TasksType,
  tableRows: TaskTableRow[],
  isDiaNaoUtil: boolean = false,
  isEndOfMonth: boolean = false,
  signature?: { imageDataUrl: string | null; signerName?: string; signedAt?: string }
): string => {
  const doc = new jsPDF();
  let y = 20;
  
  // Document header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  centerText(doc, "CENTRO INFORMÁTICA", y);
  y += 10;
  
  doc.setFontSize(16);
  centerText(doc, isDiaNaoUtil ? "Ficha de Procedimentos - Dia Não Útil" : "Ficha de Procedimentos", y);
  y += 15;
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Processamentos Diários", 15, y);
  doc.text(`Data: ${date}`, doc.internal.pageSize.width - 50, y);
  y += 10;
  
  // If it's a non-working day, only process Turn 3
  if (isDiaNaoUtil) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Operador:", 15, y);
    doc.setFont("helvetica", "normal");
    
    doc.text(`${turnData.turno3.operator}`, 50, y);
    doc.text(`Entrada: ${turnData.turno3.entrada}`, 120, y);
    doc.text(`Saída: ${turnData.turno3.saida}`, 170, y);
    y += 10;
    
    // Process only Turn 3 tasks
    y = renderTurno3Tasks(doc, tasks.turno3, turnData.turno3.observations, y, true, isEndOfMonth);
  } else {
    // Process all three turns for regular days
    const turnKeys: TurnKey[] = ['turno1', 'turno2', 'turno3'];
    const turnNames = ['Turno 1', 'Turno 2', 'Turno 3'];
    
    turnKeys.forEach((turnKey, index) => {
      const turnName = turnNames[index];
      const turn = turnData[turnKey];
      
      // Add extra spacing between turns
      if (index > 0) {
        y += 15;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`${turnName}:`, 15, y);
      doc.setFont("helvetica", "normal");
      
      doc.text(`Operador: ${turn.operator}`, 50, y);
      doc.text(`Entrada: ${turn.entrada}`, 120, y);
      doc.text(`Saída: ${turn.saida}`, 170, y);
      y += 10;
      
      // Process tasks based on turn
      if (turnKey === 'turno1') {
        y = renderTurno1Tasks(doc, tasks.turno1, turn.observations, y);
      } else if (turnKey === 'turno2') {
        y = renderTurno2Tasks(doc, tasks.turno2, turn.observations, y);
      } else if (turnKey === 'turno3') {
        y = renderTurno3Tasks(doc, tasks.turno3, turn.observations, y, false, isEndOfMonth);
      }
    });
  }
  
  // Always add task table no matter what
  renderTaskTable(doc, tableRows);

  // Signature page (simple and safe: new page)
  doc.addPage();
  y = 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Validação e Assinatura", 15, y);
  y += 8;

  // Signature box
  const pageWidth = doc.internal.pageSize.width;
  const boxX = 15;
  const boxY = y + 4;
  const boxW = pageWidth - 30;
  const boxH = 70;
  doc.setDrawColor(150);
  doc.rect(boxX, boxY, boxW, boxH);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const signerName = signature?.signerName || "";
  const signedAt = signature?.signedAt || "";
  doc.text(`Assinado por: ${signerName || '-'}`, boxX, y);
  doc.text(`Data/Hora: ${signedAt || '-'}`, boxX + 100, y);

  // Render signature image if present
  if (signature?.imageDataUrl) {
    try {
      // Fit image inside the box keeping margins
      const imgW = 120;
      const imgH = 40;
      const imgX = boxX + 10;
      const imgY = boxY + 10;
      // @ts-ignore - addImage accepts data URL
      doc.addImage(signature.imageDataUrl, 'PNG', imgX, imgY, imgW, imgH);
    } catch (e) {
      /* ignore image errors */
    }
  } else {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("Assine no espaço acima.", boxX + 10, boxY + boxH / 2);
    doc.setTextColor(0);
  }
  
  const fileName = `ficha-procedimentos-${date}.pdf`;
  doc.save(fileName);
  return fileName;
};
