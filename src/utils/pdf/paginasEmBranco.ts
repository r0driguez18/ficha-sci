import type { jsPDF } from 'jspdf';
import type { PDFPage } from 'pdf-lib';

/**
 * Páginas em branco: nunca devem ir para o PDF final.
 * Três fontes: páginas que o gerador abre sem chegar a escrever nada, o `\f` (mudança de página) no fim
 * dos reports de texto do AS/400, e PDFs de display com uma página final vazia.
 */

// Operações que só preparam o estado gráfico (espessura, cor…) e não desenham nada.
const SO_ESTADO = /^(?:q|Q|[-\d.\s]+\s(?:w|J|j|M|G|g|rg|RG|k|K|i|Tc|Tw|Tz|TL|Ts|Tr)|\[[^\]]*\]\s*[-\d.]+\s+d|\/\S+\s+(?:gs|cs|CS)|\/\S+\s+[-\d.]+\s+Tf)$/;

/** Uma página jsPDF sem texto, linhas, formas nem imagens. */
export function paginaJsPdfEmBranco(operacoes: string[]): boolean {
  return operacoes
    .join('\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .every((l) => SO_ESTADO.test(l));
}

/** Apaga as páginas em branco do documento (nunca a única que houver). Devolve quantas apagou. */
export function removerPaginasEmBranco(doc: jsPDF): number {
  const paginas = (doc.internal as unknown as { pages: string[][] }).pages;
  let apagadas = 0;
  for (let i = doc.getNumberOfPages(); i >= 1; i -= 1) {
    if (doc.getNumberOfPages() <= 1) break;
    if (paginaJsPdfEmBranco(paginas[i] ?? [])) {
      doc.deletePage(i);
      apagadas += 1;
    }
  }
  return apagadas;
}

/**
 * Divide um report de texto em páginas (o `\f` muda de página), sem as linhas vazias do fim e sem as
 * páginas que ficam sem nada — o `\f` no fim do ficheiro, ou dois seguidos, não geram folhas em branco.
 */
export function paginasDeTexto(texto: string): string[][] {
  return texto
    .split('\f')
    .map((pagina) => {
      const linhas = pagina.replace(/\r\n?/g, '\n').split('\n');
      while (linhas.length > 0 && linhas[linhas.length - 1].trim() === '') linhas.pop();
      return linhas;
    })
    .filter((linhas) => linhas.some((l) => l.trim() !== ''));
}

type PdfLib = typeof import('pdf-lib');

// Algo que se vê: texto, imagem, forma pintada, imagem em linha ou sombreado.
const DESENHA = /(?:\bTj\b|\bTJ\b|\bDo\b|\bsh\b|\bBI\b|(?:^|\s)(?:f\*?|F|S|s|B\*?|b\*?)(?=\s|$)|['"](?=\s|$))/m;

/** Uma página de um PDF (pdf-lib) sem conteúdo visível nem anotações. */
export function paginaPdfEmBranco(page: PDFPage, lib: PdfLib): boolean {
  const { PDFArray, PDFRawStream, PDFStream, decodePDFRawStream } = lib;
  const annots = page.node.Annots();
  if (annots && annots.size() > 0) return false;

  const contexto = page.doc.context;
  const conteudo = page.node.Contents();
  if (!conteudo) return true;

  const fluxos: unknown[] = [];
  const alvo = conteudo instanceof PDFArray ? conteudo.asArray().map((r) => contexto.lookup(r)) : [conteudo];
  for (const c of alvo) fluxos.push(c);

  for (const f of fluxos) {
    if (!(f instanceof PDFStream)) continue;
    let texto = '';
    try {
      const bytes = f instanceof PDFRawStream ? decodePDFRawStream(f).decode() : f.getContents();
      texto = new TextDecoder('latin1').decode(bytes);
    } catch {
      return false; // não consigo ler o fluxo: mais vale manter a página
    }
    if (DESENHA.test(texto.replace(/%[^\n\r]*/g, ''))) return false;
  }
  return true;
}
