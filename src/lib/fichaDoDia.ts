/**
 * Qual variante da ficha corresponde a um dia (F14).
 *
 * A app só distingue fim de semana de dia útil — não há calendário de
 * feriados ligado. Ao domingo/sábado abre a ficha de dia não útil; nos
 * restantes dias, a de dia útil. A folha de verificação de tapes aparece
 * dentro da ficha conforme a data (ver `useTaskboard`).
 */
export interface FichaDoDia {
  formType: 'dia-util' | 'dia-nao-util';
  label: string;
  path: string;
}

export function fichaDoDia(d: Date = new Date()): FichaDoDia {
  const dow = d.getDay(); // 0 = domingo … 6 = sábado
  const naoUtil = dow === 0 || dow === 6;
  return naoUtil
    ? { formType: 'dia-nao-util', label: 'Dia Não Útil', path: '/sci/taskboard-dia-nao-util' }
    : { formType: 'dia-util', label: 'Dia Útil', path: '/sci/taskboard' };
}
