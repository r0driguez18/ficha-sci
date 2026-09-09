import type { TapesEvidenciaFile } from '@/types/taskboard';
import { downloadTapesEvidencia } from '@/services/tapesEvidenciaService';

/**
 * Junta a prova do display-tape ao PDF da ficha, no fim do documento.
 *
 * - Ficheiros PDF  → as páginas são copiadas tal como estão.
 * - Ficheiros TXT  → o conteúdo é desenhado em páginas A4 horizontais, em
 *                    fonte monoespaçada (Courier), preservando o alinhamento
 *                    em colunas do report do AS/400. O caractere de
 *                    form-feed (\f) inicia uma página nova.
 *
 * `pdf-lib` é carregado dinamicamente — só entra no bundle de quem descarrega
 * uma ficha do histórico com evidência anexada.
 */
export async function appendTapesEvidencia(
  basePdfBytes: ArrayBuffer | Uint8Array,
  evidencia: TapesEvidenciaFile[],
): Promise<Uint8Array> {
  if (!evidencia || evidencia.length === 0) {
    return basePdfBytes instanceof Uint8Array ? basePdfBytes : new Uint8Array(basePdfBytes);
  }

  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const out = await PDFDocument.load(basePdfBytes);
  const courier = await out.embedFont(StandardFonts.Courier);

  // A4 horizontal, em pontos.
  const PAGE_W = 841.89;
  const PAGE_H = 595.28;
  const MARGIN = 40;
  const FONT_SIZE = 8;
  const LINE_H = FONT_SIZE * 1.15;
  const CHAR_W = courier.widthOfTextAtSize('M', FONT_SIZE);
  const MAX_CHARS = Math.max(20, Math.floor((PAGE_W - 2 * MARGIN) / CHAR_W));
  const LINES_PER_PAGE = Math.floor((PAGE_H - 2 * MARGIN) / LINE_H);

  const drawTxtPage = (rawLines: string[]) => {
    let page = out.addPage([PAGE_W, PAGE_H]);
    let row = 0;
    const put = (text: string) => {
      if (row >= LINES_PER_PAGE) {
        page = out.addPage([PAGE_W, PAGE_H]);
        row = 0;
      }
      page.drawText(text, {
        x: MARGIN,
        y: PAGE_H - MARGIN - (row + 1) * LINE_H,
        size: FONT_SIZE,
        font: courier,
        color: rgb(0, 0, 0),
      });
      row += 1;
    };
    for (const line of rawLines) {
      // pdf-lib (fonte Courier/WinAnsi) rejeita caracteres fora de Latin-1;
      // tabs viram espaços e o resto fora do intervalo imprimível vira '?'.
      const safe = line
        .replace(/\t/g, '    ')
        .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
      if (safe.length === 0) {
        put('');
        continue;
      }
      for (let i = 0; i < safe.length; i += MAX_CHARS) {
        put(safe.slice(i, i + MAX_CHARS));
      }
    }
  };

  for (const file of evidencia) {
    const blob = await downloadTapesEvidencia(file.path);
    if (!blob) continue;
    const buf = await blob.arrayBuffer();

    if (file.type === 'application/pdf') {
      try {
        const src = await PDFDocument.load(buf);
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      } catch (e) {
        console.error(`Não foi possível anexar o PDF "${file.name}":`, e);
      }
      continue;
    }

    // TXT: descodificar (UTF-8, com recurso a Windows-1252) e paginar por \f.
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
    } catch {
      text = new TextDecoder('windows-1252').decode(buf);
    }
    const formFeeds = text.split('\f');
    for (const chunk of formFeeds) {
      drawTxtPage(chunk.replace(/\r\n?/g, '\n').split('\n'));
    }
  }

  return out.save();
}
