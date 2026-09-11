import { addDays, isWeekend } from 'date-fns';

/**
 * Regra de SLA dos retornos de cobrança (F7).
 *
 * Todos os ficheiros de cobrança têm o mesmo prazo: o retorno tem de ser
 * enviado no **dia útil seguinte** ao da aplicação. A partir daí conta como
 * atraso; com **mais de 2 dias úteis** de atraso passa a **urgente**.
 *
 * As datas guardadas (`data_aplicacao`, `data_retorno_esperada`) estão no
 * formato `YYYY-MM-DD`. `new Date('YYYY-MM-DD')` é interpretado como UTC e,
 * em Cabo Verde (UTC−1), faz o cálculo de "hoje / atraso" saltar um dia — por
 * isso tudo aqui trabalha com datas locais à meia-noite.
 */

export type ReturnSeverity = 'enviado' | 'pendente' | 'due' | 'atrasado' | 'urgente';

/** Dias úteis de atraso a partir dos quais um retorno é considerado urgente. */
export const URGENTE_APOS_DIAS_UTEIS = 2;

/** `YYYY-MM-DD` (ou ISO com tempo) → `Date` à meia-noite local. */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Hoje à meia-noite local. */
export function todayLocal(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** `Date` → `YYYY-MM-DD` (componentes locais). */
export function toIsoDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date);
}

/** Primeiro dia útil estritamente depois de `date`. */
export function nextBusinessDay(date: Date): Date {
  let d = addDays(date, 1);
  while (!isBusinessDay(d)) d = addDays(d, 1);
  return d;
}

/**
 * Dias úteis entre `from` (exclusive) e `to` (inclusive).
 * Positivo se `to` está no futuro, negativo se no passado, 0 se for o mesmo dia.
 */
export function businessDaysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  // Uma data inválida (ex.: `data_retorno_esperada` corrompida) faz
  // `getTime()` devolver NaN — NaN nunca é igual a si próprio, por isso o
  // ciclo abaixo nunca terminaria. Falha de forma controlada em vez de
  // travar a página.
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    return 0;
  }
  if (a.getTime() === b.getTime()) return 0;
  const step = b > a ? 1 : -1;
  let count = 0;
  let cur = a;
  while (cur.getTime() !== b.getTime()) {
    cur = addDays(cur, step);
    if (isBusinessDay(cur)) count += step;
  }
  return count;
}

export interface ReturnStatus {
  severity: ReturnSeverity;
  /** Dias úteis até à data esperada: >0 faltam, 0 vence hoje, <0 em atraso. */
  businessDaysDelta: number;
  /** Texto curto pronto a mostrar ("Faltam 2 dias úteis", "Atrasado há 3 dias úteis"). */
  label: string;
}

export function returnStatus(
  r: { retorno_enviado: boolean; data_retorno_esperada: string },
  today: Date = todayLocal(),
): ReturnStatus {
  if (r.retorno_enviado) {
    return { severity: 'enviado', businessDaysDelta: 0, label: 'Enviado' };
  }

  const expected = parseLocalDate(r.data_retorno_esperada);
  const delta = businessDaysBetween(today, expected);

  if (delta > 0) {
    return {
      severity: 'pendente',
      businessDaysDelta: delta,
      label: delta === 1 ? 'Falta 1 dia útil' : `Faltam ${delta} dias úteis`,
    };
  }
  if (delta === 0) {
    return { severity: 'due', businessDaysDelta: 0, label: 'Vence hoje' };
  }

  const atraso = -delta;
  const severity: ReturnSeverity =
    atraso > URGENTE_APOS_DIAS_UTEIS ? 'urgente' : 'atrasado';
  const base = atraso === 1 ? 'Atrasado há 1 dia útil' : `Atrasado há ${atraso} dias úteis`;
  return {
    severity,
    businessDaysDelta: delta,
    label: severity === 'urgente' ? `URGENTE · ${base}` : base,
  };
}
