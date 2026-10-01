import { semAcentos } from './texto';

/**
 * Para folhas de pagamento em que uma empresa tem um separador por mês
 * (ex.: "JANEIRO 26", "Fevereiro 26", …, "Setembro 26"): tenta adivinhar
 * qual é o mês corrente para pré-selecionar, mas quem usa pode sempre trocar
 * — nunca se escolhe um separador às cegas sem dar para mudar.
 */
const MESES = [
  'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** Devolve o nome do separador que parece ser o do mês dado, ou null se nenhum bater. */
export function adivinharFolhaDoMes(nomes: string[], data: Date = new Date()): string | null {
  const alvo = MESES[data.getMonth()];
  const ano2 = String(data.getFullYear()).slice(-2);
  const ano4 = String(data.getFullYear());
  const normaliza = (s: string) => semAcentos(s).toLowerCase();

  const candidatos = nomes.filter((n) => normaliza(n).includes(alvo));
  if (candidatos.length === 0) return null;
  if (candidatos.length === 1) return candidatos[0];
  // Havendo mais do que um (ex. anos diferentes), prefere o que também tem o ano certo.
  return candidatos.find((n) => n.includes(ano2) || n.includes(ano4)) ?? candidatos[0];
}
