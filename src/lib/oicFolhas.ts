import type * as XLSX from 'xlsx';
import { autodetectarColunasOIC, limparNib, pareceNibCelula } from './oic';
import { linhasDaFolha } from './oicFolha';

/**
 * Folhas de pagamento com uma aba por banco (BAI, BCN, BIA, CECV, ECOBANK…),
 * mais abas que não são pagamentos (BCA, RESUME…). O nome da aba não conta —
 * decide o conteúdo: só entram as abas com NIBs de outros bancos, e todas
 * juntam-se numa lista só (o que se fazia à mão, copiando de aba em aba).
 */

export interface FolhaUsada {
  folha: string;
  /** Linhas com dados (NIB, montante ou nome) que entraram na lista. */
  linhas: number;
}

export interface FolhaIgnorada {
  folha: string;
  motivo: string;
}

export interface FolhasLidas {
  /** Abas visíveis usadas, por ordem do ficheiro. */
  usadas: FolhaUsada[];
  ignoradas: FolhaIgnorada[];
  /**
   * Uma só aba com NIBs → as suas linhas tal e qual (o utilizador pode ajustar
   * as colunas). Várias → lista juntada com colunas fixas [NIB, montante, nome,
   * aba, nº da linha na aba].
   */
  modo: 'nenhuma' | 'unica' | 'junta';
  rows: unknown[][];
}

export const COLUNAS_JUNTA = { colNib: 0, colMontante: 1, colNome: 2, linhaInicial: 1 };

const temValor = (v: unknown) => v !== null && v !== undefined && String(v).trim() !== '';

export function lerFolhasOIC(wb: XLSX.WorkBook): FolhasLidas {
  // As folhas ocultas nunca entram.
  const visiveis = wb.SheetNames.filter((_, i) => !wb.Workbook?.Sheets?.[i]?.Hidden);

  const usadas: { folha: string; linhas: unknown[][]; det: ReturnType<typeof autodetectarColunasOIC> }[] = [];
  const ignoradas: FolhaIgnorada[] = [];

  for (const nome of visiveis) {
    const ws = wb.Sheets[nome];
    const linhas = ws ? linhasDaFolha(ws) : [];
    if (linhas.length === 0) {
      ignoradas.push({ folha: nome, motivo: 'vazia' });
      continue;
    }
    const det = autodetectarColunasOIC(linhas);
    const dados = linhas.slice(Math.max(0, det.linhaInicial - 1));
    const nibs = dados.map((r) => r[det.colNib]).filter(pareceNibCelula);
    if (nibs.length === 0) {
      ignoradas.push({ folha: nome, motivo: 'sem NIBs (só números de conta ou outros dados) — se for do BCA, usa o gerador PS2' });
      continue;
    }
    if (nibs.every((v) => limparNib(v).nib.startsWith('0003'))) {
      ignoradas.push({ folha: nome, motivo: 'só tem NIBs do BCA (0003…) — é para o gerador PS2' });
      continue;
    }
    usadas.push({ folha: nome, linhas, det });
  }

  if (usadas.length === 0) return { usadas: [], ignoradas, modo: 'nenhuma', rows: [] };

  if (usadas.length === 1) {
    return {
      usadas: [{ folha: usadas[0].folha, linhas: usadas[0].linhas.length }],
      ignoradas,
      modo: 'unica',
      rows: usadas[0].linhas,
    };
  }

  const rows: unknown[][] = [];
  const resumo: FolhaUsada[] = [];
  for (const u of usadas) {
    let n = 0;
    for (let i = Math.max(0, u.det.linhaInicial - 1); i < u.linhas.length; i++) {
      const r = u.linhas[i] ?? [];
      const nib = r[u.det.colNib];
      const montante = r[u.det.colMontante];
      const nome = r[u.det.colNome];
      if (!temValor(nib) && !temValor(montante) && !temValor(nome)) continue;
      rows.push([nib, montante, nome, u.folha, i + 1]);
      n += 1;
    }
    resumo.push({ folha: u.folha, linhas: n });
  }
  return { usadas: resumo, ignoradas, modo: 'junta', rows };
}
