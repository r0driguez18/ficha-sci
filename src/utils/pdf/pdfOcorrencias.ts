import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AnexoOcorrencias } from '@/services/ocorrenciasService';
import { linhasDaFicha } from '@/lib/ocorrencias';
import { BCA_COLORS } from './pdfCommon';

const dataCurta = (iso: string) => iso.split('-').reverse().join('/');

/**
 * A "Ficha Comunicação/Ocorrências" do Centro Informática numa página A4 horizontal, como a ficha em
 * papel: tabela N.º Avaria · Descrição da Avaria · Hora Início · Hora Término · Encaminhamento (com
 * linhas em branco até 12) e, por baixo, "Outras Intervenções/Observações".
 *
 * `novaPagina`: true para anexar a um PDF já existente (a ficha de procedimentos); false para ser a
 * primeira página de um PDF só desta ficha.
 */
export function renderOcorrenciasPagina(doc: jsPDF, anexo: AnexoOcorrencias, novaPagina: boolean): void {
  if (novaPagina) doc.addPage('a4', 'landscape');
  const largura = doc.internal.pageSize.width;
  const margem = 15;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CENTRO INFORMÁTICA', largura / 2, 18, { align: 'center' });

  doc.setFontSize(12);
  const titulo = 'Ficha Comunicação/Ocorrências';
  doc.text(titulo, largura / 2, 27, { align: 'center' });
  const larguraTitulo = doc.getTextWidth(titulo);
  doc.setLineWidth(0.4);
  doc.line((largura - larguraTitulo) / 2, 28.5, (largura + larguraTitulo) / 2, 28.5);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data: ${dataCurta(anexo.data)}`, largura - margem, 18, { align: 'right' });

  const corpo = linhasDaFicha(anexo.linhas).map((o) => [
    o?.n_avaria ?? '',
    o?.descricao ?? '',
    o?.hora_inicio ?? '',
    o?.hora_termino ?? '',
    o?.encaminhamento ?? '',
  ]);

  autoTable(doc, {
    head: [['N.º\nAvaria', 'Descrição da Avaria', 'Hora Início', 'Hora Término', 'Encaminhamento']],
    body: corpo,
    startY: 34,
    margin: { left: margem, right: margem },
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 1.8, lineColor: [0, 0, 0], lineWidth: 0.2, textColor: [0, 0, 0], minCellHeight: 7.5 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineWidth: 0.2, lineColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 24, halign: 'center' },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 70 },
    },
  });

  // "• Outras Intervenções/Observações" + 5 linhas (o texto escreve-se por cima das linhas).
  const aposTabela = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120;
  const alturaPagina = doc.internal.pageSize.height;
  let y = aposTabela + 12;
  if (y > alturaPagina - 50) {
    doc.addPage('a4', 'landscape');
    y = 25;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BCA_COLORS.black);
  doc.text('•  Outras Intervenções/Observações', margem, y);
  y += 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const texto = anexo.observacoes.trim() ? doc.splitTextToSize(anexo.observacoes.trim(), largura - 2 * margem - 2) : [];
  const nLinhas = Math.max(5, texto.length);
  doc.setLineWidth(0.2);
  for (let i = 0; i < nLinhas; i += 1) {
    y += 7;
    if (y > alturaPagina - 12) {
      doc.addPage('a4', 'landscape');
      y = 25;
    }
    doc.line(margem, y + 1.2, largura - margem, y + 1.2);
    if (texto[i]) doc.text(texto[i], margem + 1, y);
  }
}

/** PDF só com esta ficha (para imprimir ou juntar à ficha em papel). */
export function generateOcorrenciasPDF(anexo: AnexoOcorrencias): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
  renderOcorrenciasPagina(doc, anexo, false);
  return doc;
}
