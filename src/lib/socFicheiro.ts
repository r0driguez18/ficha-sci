import * as XLSX from 'xlsx';
import { lerLinhas, mapearColunas, type LinhaSoc } from './soc';

export type LeituraSoc = { folha: string; linhas: LinhaSoc[] } | { erro: string };

/**
 * Lê o Excel do SOC: procura a folha do Cisco ESA (a que tem origem e destino), mesmo que o
 * cabeçalho não esteja na primeira linha, e devolve as mensagens em quarentena.
 */
export function lerFicheiroSoc(buffer: ArrayBuffer): LeituraSoc {
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: 'array' });
  } catch {
    return { erro: 'Não consegui abrir o ficheiro. É um Excel (.xlsx)?' };
  }

  // A folha "cisco - esa" primeiro; depois as outras (a capa e a classificação não têm estes campos).
  const folhas = [...wb.SheetNames].sort((a, b) => Number(/cisco|esa/i.test(b)) - Number(/cisco|esa/i.test(a)));
  for (const nome of folhas) {
    const matriz = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[nome], { header: 1, raw: true, defval: '' });
    const cab = matriz.slice(0, 15).findIndex((r) => mapearColunas(r) !== null);
    if (cab < 0) continue;
    const mapa = mapearColunas(matriz[cab])!;
    const linhas = lerLinhas(matriz.slice(cab + 1), mapa);
    if (linhas.length > 0) return { folha: nome, linhas };
  }
  return { erro: 'Não encontrei uma folha com as colunas "Endereço de Origem" e "Endereço de Destino".' };
}
