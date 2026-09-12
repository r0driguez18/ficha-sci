/**
 * Agregação mensal dos processamentos, para o gráfico de evolução (F6).
 *
 * Feito no cliente a partir da lista já carregada, para não fazer leituras
 * extra à base de dados e para o filtro de intervalo ser instantâneo.
 */
import type { FileProcess } from '@/services/fileProcessService';

export interface MonthlyStat {
  /** Etiqueta apresentada (MM/AA). */
  month: string;
  /** Chave ordenável (AAAA-MM). */
  key: string;
  salario: number;
  cobrancas: number;
  compensacao: number;
  outros: number;
  total: number;
}

function localDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  // `date_registered` vem como 'AAAA-MM-DD'. Interpretar como data local
  // (não UTC) para o mês não saltar em fusos negativos.
  const [y, m, d] = value.split('T')[0].split('-').map(Number);
  if (!y || !m) return null;
  return new Date(y, m - 1, d || 1);
}

export function buildMonthlyStats(
  rows: FileProcess[],
  from?: string,
  to?: string,
): MonthlyStat[] {
  const fromD = from ? localDate(from) : null;
  const toD = to ? localDate(to) : null;

  const byMonth = new Map<string, MonthlyStat>();

  for (const row of rows) {
    const date = localDate(row.date_registered);
    if (!date) continue;
    if (fromD && date < fromD) continue;
    if (toD && date > toD) continue;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = `${date.getMonth() + 1}/${String(date.getFullYear()).slice(-2)}`;

    let stat = byMonth.get(key);
    if (!stat) {
      stat = { month: label, key, salario: 0, cobrancas: 0, compensacao: 0, outros: 0, total: 0 };
      byMonth.set(key, stat);
    }

    switch (row.tipo) {
      case 'salario': stat.salario += 1; break;
      case 'cobrancas': stat.cobrancas += 1; break;
      case 'compensacao': stat.compensacao += 1; break;
      default: stat.outros += 1; break;
    }
    stat.total += 1;
  }

  return Array.from(byMonth.values()).sort((a, b) => a.key.localeCompare(b.key));
}

/** Filtra linhas cujo `date_registered` cai no intervalo [from, to] (inclusive). */
export function filterByRange<T extends { date_registered?: string | null }>(
  rows: T[],
  from?: string,
  to?: string,
): T[] {
  const fromD = from ? localDate(from) : null;
  const toD = to ? localDate(to) : null;
  if (!fromD && !toD) return rows;
  return rows.filter((row) => {
    const date = localDate(row.date_registered);
    if (!date) return false;
    if (fromD && date < fromD) return false;
    if (toD && date > toD) return false;
    return true;
  });
}

/** Intervalo por omissão: primeiro dia de há N meses até hoje (datas locais 'AAAA-MM-DD'). */
export function defaultRange(months = 6): { from: string; to: string } {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { from: iso(from), to: iso(to) };
}
