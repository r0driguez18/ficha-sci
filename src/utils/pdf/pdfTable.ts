
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
