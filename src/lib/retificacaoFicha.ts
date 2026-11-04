/**
 * Retificação de fichas exportadas: diferenças entre duas versões e a assinatura da versão nova.
 */
import type { FichaSignature } from '@/types/signature';

export interface ConteudoFicha {
  date: string;
  turn_data: Record<string, unknown>;
  tasks: Record<string, unknown>;
  table_rows: Array<Record<string, unknown>>;
}

export interface Diferenca {
  campo: string;
  de: string;
  para: string;
}

/** "percurso76857_7h30" → "percurso 76857 7h30" (só para mostrar; as chaves não têm texto próprio). */
export function rotuloChave(chave: string): string {
  return chave
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z]{3,})(\d)/g, '$1 $2')
    .toLowerCase();
}

const NOME_TURNO: Record<string, string> = { turno1: 'Turno 1', turno2: 'Turno 2', turno3: 'Turno 3' };

const texto = (v: unknown): string => {
  if (v === true) return 'sim';
  if (v === false) return 'não';
  if (v === undefined || v === null || v === '') return '—';
  return String(v);
};

const iguais = (a: unknown, b: unknown) => texto(a) === texto(b);

const CAMPOS_TURNO: Record<string, string> = {
  operator: 'operador',
  entrada: 'entrada',
  saida: 'saída',
  observations: 'observações',
};

const CAMPOS_LINHA: Record<string, string> = {
  hora: 'hora',
  tarefa: 'tarefa',
  nomeAs: 'nome AS',
  operacao: 'operação',
  executado: 'executado',
  tipo: 'tipo',
};

/** Tudo o que mudou entre a versão `antes` e a `depois`, em linguagem legível. */
export function diffFicha(antes: ConteudoFicha, depois: ConteudoFicha): Diferenca[] {
  const out: Diferenca[] = [];
  const push = (campo: string, de: unknown, para: unknown) => {
    if (!iguais(de, para)) out.push({ campo, de: texto(de), para: texto(para) });
  };

  push('Data da ficha', antes.date, depois.date);

  // Turnos (e a folha de tapes, que vai dentro de turn_data.verificacaoTapes)
  for (const t of Object.keys({ ...antes.turn_data, ...depois.turn_data })) {
    if (t === 'verificacaoTapes') continue;
    const a = (antes.turn_data?.[t] ?? {}) as Record<string, unknown>;
    const d = (depois.turn_data?.[t] ?? {}) as Record<string, unknown>;
    for (const k of Object.keys({ ...a, ...d })) {
      push(`${NOME_TURNO[t] ?? t} · ${CAMPOS_TURNO[k] ?? k}`, a[k], d[k]);
    }
  }
  const ta = (antes.turn_data?.verificacaoTapes ?? {}) as Record<string, unknown>;
  const td = (depois.turn_data?.verificacaoTapes ?? {}) as Record<string, unknown>;
  for (const k of Object.keys({ ...ta, ...td })) {
    push(`Tapes · ${k === 'verificadoPor' ? 'verificado por' : k.toUpperCase()}`, ta[k], td[k]);
  }

  // Tarefas
  for (const t of Object.keys({ ...antes.tasks, ...depois.tasks })) {
    const a = (antes.tasks?.[t] ?? {}) as Record<string, unknown>;
    const d = (depois.tasks?.[t] ?? {}) as Record<string, unknown>;
    for (const k of Object.keys({ ...a, ...d })) {
      push(`${NOME_TURNO[t] ?? t} · ${rotuloChave(k)}`, a[k], d[k]);
    }
  }

  // Tabela de processamentos (por id da linha)
  const porId = (rows: Array<Record<string, unknown>>) => new Map((rows ?? []).map((r) => [String(r.id), r]));
  const ra = porId(antes.table_rows);
  const rd = porId(depois.table_rows);
  const resumo = (r: Record<string, unknown>) =>
    [r.hora, r.tarefa, r.nomeAs, r.operacao].filter((x) => x !== undefined && x !== '').join(' · ') || '(linha vazia)';
  for (const [id, r] of ra) {
    const n = rd.get(id);
    if (!n) {
      out.push({ campo: `Tabela · linha ${id}`, de: resumo(r), para: 'apagada' });
      continue;
    }
    for (const k of Object.keys(CAMPOS_LINHA)) push(`Tabela · linha ${id} · ${CAMPOS_LINHA[k]}`, r[k], n[k]);
  }
  for (const [id, n] of rd) {
    if (!ra.has(id)) out.push({ campo: `Tabela · linha ${id}`, de: 'não existia', para: resumo(n) });
  }
  return out;
}

export interface RetificacaoInfo {
  versao: number;
  por: string;
  porUserId: string;
  em: string;
  motivo: string;
}

/**
 * Assinatura da ficha retificada: o signatário original mantém-se (continua a aparecer em "Responsável"),
 * o selo SHA-256 passa a ser o do conteúdo novo e `retificacao` diz quem retificou, quando e porquê.
 */
export function assinaturaRetificada(
  original: FichaSignature,
  novoHash: string,
  info: RetificacaoInfo,
): FichaSignature & { retificacao: RetificacaoInfo } {
  return { ...original, contentHash: novoHash, retificacao: info };
}

export function retificacaoDe(sig: unknown): RetificacaoInfo | null {
  const r = (sig as { retificacao?: RetificacaoInfo } | null | undefined)?.retificacao;
  return r && typeof r.versao === 'number' ? r : null;
}
