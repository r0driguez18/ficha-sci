/**
 * Impressão digital do conteúdo de uma ficha (F2).
 *
 * Calcula um SHA-256 sobre uma serialização estável (chaves ordenadas) dos
 * dados que compõem a ficha. Guardado no registo da assinatura, permite mais
 * tarde verificar que o PDF/arquivo não foi adulterado: se recalcularmos o
 * hash a partir do JSON guardado e ele bater certo, o conteúdo é o mesmo que
 * foi assinado.
 */

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value ?? null);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`)
    .join(',')}}`;
}

export interface FichaHashInput {
  date: string;
  formType: string;
  turnData: unknown;
  tasks: unknown;
  tableRows: unknown;
}

export async function computeFichaHash(input: FichaHashInput): Promise<string> {
  const canonical = stableStringify({
    date: input.date,
    form_type: input.formType,
    turn_data: input.turnData,
    tasks: input.tasks,
    table_rows: input.tableRows,
  });
  const bytes = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Versão curta para mostrar/imprimir (primeiros 12 hex ≈ 48 bits). */
export function shortHash(hash: string | undefined | null): string {
  return hash ? hash.slice(0, 12) : '';
}
