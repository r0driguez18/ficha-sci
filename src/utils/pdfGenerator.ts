
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
  isEndOfMonth: boolean = false
) => {
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
  
  // Always add task table no matter what - this is the fix for the missing table
  renderTaskTable(doc, tableRows);
  
  return doc;
};
