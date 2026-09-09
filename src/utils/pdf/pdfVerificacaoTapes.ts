import { jsPDF } from 'jspdf';
import { VerificacaoTapes } from '@/types/taskboard';
import { centerText, drawCheckbox, ensureBoolean, checkPageSpace, BCA_COLORS } from './pdfCommon';

const INTRO = [
  'De modo a verificar o bom funcionamento e o estado das tapes em uso no BCA, quer no AS/400,',
  'quer nos diversos Servidores, para além dos ‘restores’ diários (que provam de que as tapes estão',
  'em boas condições, caso contrário o ‘restore’ não seria executado), e das seguranças que são',
  'efetuadas com um conjunto de tapes que são alternados semanalmente/mensalmente deverá ser',
  'feito um ‘display-tape’ para papel do conteúdo das tapes utilizadas, principalmente da que é',
  'enviada para a ilha do Sal.',
  '',
  'Os ‘prints’ deverão ser anexados a este procedimento, para posterior verificação quer pelo',
  'controlo interno quer pelas Auditorias Internas e Externas ao Banco.',
];

const BANKA: { key: keyof VerificacaoTapes; text: string }[] = [
  { key: 'bmmes', text: 'BMMES do mês anterior ao do mês em curso; (1º dia mês)' },
  { key: 'bmmesb', text: 'BMMESB do mês anterior ao do mês em curso; (1º dia mês)' },
  { key: 'trlog', text: 'TRLOG; (1º dia mês)' },
  { key: 'blc', text: 'BLC; (1º dia mês)' },
  { key: 'notlh', text: 'NOTLH; (1º dia mês)' },
  { key: 'savsys', text: 'SAVSYS; (ultimo savsys efectuado);' },
  { key: 'bmsem', text: 'BMSEM (Tape semanal enviado ao Sal); (2ª feira)' },
  { key: 'brjrn', text: 'BRJRN; (2ª feira)' },
  { key: 'mvcoh', text: 'MVCOH; (2ª feira)' },
];

const HRM: { key: keyof VerificacaoTapes; text: string }[] = [
  { key: 'hrm', text: 'HRM; (1º dia mês)' },
  { key: 'im', text: 'IM; (1º dia mês)' },
  { key: 'am', text: 'AM; (1º dia mês)' },
  { key: 'amjrn', text: 'AMJRN; (1º dia mês)' },
];

export const renderVerificacaoTapes = (
  doc: jsPDF,
  tapes: VerificacaoTapes,
  dataStr: string,
  operador: string,
): void => {
  doc.addPage();
  const pageWidth = doc.internal.pageSize.width;
  let y = 20;

  doc.setTextColor(...BCA_COLORS.darkBlue);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  centerText(doc, 'PROCEDIMENTO VERIFICAÇÃO DE TAPES', y);
  doc.setTextColor(0, 0, 0);
  y += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data: ${dataStr}`, 15, y);
  y += 7;
  doc.text(`Operador: ${operador || ''}`, 15, y);
  y += 7;
  doc.text(`Verificado por: ${tapes.verificadoPor || ''}`, 15, y);
  y += 10;

  doc.setFontSize(9);
  INTRO.forEach((line) => {
    doc.text(line, 15, y);
    y += 5;
  });
  y += 4;

  const group = (title: string, items: { key: keyof VerificacaoTapes; text: string }[]) => {
    y = checkPageSpace(doc, y, 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title, 15, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    items.forEach((it) => {
      y = checkPageSpace(doc, y, 7);
      drawCheckbox(doc, 20, y - 3, ensureBoolean(tapes[it.key] as boolean));
      doc.text(it.text, 27, y);
      y += 6;
    });
    y += 4;
  };

  group('Tapes AS/400 - BANKA', BANKA);
  group('Tapes AS/400 – HRM/IM/AM', HRM);
};
