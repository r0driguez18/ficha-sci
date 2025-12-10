
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TaskTableRow } from '@/types/taskTableRow';
import { addBCALogo, BCA_COLORS } from './pdfCommon';

export const renderTaskTable = (doc: jsPDF, tableRows: TaskTableRow[]): void => {
  // Filter out any empty rows
  const validRows = tableRows.filter(row => 
    row.hora.trim() !== '' || 
    row.tarefa.trim() !== '' || 
    row.nomeAs.trim() !== '' || 
    row.operacao.trim() !== '' || 
    row.executado.trim() !== '' ||
    row.tipo.trim() !== ''
  );
  
  // Always add a table page, even if there are no rows
  doc.addPage();
  
  // Add BCA Logo to table page
  addBCALogo(doc, 15, 8, 25);
  
  // Title with BCA colors
  doc.setTextColor(...BCA_COLORS.darkBlue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Tabela de Processamentos", 15, 25);
  doc.setTextColor(0, 0, 0);
  
  // If we have valid rows, render them
  if (validRows.length > 0) {
    const data = validRows.map(row => [
      row.hora, 
      row.tarefa, 
      row.nomeAs, 
      row.operacao, 
      row.tipo || 'N/A',
      row.executado
    ]);
    
    autoTable(doc, {
      head: [['Hora', 'Tarefa', 'Nome AS400', 'Nº Operação', 'Tipo', 'Executado Por']],
      body: data,
      startY: 30,
      theme: 'grid',
      headStyles: {
        fillColor: BCA_COLORS.blue,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 10
      },
      bodyStyles: {
        textColor: BCA_COLORS.black,
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: BCA_COLORS.lightGray
      },
      styles: {
        cellPadding: 3,
        lineColor: BCA_COLORS.gray,
        lineWidth: 0.1
      }
    });
  } else {
    // If no data, show an empty table with just headers
    autoTable(doc, {
      head: [['Hora', 'Tarefa', 'Nome AS400', 'Nº Operação', 'Tipo', 'Executado Por']],
      body: [],
      startY: 30,
      theme: 'grid',
      headStyles: {
        fillColor: BCA_COLORS.blue,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 10
      },
      bodyStyles: {
        textColor: BCA_COLORS.black,
        fontSize: 9
      },
      styles: {
        cellPadding: 3,
        lineColor: BCA_COLORS.gray,
        lineWidth: 0.1
      }
    });
  }
};
