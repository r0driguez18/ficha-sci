/**
 * Lista de operadores do Centro Informática.
 *
 * A fonte a usar em runtime é a tabela `operators` na base de dados, através do
 * hook `useOperators()` (ver F9). Esta constante fica como **recurso de recurso**:
 * é o que o hook devolve enquanto a base de dados não responde ou está offline,
 * para que os dropdowns nunca fiquem vazios. Manter alinhada com o seed da
 * migração `..._operators.sql`.
 */

export interface Operator {
  /** Identificador curto usado nos dados (ex.: guardado em `file_processes.executed_by`). */
  value: string;
  /** Nome apresentado ao utilizador. */
  label: string;
}

export const OPERATORS: Operator[] = [
  { value: 'nalves', label: 'Nelson Alves' },
  { value: 'etavares', label: 'Evandro Tavares' },
  { value: 'edelgado', label: 'Emanuel Delgado' },
  { value: 'elvisb', label: 'Elvis Brito' },
  { value: 'lspencer', label: 'Louis Spencer' },
];

/**
 * Códigos que já existiram e foram corrigidos. As fichas já assinadas não se reescrevem (o selo
 * de integridade cobre o código do operador), por isso o código antigo continua nos dados
 * históricos e resolve-se para o atual.
 */
export const CODIGOS_ANTIGOS: Record<string, string> = { ebrito: 'elvisb' };

export function codigoAtual(value: string): string {
  return CODIGOS_ANTIGOS[value] ?? value;
}

/**
 * Nome apresentável a partir do `value` guardado nos dados. Só conhece os 5
 * operadores estáticos — para dados que possam conter operadores da tabela
 * `operators` (F9), usar `labelOf` de `useOperators()`.
 */
export function operatorLabel(value: string | null | undefined): string {
  if (!value) return '';
  const atual = codigoAtual(value);
  return OPERATORS.find((o) => o.value === atual)?.label ?? value;
}
