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
  { value: 'ebrito', label: 'Elvis Brito' },
  { value: 'lspencer', label: 'Louis Spencer' },
];

/**
 * Opções para o campo "Validado por" da assinatura da ficha.
 * Usa o nome como valor porque é o que é impresso no PDF final.
 */
export const SIGNATORY_OPTIONS: string[] = OPERATORS.map((o) => o.label);

/** Procura o nome apresentável a partir do `value` guardado nos dados. */
export function operatorLabel(value: string | null | undefined): string {
  if (!value) return '';
  return OPERATORS.find((o) => o.value === value)?.label ?? value;
}
