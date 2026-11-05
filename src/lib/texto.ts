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

/** Sinais tipográficos que o Word/Excel põem sozinhos e o ficheiro do banco não aceita → o equivalente simples (código Unicode → texto). */
const TIPOGRAFICOS = new Map<number, string>([
  [0x2018, "'"], [0x2019, "'"], [0x201a, "'"], [0x201b, "'"], [0x2032, "'"], [0x00b4, "'"], [0x0060, "'"],
  [0x201c, '"'], [0x201d, '"'], [0x201e, '"'], [0x2033, '"'],
  [0x2010, '-'], [0x2011, '-'], [0x2012, '-'], [0x2013, '-'], [0x2014, '-'], [0x2212, '-'],
  [0x2026, '...'], [0x00ba, 'o'], [0x00aa, 'a'], [0x00b0, 'o'], [0x20ac, 'EUR'], [0x00d7, 'x'],
  [0x00a0, ' '], [0x2009, ' '], [0x200b, ''], [0x00ad, ''], [0x00a9, '(c)'], [0x00ae, '(r)'],
]);

/**
 * Só ASCII imprimível (letras sem acento, números, pontuação normal): sem acentos nem cedilha, sinais tipográficos
 * trocados pelos simples (travessão → hífen, aspas curvas → rectas), e tudo o resto que não existe em ASCII sai.
 * Para os ficheiros PS2, em que cada carácter tem de ocupar exatamente 1 byte.
 */
export function paraAscii(texto: string): string {
  let out = '';
  for (const ch of semAcentos(texto)) {
    const troca = TIPOGRAFICOS.get(ch.codePointAt(0) ?? 0);
    out += troca !== undefined ? troca : ch;
  }
  return out
    .replace(/\s/g, ' ')
    .replace(/[^ -~]/g, '')
    .replace(/ {2,}/g, ' ')
    .trim();
}
