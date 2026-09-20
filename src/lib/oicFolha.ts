import * as XLSX from 'xlsx';

/**
 * Linhas da folha, com os tipos originais (número / texto) e a numeração real
 * do Excel (a linha 14 do Excel é o índice 13).
 *
 * O modelo Gerador OIC.xlsm tem a coluna do NIB formatada como Texto em ~1 milhão
 * de linhas, por isso o intervalo "usado" chega a A1:AQ1048562 — ler tudo isso
 * seriam dezenas de milhões de células e o browser bloqueava. Limita-se ao que
 * tem mesmo conteúdo.
 */
export function linhasDaFolha(ws: XLSX.WorkSheet): unknown[][] {
  let maxR = -1;
  let maxC = 0;
  for (const chave of Object.keys(ws)) {
    if (chave.charAt(0) === '!') continue;
    const cel = ws[chave] as XLSX.CellObject | undefined;
    if (!cel || cel.t === 'z' || cel.v === undefined || cel.v === null || cel.v === '') continue;
    const ref = XLSX.utils.decode_cell(chave);
    if (ref.r > maxR) maxR = ref.r;
    if (ref.c > maxC) maxC = ref.c;
  }
  if (maxR < 0) return [];

  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxR, c: maxC } });
  return XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: true, defval: '', raw: true });
}
