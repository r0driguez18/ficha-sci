/**
 * Feriados de Cabo Verde (nacionais + município da Praia, onde o
 * back-office está sediado) — para o cálculo de dias úteis dos retornos
 * de cobrança (`cobrancasSla.ts`).
 *
 * Os feriados de data fixa não mudam de ano para ano. Carnaval (Quarta-
 * feira de Cinzas), Sexta-feira Santa e Páscoa são feriados móveis — em
 * vez de os manter numa lista que precisaria de atualização manual todos
 * os anos, calculam-se a partir da data da Páscoa desse ano (algoritmo
 * gregoriano padrão), que por sua vez determina os outros dois.
 */

/** Domingo de Páscoa de um ano (algoritmo de Meeus/Jones/Butcher). */
export function calcularPascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function subtrairDias(date: Date, dias: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - dias);
  return d;
}

function mesmoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** [mês (1-12), dia] — feriados nacionais de data fixa. */
const FERIADOS_FIXOS_NACIONAIS: [number, number][] = [
  [1, 1], // Ano Novo
  [1, 13], // Dia da Liberdade e da Democracia
  [1, 20], // Dia da Nacionalidade e dos Heróis Nacionais
  [5, 1], // Dia do Trabalhador
  [6, 1], // Dia Mundial da Criança
  [7, 5], // Dia da Independência Nacional
  [8, 15], // Dia da Assunção
  [11, 1], // Dia de Todos os Santos
  [12, 25], // Natal
];

/** [mês, dia] — feriados municipais da Praia. */
const FERIADOS_FIXOS_PRAIA: [number, number][] = [
  [4, 29], // Dia da Cidade da Praia
  [5, 19], // Dia do Município da Praia
];

/** É feriado (nacional ou municipal da Praia, fixo ou móvel)? */
export function ehFeriadoCaboVerde(date: Date): boolean {
  if (Number.isNaN(date.getTime())) return false;

  const mes = date.getMonth() + 1;
  const dia = date.getDate();

  for (const [m, d] of FERIADOS_FIXOS_NACIONAIS) {
    if (m === mes && d === dia) return true;
  }
  for (const [m, d] of FERIADOS_FIXOS_PRAIA) {
    if (m === mes && d === dia) return true;
  }

  const pascoa = calcularPascoa(date.getFullYear());
  const cinzas = subtrairDias(pascoa, 46);
  const sextaSanta = subtrairDias(pascoa, 2);
  return mesmoDia(date, cinzas) || mesmoDia(date, sextaSanta) || mesmoDia(date, pascoa);
}
