/**
 * Texto colado (do Excel, de um CSV, de um PDF/email) → matriz de células, para os geradores PS2 e OIC.
 *
 * O que estragava a colagem: o Excel mete entre aspas as células que têm um tab, uma quebra de linha ou aspas
 * (por exemplo um nome com um tab perdido, ou uma célula com Alt+Enter) e o leitor antigo cortava ali, deslocando
 * todas as colunas seguintes dessa linha. Agora lê as aspas como o Excel as escreve e, quando não há tabs,
 * escolhe o separador que dá colunas certas ("; ", "|", dois ou mais espaços, vírgula).
 */

export interface OpcoesColagem {
  /** Mantém as linhas em branco (a numeração das linhas bate com a do Excel). Por defeito saem. */
  manterVazias?: boolean;
}

/** Parte `texto` em linhas/células com `sep` (1 carácter), respeitando células entre aspas. */
function lerComAspas(texto: string, sep: string): string[][] {
  const linhas: string[][] = [];
  let linha: string[] = [];
  let campo = '';
  let emAspas = false;
  let inicioCampo = true;

  const fechaCampo = () => {
    linha.push(campo);
    campo = '';
    inicioCampo = true;
  };
  const fechaLinha = () => {
    fechaCampo();
    linhas.push(linha);
    linha = [];
  };

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (emAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          emAspas = false;
        }
      } else {
        campo += c === '\n' || c === '\r' ? ' ' : c;
      }
      continue;
    }
    if (c === '"' && inicioCampo) {
      emAspas = true;
      inicioCampo = false;
    } else if (c === sep) {
      fechaCampo();
    } else if (c === '\n') {
      fechaLinha();
    } else if (c === '\r') {
      if (texto[i + 1] === '\n') i++;
      fechaLinha();
    } else {
      campo += c;
      inicioCampo = false;
    }
  }
  if (campo !== '' || linha.length > 0) fechaLinha();
  return linhas;
}

/** Linhas simples (sem aspas) — para os separadores que não são um carácter só. */
function lerPorRegex(texto: string, sep: RegExp): string[][] {
  return texto.split(/\r\n|\r|\n/).map((l) => l.split(sep));
}

/** O separador serve se a maior parte das linhas com texto tiver 2 ou mais colunas e quase todas o mesmo número. */
function serve(linhas: string[][]): boolean {
  const comTexto = linhas.filter((l) => l.some((c) => c.trim() !== ''));
  if (comTexto.length === 0) return false;
  const nCols = comTexto.map((l) => l.length);
  const comVarias = nCols.filter((n) => n >= 2).length;
  if (comVarias / comTexto.length < 0.6) return false;
  const freq = new Map<number, number>();
  for (const n of nCols) freq.set(n, (freq.get(n) ?? 0) + 1);
  const moda = Math.max(...freq.values());
  return moda / comTexto.length >= 0.6;
}

/** Espaço sem quebra (0xA0) e espaço de largura zero (0x200B): o Excel/Word põem-nos sem se ver. */
const ESPACOS_ESPECIAIS = [String.fromCharCode(0xa0), String.fromCharCode(0x200b)];

export function parseTabular(texto: string, opcoes: OpcoesColagem = {}): string[][] {
  if (texto.trim() === '') return [];

  let linhas: string[][];
  if (texto.includes('\t')) {
    // Excel: tab. Sem aspas no texto, nada muda; com aspas, lê-as como o Excel.
    linhas = lerComAspas(texto, '\t');
  } else {
    const candidatos: Array<() => string[][]> = [
      () => lerComAspas(texto, ';'),
      () => lerComAspas(texto, '|'),
      () => lerPorRegex(texto, /\s{2,}/),
      () => lerComAspas(texto, ','),
    ];
    let escolhido: string[][] | null = null;
    for (const f of candidatos) {
      const r = f();
      if (serve(r)) {
        escolhido = r;
        break;
      }
    }
    // Nenhum separador serve: uma coluna só (uma lista de NIBs, por exemplo).
    linhas = escolhido ?? texto.split(/\r\n|\r|\n/).map((l) => [l]);
  }

  const limpa = linhas.map((l) => l.map((c) => c.split(ESPACOS_ESPECIAIS[0]).join(' ').split(ESPACOS_ESPECIAIS[1]).join(' ').trim()));
  while (limpa.length > 0 && limpa[limpa.length - 1].every((c) => c === '')) limpa.pop();
  return opcoes.manterVazias ? limpa : limpa.filter((l) => l.some((c) => c !== ''));
}
