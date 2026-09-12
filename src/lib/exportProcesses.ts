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

/** Resolve um código de operador para o nome. Por omissão usa a lista estática;
 *  quem chama passa o `labelOf` de `useOperators()` para incluir operadores da BD. */
type ResolveOperator = (value: string | null | undefined) => string;

const TIPO_LABEL: Record<string, string> = {
  salario: 'Salário',
  cobrancas: 'Cobranças',
  compensacao: 'Compensação',
};

const HEADERS = ['Data', 'Hora', 'Tarefa', 'Nome AS/400', 'Operação', 'Executado por', 'Tipo'];

function toRow(p: FileProcess, resolveOperator: ResolveOperator): string[] {
  return [
    p.date_registered ? format(new Date(p.date_registered), 'dd/MM/yyyy') : '',
    p.time_registered ?? '',
    p.task ?? '',
    p.as400_name ?? '',
    p.operation_number ?? '',
    resolveOperator(p.executed_by) || p.executed_by || '',
    p.tipo ? (TIPO_LABEL[p.tipo] ?? p.tipo) : 'Outros',
  ];
}

/**
 * Neutraliza injeção de fórmula: um valor que comece por `=`, `+`, `-`, `@`
 * ou tab/carriage-return é interpretado como fórmula pelo Excel ao abrir o
 * ficheiro — um apóstrofo à frente força-o a texto. `task`/`as400_name`
 * vêm de texto livre preenchido na Ficha, por isso são a origem a proteger.
 */
function neutralizarFormula(v: string): string {
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
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

export function exportProcessesXlsx(
  processes: FileProcess[],
  title: string,
  resolveOperator: ResolveOperator = operatorLabel,
): void {
  const rows = [
    HEADERS,
    ...processes.map((p) => toRow(p, resolveOperator).map(neutralizarFormula)),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 32 }, { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Processamentos');
  XLSX.writeFile(wb, `${fileStem(title)}.xlsx`);
}

export function exportProcessesPdf(
  processes: FileProcess[],
  title: string,
  resolveOperator: ResolveOperator = operatorLabel,
): void {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text('CENTRO INFORMÁTICA — DSI-CI/2025', 14, 14);
  doc.setFontSize(11);
  doc.text(title, 14, 22);
  doc.setFontSize(9);
  doc.text(`Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')} · ${processes.length} registos`, 14, 28);

  autoTable(doc, {
    head: [HEADERS],
    body: processes.map((p) => toRow(p, resolveOperator)),
    startY: 33,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [0, 57, 143] },
  });

  doc.save(`${fileStem(title)}.pdf`);
}
