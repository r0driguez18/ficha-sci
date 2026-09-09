import type { FormType } from '@/services/taskboardService';
import type { TurnKey } from '@/types/taskboard';

/**
 * O que distingue as 2 variantes da ficha de procedimentos. Tudo o resto
 * (estado, gravação, validação, exportação) é partilhado — ver `useTaskboard`.
 *
 * A folha "Verificação de Tapes" não é uma variante: aparece dentro da ficha
 * de dia não útil e sempre que a data é o último dia do mês (ver `useTaskboard`).
 */
export interface TaskboardConfig {
  formType: FormType;
  title: string;
  description: string;
  /** Turnos apresentados. Dias não úteis só têm o Turno 3. */
  turns: TurnKey[];
  /** Passado ao gerador de PDF como `isDiaNaoUtil`. */
  isDiaNaoUtil: boolean;
}

const ALL_TURNS: TurnKey[] = ['turno1', 'turno2', 'turno3'];
const TURNO3_ONLY: TurnKey[] = ['turno3'];

export const TASKBOARD_CONFIGS: Record<FormType, TaskboardConfig> = {
  'dia-util': {
    formType: 'dia-util',
    title: 'Ficha de Procedimentos',
    description: 'Preencha as informações necessárias para cada turno',
    turns: ALL_TURNS,
    isDiaNaoUtil: false,
  },
  'dia-nao-util': {
    formType: 'dia-nao-util',
    title: 'Ficha de Procedimentos — Dia Não Útil',
    description: 'Preencha as informações necessárias para o dia não útil',
    turns: TURNO3_ONLY,
    isDiaNaoUtil: true,
  },
};
