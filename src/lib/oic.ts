/**
 * Gerador de ficheiros OIC (transferências interbancárias).
 *
 * Porte da macro VBA `GerarFicheiroInterbancario` (Gerador OIC.xlsm). A folha
 * tem o NIB na coluna B, o montante na C, o nome na D e o descritivo na E, a
 * partir da linha 14. Cada linha do ficheiro tem 135 caracteres:
 *
 *   valor×100 (15, à direita) + NIB (21) + 20 espaços + nome (27) +
 *   descritivo (40) + "CVE" + valor inteiro (8, à direita) + 1 espaço
 *
 * Linhas separadas por CRLF, sem quebra no fim, gravado em ANSI (Windows-1252,
 * como o `Open … For Output` do VBA).
 *
 * Desvios em relação à macro (o ficheiro é igual, só muda o que a macro não
 * fazia):
 *  - limpa o que chega nas folhas (espaços, apóstrofos e símbolos nos NIBs,
 *    caracteres invisíveis nos nomes, separadores de milhares nos montantes);
 *  - lista todos os erros de uma vez (a macro pára no primeiro);
 *  - os cêntimos saem certos: `Fix(valor * 100)` em vírgula flutuante perde 1
 *    cêntimo em ~5% dos montantes (0,29 dava 28). Continua a truncar casas a
 *    mais, como a macro;
 *  - um NIB guardado como número no Excel (que só guarda 15 dígitos exatos)
 *    dá erro em vez de gerar uma conta errada.
 */

export const TAMANHO_LINHA = 135;
const TAM_NOME = 27;
const TAM_DESC = 40;
const MAX_INTEIRO = 99_999_999; // campo do valor inteiro: 8 caracteres

// ---------------------------------------------------------------- ANSI (Windows-1252)

/** Unicode → byte para 0x80–0x9F do Windows-1252 (o resto é igual ao Latin-1). */
const CP1252_EXTRA = new Map<number, number>([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84], [0x2026, 0x85],
  [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88], [0x2030, 0x89], [0x0160, 0x8a],
  [0x2039, 0x8b], [0x0152, 0x8c], [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92],
  [0x201c, 0x93], [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b], [0x0153, 0x9c],
  [0x017e, 0x9e], [0x0178, 0x9f],
]);

function byteAnsi(cp: number): number | null {
  if (cp < 0x80 || (cp >= 0xa0 && cp <= 0xff)) return cp;
  return CP1252_EXTRA.get(cp) ?? null;
}

/** Troca por "?" o que o ANSI não tem (como o VBA), um carácter por ponto de código. */
export function paraAnsi(texto: string): { texto: string; substituidos: number } {
  let out = '';
  let substituidos = 0;
  for (const ch of texto) {
    if (byteAnsi(ch.codePointAt(0) as number) === null) {
      out += '?';
      substituidos += 1;
    } else {
      out += ch;
    }
  }
  return { texto: out, substituidos };
}

/** Bytes Windows-1252 do texto (o que não existir em ANSI vira "?"). */
export function codificarAnsi(texto: string): Uint8Array {
  const bytes: number[] = [];
  for (const ch of texto) bytes.push(byteAnsi(ch.codePointAt(0) as number) ?? 0x3f);
  return Uint8Array.from(bytes);
}

// ---------------------------------------------------------------- limpeza do que chega

/**
 * Texto de uma célula: espaços "especiais" e quebras viram espaço, tira
 * caracteres de controlo/invisíveis e o apóstrofo que o Excel põe à frente
 * para forçar texto. Compõe os acentos (NFC) — um "é" decomposto não existe
 * em ANSI.
 */
export function limparTexto(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  return String(raw)
    .normalize('NFC')
    // espaços "especiais" (NBSP, finos…), tabs e quebras → um espaço normal, um a um
    .replace(/(?! )\p{Zs}|[\t\r\n\v\f]/gu, ' ')
    // controlo, invisíveis (largura zero, BOM, hífen suave) e separadores de linha
    .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, '')
    // apóstrofo que o Excel põe à frente para forçar texto
    .replace(/^['’‘´`]+/, '')
    .trim();
}

export interface NibLimpo {
  /** Só os dígitos. */
  nib: string;
  temLetras: boolean;
  /** Guardado como número no Excel (ou em notação científica): os dígitos já se perderam. */
  perdeuDigitos: boolean;
}

/**
 * NIB de uma célula: fica só com os dígitos — letras incluídas (as folhas trazem o
 * banco à frente: "BI 0005…", "CECV 0002…") — e avisa se já chegou estragado.
 */
export function limparNib(raw: unknown): NibLimpo {
  if (raw === null || raw === undefined) return { nib: '', temLetras: false, perdeuDigitos: false };

  if (typeof raw === 'number') {
    // O Excel só guarda 15 dígitos exatos: um NIB de 21 dígitos como número já está perdido.
    const perdeu = !Number.isFinite(raw) || !Number.isInteger(raw) || Math.abs(raw) >= 1e15;
    return {
      nib: Number.isFinite(raw) ? String(Math.trunc(raw)).replace(/\D/g, '') : '',
      temLetras: false,
      perdeuDigitos: perdeu,
    };
  }

  const s = limparTexto(raw);
  // "2,00001234567890123E+20" — notação científica (copiado de uma célula numérica).
  if (/^[\d.,]+e[+-]?\d+$/i.test(s.replace(/\s/g, ''))) {
    return { nib: s.replace(/\D/g, ''), temLetras: false, perdeuDigitos: true };
  }
  return { nib: s.replace(/\D/g, ''), temLetras: /\p{L}/u.test(s), perdeuDigitos: false };
}

/**
 * Montante de uma célula. null = vazio, NaN = não é um número. Aceita
 * "1234.5", "1.234,56", "1,234.56", "1 234,56", "CVE 1.000,00", "'500".
 */
export function parseMontante(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return raw;

  let s = limparTexto(raw);
  if (s === '') return null;
  s = s.replace(/\s+/g, '').replace(/cve|ecv|eur|[$€]/gi, '');
  if (s === '') return NaN;

  let negativo = false;
  if (/^[-+]/.test(s)) {
    negativo = s.startsWith('-');
    s = s.slice(1);
  }
  if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return NaN;

  const ponto = s.lastIndexOf('.');
  const virgula = s.lastIndexOf(',');
  let decimal = '';
  if (ponto >= 0 && virgula >= 0) {
    decimal = ponto > virgula ? '.' : ',';
  } else if (ponto >= 0 || virgula >= 0) {
    // Um só tipo de separador: casas decimais se aparece uma vez com 1–2 (ou 4+)
    // dígitos a seguir ("1,5", "1.50"); milhares se repete ou tem 3 dígitos ("1.234").
    const sep = ponto >= 0 ? '.' : ',';
    const partes = s.split(sep);
    if (partes.length === 2 && partes[1].length !== 3) decimal = sep;
  }

  let numero: string;
  if (decimal) {
    const i = s.lastIndexOf(decimal);
    const inteira = s.slice(0, i).replace(/[.,]/g, '') || '0';
    const casas = s.slice(i + 1).replace(/[.,]/g, '') || '0';
    numero = `${inteira}.${casas}`;
  } else {
    numero = s.replace(/[.,]/g, '');
  }
  const v = Number(numero);
  return Number.isNaN(v) ? NaN : negativo ? -v : v;
}

/**
 * Montante em cêntimos = `Fix(valor * 100)` da macro (trunca casas a mais),
 * mas sem o erro de vírgula flutuante (0,29 * 100 = 28,999… → 28).
 */
export function centimos(valor: number): number {
  return Math.trunc(Math.round(valor * 1e6) / 1e4);
}

// ---------------------------------------------------------------- linhas

export interface LinhaBrutaOIC {
  nib: unknown;
  montante: unknown;
  nome: unknown;
  descritivo: unknown;
}

export interface LinhaTratadaOIC {
  /** Linha sem nada (a macro ignora-a). */
  vazia: boolean;
  nib: string;
  nome: string;
  descritivo: string;
  montante: number | null;
  cents: number;
  erro: string | null;
  /** Carateres que o ANSI não tem e que vão sair como "?". */
  substituidos: number;
}

/** As validações da macro, pela mesma ordem; devolve o primeiro erro da linha. */
export function tratarLinhaOIC(l: LinhaBrutaOIC, descritivoPadrao = ''): LinhaTratadaOIC {
  const n = limparNib(l.nib);
  const nomeLimpo = limparTexto(l.nome);
  let descLimpa = limparTexto(l.descritivo);
  const montante = parseMontante(l.montante);

  // Um descritivo sozinho não é uma linha: o modelo traz "Pagamento Ordenado"
  // pré-preenchido em linhas sem dados (a macro ignora-as porque só vai até à
  // última linha com NIB).
  let vazia = n.nib === '' && !n.temLetras && !n.perdeuDigitos && nomeLimpo === '' && montante === null;
  // Linhas de totais das folhas de pagamento ("Total Vencimento", ou só um valor solto no fim):
  // sem NIB e sem nome, ou com nome a começar por "Total", não são pagamentos.
  if (n.nib === '' && !n.temLetras && !n.perdeuDigitos && (nomeLimpo === '' || /^total/i.test(nomeLimpo))) vazia = true;

  if (descLimpa === '') descLimpa = limparTexto(descritivoPadrao);
  const nome = paraAnsi(nomeLimpo);
  const desc = paraAnsi(descLimpa);

  const base: LinhaTratadaOIC = {
    vazia,
    nib: n.nib,
    nome: nome.texto,
    descritivo: desc.texto,
    montante,
    cents: 0,
    erro: null,
    substituidos: nome.substituidos + desc.substituidos,
  };
  if (vazia) return base;

  if (n.perdeuDigitos) {
    return { ...base, erro: 'NIB guardado como número no Excel (perdeu dígitos) — formata a coluna como Texto.' };
  }
  if (n.nib === '') return { ...base, erro: 'NIB obrigatório.' };
  if (n.nib.length !== 21) return { ...base, erro: `NIB deve ter 21 dígitos (tem ${n.nib.length}).` };
  if (n.nib.startsWith('0003')) return { ...base, erro: 'NIB do BCA não permitido em interbancário.' };

  if (nome.texto === '') return { ...base, erro: 'Nome obrigatório.' };

  if (desc.texto === '') return { ...base, erro: 'Descritivo obrigatório.' };
  if ([...desc.texto].length > TAM_DESC) {
    return { ...base, erro: `Descritivo não pode exceder ${TAM_DESC} caracteres.` };
  }

  if (montante === null) return { ...base, erro: 'Montante obrigatório.' };
  if (Number.isNaN(montante) || !Number.isFinite(montante)) return { ...base, erro: 'Montante deve ser numérico.' };
  if (montante <= 0) return { ...base, erro: 'Montante deve ser maior que 0.' };

  const cents = centimos(montante);
  if (Math.trunc(cents / 100) > MAX_INTEIRO) {
    return { ...base, erro: 'Montante demasiado grande para o ficheiro (máximo 99 999 999).' };
  }
  return { ...base, cents };
}

/** Uma linha do ficheiro (135 caracteres), como a macro monta. */
export function formatarLinhaOIC(l: Pick<LinhaTratadaOIC, 'nib' | 'nome' | 'descritivo' | 'cents'>): string {
  const valor100 = (' '.repeat(15) + String(l.cents)).slice(-15);
  const nome27 = (l.nome + ' '.repeat(TAM_NOME)).slice(0, TAM_NOME);
  const desc40 = (l.descritivo + ' '.repeat(TAM_DESC)).slice(0, TAM_DESC);
  const valorFinal = (' '.repeat(8) + String(Math.trunc(l.cents / 100))).slice(-8);
  const linha = valor100 + l.nib + ' '.repeat(20) + nome27 + desc40 + 'CVE' + valorFinal;
  return (linha + ' '.repeat(TAMANHO_LINHA)).slice(0, TAMANHO_LINHA);
}

export interface LinhaOICComRef extends LinhaTratadaOIC {
  /** Nº da linha na folha (para as mensagens de erro). */
  ref: number;
}

export interface ResultadoOIC {
  conteudo: string;
  totalRegistos: number;
  totalCentimos: number;
  erros: string[];
  substituidos: number;
}

/** Junta as linhas válidas; se alguma tiver erro não gera nada. */
export function gerarOIC(linhas: LinhaOICComRef[]): ResultadoOIC {
  const erros: string[] = [];
  const saida: string[] = [];
  let totalCentimos = 0;
  let substituidos = 0;

  for (const l of linhas) {
    if (l.vazia) continue;
    if (l.erro) {
      erros.push(`Erro na linha ${l.ref}: ${l.erro}`);
      continue;
    }
    saida.push(formatarLinhaOIC(l));
    totalCentimos += l.cents;
    substituidos += l.substituidos;
  }
  if (erros.length === 0 && saida.length === 0) erros.push('Não há linhas para gerar.');

  return {
    conteudo: erros.length > 0 ? '' : saida.join('\r\n'),
    totalRegistos: saida.length,
    totalCentimos,
    erros,
    substituidos,
  };
}

/** Nome sugerido pela macro: Interbancario_AAAAMMDD.txt (data de hoje). */
export function nomeFicheiroOIC(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `Interbancario_${y}${m}${dia}.txt`;
}

export function formatarCentimos(cents: number): string {
  return (cents / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** NIB em grupos de 4 para ler melhor. */
export function nibEmGrupos(nib: string): string {
  return nib.replace(/(.{4})/g, '$1 ').trim();
}

// ---------------------------------------------------------------- colunas

export interface ColunasOIC {
  colNib: number;
  colMontante: number;
  colNome: number;
  /** 1.ª linha de dados (1 = primeira linha da folha). */
  linhaInicial: number;
  temCabecalho: boolean;
}

const texto = (v: unknown) => (typeof v === 'string' ? v.toLowerCase().trim() : '');

const pareceNibCelula = (v: unknown) => (typeof v === 'number' ? Math.abs(v) >= 1e15 : limparNib(v).nib.length >= 15);

const pareceMontanteCelula = (v: unknown) => {
  if (pareceNibCelula(v)) return false;
  const m = parseMontante(v);
  return m !== null && !Number.isNaN(m) && m > 0;
};

const pareceNomeCelula = (v: unknown) =>
  typeof v === 'string' && (v.match(/\p{L}/gu)?.length ?? 0) >= 2 && Number.isNaN(parseMontante(v));

/**
 * Adivinha as colunas — como no PS2: primeiro pelo cabeçalho (NIB/IBAN/Conta,
 * Montante/Valor/V. Líquido, Nome/Beneficiário) e, no que faltar ou se não houver cabeçalho, pelo
 * conteúdo: NIB = a coluna com mais NIBs; Montante = a coluna (de números) que
 * sobra; Nome = a coluna com mais texto. O descritivo é escrito uma vez para todas as linhas.
 */
export function autodetectarColunasOIC(rows: unknown[][]): ColunasOIC {
  const nCols = rows.reduce((m, r) => Math.max(m, r.length), 0);

  // cabeçalho: a 1.ª linha (das primeiras 40) com pelo menos 2 títulos conhecidos
  const chaves = {
    nib: /^(nib|iban|n\.?º?\s*conta|conta|n[uú]mero da conta)/,
    montante: /^(montante|valor|v.?s*l[ií]quido|l[ií]quido|a pagar|total)/,
    nome: /^(nome|benefici|funcion|colaborad|titular)/,
  };
  let cab = -1;
  let cNib = -1;
  let cMontante = -1;
  let cNome = -1;
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const r = rows[i] ?? [];
    const acha = (re: RegExp) => r.findIndex((c) => re.test(texto(c)));
    const a = acha(chaves.nib);
    const b = acha(chaves.montante);
    const c = acha(chaves.nome);
    if ([a, b, c].filter((x) => x >= 0).length >= 2) {
      cab = i;
      cNib = a;
      cMontante = b;
      cNome = c;
      break;
    }
  }

  const inicio = cab + 1;
  const usadas = () => [cNib, cMontante, cNome];
  const pontua = (c: number, f: (v: unknown) => boolean) => {
    let n = 0;
    for (let i = inicio; i < rows.length; i++) if (f(rows[i]?.[c])) n++;
    return n;
  };
  const melhorColuna = (f: (v: unknown) => boolean) => {
    let melhor = -1;
    let melhorN = 0;
    for (let c = 0; c < nCols; c++) {
      if (usadas().includes(c)) continue;
      const n = pontua(c, f);
      if (n > melhorN) {
        melhorN = n;
        melhor = c;
      }
    }
    return melhor;
  };

  if (cNib < 0) cNib = melhorColuna(pareceNibCelula);
  if (cMontante < 0) cMontante = melhorColuna(pareceMontanteCelula);
  if (cNome < 0) cNome = melhorColuna(pareceNomeCelula);

  // o que continuar sem coluna: a 1.ª ainda livre (fica vazia se não existir)
  for (const k of ['nib', 'montante', 'nome'] as const) {
    const livre = () => {
      let c = 0;
      while (usadas().includes(c)) c++;
      return c;
    };
    if (k === 'nib' && cNib < 0) cNib = livre();
    if (k === 'montante' && cMontante < 0) cMontante = livre();
    if (k === 'nome' && cNome < 0) cNome = livre();
  }

  // 1.ª linha de dados: a seguir ao cabeçalho; sem cabeçalho, a 1.ª com NIB
  let linha = inicio;
  if (cab < 0) {
    for (let i = 0; i < rows.length; i++) {
      if (pareceNibCelula(rows[i]?.[cNib])) {
        linha = i;
        break;
      }
    }
  }
  return {
    colNib: cNib,
    colMontante: cMontante,
    colNome: cNome,
    linhaInicial: linha + 1,
    temCabecalho: cab >= 0,
  };
}
