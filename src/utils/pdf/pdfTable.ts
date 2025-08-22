
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TaskTableRow } from '@/types/taskTableRow';

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
  doc.setFont("helvetica", "bold");
  doc.text("Tabela de Processamentos", 15, 20);
  
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
      startY: 25,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 0, 255], // Blue header
        textColor: [255, 255, 255], // White text
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: [0, 0, 0] // Black text
      }
    });
  } else {
    // If no data, show an empty table with just headers
    autoTable(doc, {
      head: [['Hora', 'Tarefa', 'Nome AS400', 'Nº Operação', 'Tipo', 'Executado Por']],
      body: [],
      startY: 25,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 0, 255], // Blue header
        textColor: [255, 255, 255], // White text
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: [0, 0, 0] // Black text
      }
    });
  }
};
