import type { FormType } from '@/services/taskboardService';
import type { TurnKey } from '@/types/taskboard';

/**
 * O que distingue as 4 variantes da ficha de procedimentos. Tudo o resto
 * (estado, gravação, validação, exportação) é partilhado — ver `useTaskboard`.
 */
export interface TaskboardConfig {
  formType: FormType;
  title: string;
  description: string;
  /** Turnos apresentados. Dias não úteis só têm o Turno 3. */
  turns: TurnKey[];
  /** Passado ao gerador de PDF como `isDiaNaoUtil`. */
  isDiaNaoUtil: boolean;
  /** Fim de mês: sempre tratado como fecho mensal, independentemente da data. */
  forceEndOfMonth: boolean;
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
    forceEndOfMonth: false,
  },
  'dia-nao-util': {
    formType: 'dia-nao-util',
    title: 'Ficha de Procedimentos — Dia Não Útil',
    description: 'Preencha as informações necessárias para o dia não útil',
    turns: TURNO3_ONLY,
    isDiaNaoUtil: true,
    forceEndOfMonth: false,
  },
  'final-mes-util': {
    formType: 'final-mes-util',
    title: 'Ficha de Procedimentos — Final do Mês Dia Útil',
    description: 'Preencha as informações necessárias para o dia de fecho de final de mês',
    turns: ALL_TURNS,
    isDiaNaoUtil: false,
    forceEndOfMonth: true,
  },
  'final-mes-nao-util': {
    formType: 'final-mes-nao-util',
    title: 'Ficha de Procedimentos — Final do Mês Dia Não Útil',
    description: 'Preencha as informações necessárias para o fecho de final de mês em dia não útil',
    turns: TURNO3_ONLY,
    isDiaNaoUtil: true,
    forceEndOfMonth: true,
  },
};
