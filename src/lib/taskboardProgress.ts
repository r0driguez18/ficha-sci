/**
 * Progresso de preenchimento de um turno / secção da ficha (F8).
 *
 * Conta apenas os campos booleanos (as caixas de verificação). Campos de
 * texto/hora (ex.: `interromperRealTimeHora`, `saldoContaValor`) são ignorados.
 */
export interface TaskProgress {
  done: number;
  total: number;
}

export function countTaskProgress(
  tasks: object | null | undefined,
  keys?: readonly string[],
): TaskProgress {
  if (!tasks) return { done: 0, total: 0 };
  const record = tasks as Record<string, unknown>;
  const values = keys ? keys.map((k) => record[k]) : Object.values(record);

  let done = 0;
  let total = 0;
  for (const value of values) {
    if (typeof value === 'boolean') {
      total += 1;
      if (value) done += 1;
    }
  }
  return { done, total };
}
