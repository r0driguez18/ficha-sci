/**
 * Progresso de preenchimento de um turno / secção da ficha (F8).
 *
 * Conta as caixas de verificação que a pessoa vê no ecrã — e só essas. Campos de texto/hora
 * (ex.: `interromperRealTimeHora`, `saldoContaValor`) ficam de fora, tal como:
 *  - campos que existem nos dados mas não têm caixa no ecrã (restos do modelo antigo e títulos de
 *    secção): se contassem, "marcar tudo" nunca chegava ao total (ex.: 35/38);
 *  - campos que o modelo atual já não tem (um rascunho antigo pode trazê-los guardados);
 *  - o par «Saldo negativo / positivo», que se exclui mutuamente (marcar um desmarca o outro): conta
 *    como UMA tarefa, feita quando um dos dois está marcado.
 */
import { emptyTasks } from './taskboardDefaults';

export interface TaskProgress {
  done: number;
  total: number;
}

/**
 * Campos booleanos sem caixa no ecrã. Continuam aqui, e não só no modelo de dados, porque
 * rascunhos e fichas antigas ainda os trazem guardados.
 */
export const CAMPOS_SEM_CAIXA: ReadonlySet<string> = new Set([
  'bcta',
  'backupsDiferidos', // só o título da secção, no PDF
  'envioFicheirosVisa12h30',
  'inpsProcessar',
  'envioFicheirosVisaPafCaf',
]);

/** Os campos do modelo atual (os de rascunhos antigos que entretanto saíram do modelo não contam). */
const CAMPOS_DO_MODELO: ReadonlySet<string> = new Set(
  Object.values(emptyTasks()).flatMap((turno) => Object.keys(turno as object)),
);

/** Caixas que não podem estar marcadas as duas ao mesmo tempo: contam como uma. */
export const PARES_EXCLUSIVOS: ReadonlyArray<readonly [string, string]> = [['saldoNegativo', 'saldoPositivo']];

export function countTaskProgress(
  tasks: object | null | undefined,
  keys?: readonly string[],
): TaskProgress {
  if (!tasks) return { done: 0, total: 0 };
  const record = tasks as Record<string, unknown>;
  const chaves = (keys ?? Object.keys(record)).filter((k) => typeof record[k] === 'boolean' && CAMPOS_DO_MODELO.has(k) && !CAMPOS_SEM_CAIXA.has(k));

  // O segundo de cada par exclusivo não conta à parte: o primeiro vale pelos dois.
  const segundos = new Set<string>();
  for (const [a, b] of PARES_EXCLUSIVOS) if (chaves.includes(a) && chaves.includes(b)) segundos.add(b);

  let done = 0;
  let total = 0;
  for (const k of chaves) {
    if (segundos.has(k)) continue;
    total += 1;
    const par = PARES_EXCLUSIVOS.find(([a]) => a === k);
    const feita = record[k] === true || (par !== undefined && segundos.has(par[1]) && record[par[1]] === true);
    if (feita) done += 1;
  }
  return { done, total };
}
