/**
 * Texto para os ficheiros de largura fixa dos bancos (PS2, OIC): tira os
 * acentos e deixa a letra — "João Conceição" → "Joao Conceicao". Assim cada
 * carácter ocupa 1 byte em qualquer codificação e as colunas não se desalinham.
 *
 * Letras que não se decompõem (ø, đ, ł, æ, œ, ß…) trocam-se à mão; tudo o
 * resto que não for ASCII fica como está (o gerador decide o que fazer).
 */
const ESPECIAIS: Record<string, string> = {
  ø: 'o', Ø: 'O', đ: 'd', Đ: 'D', ł: 'l', Ł: 'L', æ: 'ae', Æ: 'AE', œ: 'oe', Œ: 'OE',
  ß: 'ss', þ: 'th', Þ: 'TH', ð: 'd', Ð: 'D', ı: 'i',
};

export function semAcentos(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[øØđĐłŁæÆœŒßþÞðÐı]/g, (c) => ESPECIAIS[c] ?? c)
    .normalize('NFC');
}
