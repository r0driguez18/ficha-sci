import { jsPDF } from 'jspdf';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TapesEvidenciaFile } from '@/types/taskboard';
import { emptyTasks, emptyTurnData } from '@/lib/taskboardDefaults';

const ficheiros = new Map<string, Blob>();
vi.mock('@/services/tapesEvidenciaService', () => ({
  downloadTapesEvidencia: async (caminho: string) => ficheiros.get(caminho) ?? null,
}));

import { generateTaskboardPDF } from '../../pdfGenerator';
import { appendTapesEvidencia } from '../appendTapesEvidencia';
import { paginaJsPdfEmBranco, paginaPdfEmBranco, paginasDeTexto, removerPaginasEmBranco } from '../paginasEmBranco';

describe('páginas em branco geradas pelo jsPDF', () => {
  it('apaga as que não têm nada e guarda as que têm texto, formas ou imagens', () => {
    const doc = new jsPDF();
    doc.text('primeira', 10, 10);
    doc.addPage(); // em branco
    doc.addPage();
    doc.text('terceira', 10, 10);
    doc.addPage(); // só prepara a cor e não desenha: em branco
    doc.setFillColor(255, 255, 255);
    doc.addPage();
    doc.rect(10, 10, 20, 20, 'F'); // uma forma pintada conta como conteúdo
    expect(doc.getNumberOfPages()).toBe(5);
    expect(removerPaginasEmBranco(doc)).toBe(2);
    expect(doc.getNumberOfPages()).toBe(3);
  });

  it('nunca apaga a única página, mesmo vazia', () => {
    const doc = new jsPDF();
    expect(removerPaginasEmBranco(doc)).toBe(0);
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it('reconhece as operações que só preparam o estado gráfico', () => {
    expect(paginaJsPdfEmBranco(['0.567 w', '0 G'])).toBe(true);
    expect(paginaJsPdfEmBranco(['0.567 w', '0 G', '1. g'])).toBe(true);
    expect(paginaJsPdfEmBranco(['0 G', 'BT\n/F1 16 Tf\n(x) Tj\nET'])).toBe(false);
    expect(paginaJsPdfEmBranco(['0 G', '0 0 10 10 re', 'f'])).toBe(false);
    expect(paginaJsPdfEmBranco([])).toBe(true);
  });
});

describe('reports de texto do AS/400', () => {
  it('um form-feed no fim, ou dois seguidos, não geram páginas em branco', () => {
    expect(paginasDeTexto('linha 1\nlinha 2\f')).toEqual([['linha 1', 'linha 2']]);
    expect(paginasDeTexto('A\f\fB\f')).toEqual([['A'], ['B']]);
    expect(paginasDeTexto('A\f \n \f\nB')).toEqual([['A'], ['', 'B']]);
  });

  it('tira as linhas vazias do fim de cada página mas guarda as do meio (alinhamento)', () => {
    expect(paginasDeTexto('A\n\nB\n\n\n\f')).toEqual([['A', '', 'B']]);
  });

  it('aceita fins de linha do Windows e um texto vazio', () => {
    expect(paginasDeTexto('A\r\nB\r\n')).toEqual([['A', 'B']]);
    expect(paginasDeTexto('')).toEqual([]);
    expect(paginasDeTexto('\f\f')).toEqual([]);
  });
});

describe('páginas em branco de PDFs recebidos (display)', () => {
  it('reconhece uma página vazia e uma com texto', async () => {
    const lib = await import('pdf-lib');
    const doc = await PDFDocument.create();
    const fonte = await doc.embedFont(StandardFonts.Helvetica);
    doc.addPage(); // vazia
    doc.addPage().drawText('Report do AS/400', { x: 30, y: 700, size: 10, font: fonte });
    doc.addPage().drawRectangle({ x: 10, y: 10, width: 50, height: 50 });
    const dados = await PDFDocument.load(await doc.save());
    expect(paginaPdfEmBranco(dados.getPage(0), lib)).toBe(true);
    expect(paginaPdfEmBranco(dados.getPage(1), lib)).toBe(false);
    expect(paginaPdfEmBranco(dados.getPage(2), lib)).toBe(false);
  });
});

describe('ficha completa: assinatura sempre a última, sem folhas em branco', () => {
  const assinatura = { signerName: 'Nelson Alves', signedAt: '2026-10-16 23:55', method: 'pin', contentHash: 'a'.repeat(64) } as never;
  const anexo = {
    data: '2026-10-16',
    linhas: [
      { id: '1', data: '2026-10-16', turno: null, n_avaria: 'INC-1', descricao: 'Avaria de teste', hora_inicio: '10:00', hora_termino: null, encaminhamento: 'DSI', categoria: null, sistema: null, criada_por_codigo: 'a', criada_em: '' },
    ],
    observacoes: 'Nota do dia',
  } as never;
  const horizontal = (p: { getWidth(): number; getHeight(): number }) => p.getWidth() > p.getHeight();
  const evidencia = (nome: string, tipo: string): TapesEvidenciaFile => ({ name: nome, path: nome, type: tipo }) as TapesEvidenciaFile;

  beforeEach(() => ficheiros.clear());

  it('o anexo de ocorrências vai antes da assinatura (vertical, no fim)', async () => {
    const doc = generateTaskboardPDF('2026-10-16', emptyTurnData(), emptyTasks(), [], false, assinatura, null, anexo);
    const pdf = await PDFDocument.load(doc.output('arraybuffer'));
    const n = pdf.getPageCount();
    expect(horizontal(pdf.getPage(n - 1))).toBe(false);
    expect(horizontal(pdf.getPage(n - 2))).toBe(true);
  });

  it('sem anexo a ficha não ganha uma página horizontal', async () => {
    const doc = generateTaskboardPDF('2026-10-16', emptyTurnData(), emptyTasks(), [], false, assinatura, null, null);
    const pdf = await PDFDocument.load(doc.output('arraybuffer'));
    for (let i = 0; i < pdf.getPageCount(); i += 1) expect(horizontal(pdf.getPage(i))).toBe(false);
  });

  it('o display (TXT com \\f no fim e PDF com página vazia) entra sem folhas em branco e antes da assinatura', async () => {
    const base = generateTaskboardPDF('2026-10-16', emptyTurnData(), emptyTasks(), [], false, assinatura, null, null);
    const paginasBase = (await PDFDocument.load(base.output('arraybuffer'))).getPageCount();

    ficheiros.set('display.txt', new Blob(['REPORT AS400\nlinha 2\n\f\f']));
    const orig = await PDFDocument.create();
    const f = await orig.embedFont(StandardFonts.Helvetica);
    orig.addPage().drawText('Display em PDF', { x: 30, y: 700, size: 10, font: f });
    orig.addPage(); // página final em branco
    ficheiros.set('display.pdf', new Blob([await orig.save()]));

    const final = await PDFDocument.load(
      await appendTapesEvidencia(base.output('arraybuffer'), [evidencia('display.txt', 'text/plain'), evidencia('display.pdf', 'application/pdf')]),
    );
    // 1 página do TXT + 1 do PDF (a em branco ficou de fora)
    expect(final.getPageCount()).toBe(paginasBase + 2);
    // a assinatura continua a ser a última (vertical); a evidência (horizontal, do TXT) ficou antes
    expect(horizontal(final.getPage(final.getPageCount() - 1))).toBe(false);
    expect(horizontal(final.getPage(final.getPageCount() - 3))).toBe(true);
  });
});
