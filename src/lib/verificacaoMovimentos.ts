/**
 * Verificação de um lote PS2 no core: cola-se o texto dos movimentos da conta da empresa e
 * conta-se quantos movimentos têm o valor esperado (um = certo; zero = em falta; dois ou mais
 * = duplicado).
 *
 * O texto vem de um terminal/ecrã do core, por isso o valor pode aparecer de várias formas
 * (1.250.000,00 / 1250000.00 / 1 250 000 / …). Em vez de "adivinhar" números no texto,
 * gera-se cada forma possível do valor esperado e procura-se, linha a linha, com fronteiras
 * (não pode fazer parte de um número maior). Conta-se uma vez por linha.
 */

export type Sentido = 'debito' | 'credito';

export interface ResultadoContagem {
  /** Movimentos que batem com o valor e (quando se consegue ler) com o sentido esperado. */
  contagem: number;
  /** Destes, quantos não trazem indicação de débito/crédito (não se pôde confirmar o sentido). */
  semIndicacaoDeSentido: number;
  /** Linhas com o valor mas com o sentido contrário ao esperado (não entram na contagem). */
  outroSentido: number;
  /** As linhas que contaram (para mostrar). */
  linhas: string[];
}

function agrupar(inteiro: string, separador: string): string {
  return inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, separador);
}

/** Todas as formas em que o valor (em escudos, com ou sem cêntimos) pode aparecer. */
export function formasDoValor(valor: number): string[] {
  const cents = Math.round(Math.abs(valor) * 100);
  const inteiro = String(Math.trunc(cents / 100));
  const dec = String(cents % 100).padStart(2, '0');
  const formas = new Set<string>();

  const separadoresMilhares = ['', '.', ',', ' ', ' ', "'"];
  for (const m of separadoresMilhares) {
    const base = m === '' ? inteiro : agrupar(inteiro, m);
    // com cêntimos: separador decimal "," ou "."; sem cêntimos só quando são 00
    if (m !== ',') formas.add(`${base},${dec}`);
    if (m !== '.') formas.add(`${base}.${dec}`);
    if (dec === '00') formas.add(base);
  }
  // mais comprida primeiro: "1.250.000,00" antes de "1.250.000"
  return [...formas].sort((a, b) => b.length - a.length);
}

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function regexDoValor(valor: number): RegExp {
  const alternativas = formasDoValor(valor).map(escapar).join('|');
  // Não pode ser continuação de outro número: antes não há dígito (nem dígito + separador),
  // depois não há dígito (nem separador + dígito).
  return new RegExp(`(?<![\\d]|\\d[.,' \\u00a0])(?:${alternativas})(?![\\d]|[.,' \\u00a0]\\d)`);
}

const RE_DEBITO = /(?:^|[\s|;:])(?:D|DB|DEB|DÉB|DEBITO|DÉBITO)(?=$|[\s|;:])/i;
const RE_CREDITO = /(?:^|[\s|;:])(?:C|CR|CRED|CRÉD|CREDITO|CRÉDITO)(?=$|[\s|;:])/i;

/** O que o texto da linha diz sobre o sentido: null = sem indicação. */
function sentidoDaLinha(linha: string, regexValor: RegExp): Sentido | null {
  const d = RE_DEBITO.test(linha);
  const c = RE_CREDITO.test(linha);
  if (d && !c) return 'debito';
  if (c && !d) return 'credito';
  // Sinal menos colado ao valor ("-1.250.000,00") = débito.
  const m = regexValor.exec(linha);
  if (m && m.index > 0 && linha[m.index - 1] === '-') return 'debito';
  return null;
}

export function contarMovimentos(texto: string, valor: number, sentido: Sentido): ResultadoContagem {
  const res: ResultadoContagem = { contagem: 0, semIndicacaoDeSentido: 0, outroSentido: 0, linhas: [] };
  if (!texto.trim() || !(valor >= 0)) return res;

  const re = regexDoValor(valor);
  for (const bruta of texto.split(/\r\n|\r|\n/)) {
    const linha = bruta.trim();
    if (linha === '' || !re.test(linha)) continue;

    const lido = sentidoDaLinha(linha, re);
    if (lido && lido !== sentido) {
      res.outroSentido += 1;
      continue;
    }
    res.contagem += 1;
    if (!lido) res.semIndicacaoDeSentido += 1;
    res.linhas.push(linha);
  }
  return res;
}
