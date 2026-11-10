import { diaNaoUtil } from './validarDataFicha';

/**
 * Qual variante da ficha corresponde a um dia (F14).
 *
 * Fim de semana e feriados (nacionais e da Praia) dão a ficha de dia não útil;
 * nos restantes dias, a de dia útil. A folha de verificação de tapes aparece
 * dentro da ficha conforme a data (ver `useTaskboard`).
 */
export interface FichaDoDia {
  formType: 'dia-util' | 'dia-nao-util';
  label: string;
  path: string;
}

export function fichaDoDia(d: Date = new Date()): FichaDoDia {
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const naoUtil = diaNaoUtil(iso);
  return naoUtil
    ? { formType: 'dia-nao-util', label: 'Dia Não Útil', path: '/sci/taskboard-dia-nao-util' }
    : { formType: 'dia-util', label: 'Dia Útil', path: '/sci/taskboard' };
}
