
import { jsPDF } from 'jspdf';
import { TasksType, TurnDataType, TurnKey } from '@/types/taskboard';
import { TaskTableRow } from '@/types/taskTableRow';
import { centerText, addBCALogo, BCA_COLORS, drawSeparator } from './pdf/pdfCommon';
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
) => {
  const doc = new jsPDF();
  let y = 15;
  
  // Add BCA Logo
  addBCALogo(doc, 15, 8, 25);
  
  // Document header with BCA colors
  doc.setTextColor(...BCA_COLORS.darkBlue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  centerText(doc, "CENTRO INFORMÁTICA", y);
  y += 10;
  
  // Subtitle with underline
  doc.setFontSize(14);
  doc.setTextColor(...BCA_COLORS.blue);
  const subtitle = isDiaNaoUtil ? "Ficha de Procedimentos - Dia Não Útil" : "Ficha de Procedimentos";
  centerText(doc, subtitle, y);
  
  // Draw underline
  const pageWidth = doc.internal.pageSize.width;
  const subtitleWidth = doc.getTextWidth(subtitle);
  const underlineX = (pageWidth - subtitleWidth) / 2;
  doc.setDrawColor(...BCA_COLORS.blue);
  doc.setLineWidth(0.5);
  doc.line(underlineX, y + 2, underlineX + subtitleWidth, y + 2);
  y += 12;
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Date and info section with background
  doc.setFillColor(...BCA_COLORS.lightGray);
  doc.roundedRect(15, y - 4, pageWidth - 30, 10, 2, 2, 'F');
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Processamentos Diários", 20, y + 2);
  doc.setFont("helvetica", "bold");
  doc.text(`Data: ${date}`, pageWidth - 55, y + 2);
  doc.setFont("helvetica", "normal");
  y += 15;
  
  // Separator
  y = drawSeparator(doc, y);
  
  // If it's a non-working day, only process Turn 3
  if (isDiaNaoUtil) {
    // Operator info with styled background
    doc.setFillColor(...BCA_COLORS.lightBlue);
    doc.roundedRect(15, y - 4, pageWidth - 30, 10, 2, 2, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BCA_COLORS.darkBlue);
    doc.text("Operador:", 20, y + 2);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    doc.text(`${turnData.turno3.operator}`, 50, y + 2);
    doc.text(`Entrada: ${turnData.turno3.entrada}`, 110, y + 2);
    doc.text(`Saída: ${turnData.turno3.saida}`, 160, y + 2);
    y += 15;
    
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
        y += 10;
        y = drawSeparator(doc, y);
        y += 5;
      }
      
      // Turn header with colored background
      doc.setFillColor(...BCA_COLORS.lightBlue);
      doc.roundedRect(15, y - 4, pageWidth - 30, 10, 2, 2, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...BCA_COLORS.darkBlue);
      doc.text(`${turnName}:`, 20, y + 2);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      doc.text(`Operador: ${turn.operator}`, 55, y + 2);
      doc.text(`Entrada: ${turn.entrada}`, 115, y + 2);
      doc.text(`Saída: ${turn.saida}`, 160, y + 2);
      y += 15;
      
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
  
  // Add logo to signature page
  addBCALogo(doc, 15, 8, 25);
  
  doc.setTextColor(...BCA_COLORS.darkBlue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Validação e Assinatura", 15, y);
  doc.setTextColor(0, 0, 0);
  y += 10;

  // Signer info
  const signerName = signature?.signerName || "";
  const signedAt = signature?.signedAt || "";
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Assinado por: ${signerName || '-'}`, 15, y);
  doc.text(`Data/Hora: ${signedAt || '-'}`, 110, y);
  y += 8;

  // Signature box with styled border
  const boxX = 15;
  const boxY = y;
  const boxW = pageWidth - 30;
  const boxH = 70;
  
  doc.setDrawColor(...BCA_COLORS.blue);
  doc.setLineWidth(0.5);
  doc.setFillColor(...BCA_COLORS.lightGray);
  doc.roundedRect(boxX, boxY, boxW, boxH, 3, 3, 'FD');

  // Render signature image if present
  if (signature?.imageDataUrl) {
    try {
      const imgW = 120;
      const imgH = 40;
      const imgX = boxX + 10;
      const imgY = boxY + 15;
      // @ts-ignore - addImage accepts data URL
      doc.addImage(signature.imageDataUrl, 'PNG', imgX, imgY, imgW, imgH);
    } catch (e) {
      /* ignore image errors */
    }
  } else {
    doc.setFontSize(10);
    doc.setTextColor(...BCA_COLORS.gray);
    doc.text("Assine no espaço acima.", boxX + 10, boxY + boxH / 2);
    doc.setTextColor(0, 0, 0);
  }
  
  return doc;
};
