/**
 * Exportação da vista atual de processamentos para XLSX e PDF (F6).
 * Usa as bibliotecas já presentes no projeto (xlsx, jspdf, jspdf-autotable).
 */
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { FileProcess } from '@/services/fileProcessService';
import { operatorLabel } from '@/lib/operators';

const TIPO_LABEL: Record<string, string> = {
  salario: 'Salário',
  cobrancas: 'Cobranças',
  compensacao: 'Compensação',
};

const HEADERS = ['Data', 'Hora', 'Tarefa', 'Nome AS/400', 'Operação', 'Executado por', 'Tipo'];

function toRow(p: FileProcess): string[] {
  return [
    p.date_registered ? format(new Date(p.date_registered), 'dd/MM/yyyy') : '',
    p.time_registered ?? '',
    p.task ?? '',
    p.as400_name ?? '',
    p.operation_number ?? '',
    operatorLabel(p.executed_by) || p.executed_by || '',
    p.tipo ? (TIPO_LABEL[p.tipo] ?? p.tipo) : 'Outros',
  ];
}

function fileStem(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `processamentos-${slug}-${format(new Date(), 'yyyyMMdd')}`;
}

export function exportProcessesXlsx(processes: FileProcess[], title: string): void {
  const rows = [HEADERS, ...processes.map(toRow)];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 32 }, { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Processamentos');
  XLSX.writeFile(wb, `${fileStem(title)}.xlsx`);
}

export function exportProcessesPdf(processes: FileProcess[], title: string): void {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text('CENTRO INFORMÁTICA — DSI-CI/2025', 14, 14);
  doc.setFontSize(11);
  doc.text(title, 14, 22);
  doc.setFontSize(9);
  doc.text(`Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')} · ${processes.length} registos`, 14, 28);

  autoTable(doc, {
    head: [HEADERS],
    body: processes.map(toRow),
    startY: 33,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [0, 57, 143] },
  });

  doc.save(`${fileStem(title)}.pdf`);
}
