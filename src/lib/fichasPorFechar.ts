/**
 * Fichas por fechar: rascunhos de dias anteriores que ainda ninguém exportou/assinou.
 *
 * Exportar apaga o rascunho, por isso "ainda existe um rascunho de um dia passado" quer dizer
 * "falta fechar esta ficha". Só contam os que têm conteúdo: abrir uma ficha cria logo um
 * rascunho vazio (gravação automática) e isso não é trabalho por fechar.
 * Lógica pura (sem React nem Supabase) para se poder testar.
 */

export type TipoFicha = 'dia-util' | 'dia-nao-util';

export const NOME_FICHA: Record<TipoFicha, string> = {
  'dia-util': 'Dia útil',
  'dia-nao-util': 'Dia não útil',
};

export const ROTA_FICHA: Record<TipoFicha, string> = {
  'dia-util': '/sci/taskboard',
  'dia-nao-util': '/sci/taskboard-dia-nao-util',
};

export interface RascunhoBruto {
  form_type: string;
  date: string;
  turn_data: unknown;
  tasks: unknown;
  table_rows: unknown;
  updated_at?: string | null;
}

export interface FichaPorFechar {
  formType: TipoFicha;
  date: string;
  atualizadaEm: string | null;
  tarefasFeitas: number;
  processamentos: number;
}

const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Caixas marcadas, em todos os turnos. */
function contarTarefasFeitas(tasks: unknown): number {
  if (!tasks || typeof tasks !== 'object') return 0;
  let n = 0;
  for (const turno of Object.values(tasks as Record<string, unknown>)) {
    if (!turno || typeof turno !== 'object') continue;
    for (const v of Object.values(turno as Record<string, unknown>)) if (v === true) n += 1;
  }
  return n;
}

/** Linhas da tabela com algo mais do que o "executado por" pré-preenchido. */
function contarProcessamentos(rows: unknown): number {
  if (!Array.isArray(rows)) return 0;
  return rows.filter((r) => {
    const x = (r ?? {}) as Record<string, unknown>;
    return texto(x.tarefa) || texto(x.nomeAs) || texto(x.operacao) || texto(x.tipo);
  }).length;
}

/** Alguém preencheu mesmo alguma coisa (operador, horas, observações, tarefas ou processamentos)? */
function temTurnosPreenchidos(turnData: unknown): boolean {
  if (!turnData || typeof turnData !== 'object') return false;
  return Object.values(turnData as Record<string, unknown>).some((t) => {
    const x = (t ?? {}) as Record<string, unknown>;
    return texto(x.operator) || texto(x.entrada) || texto(x.saida) || texto(x.observations);
  });
}

export function resumirRascunho(r: RascunhoBruto): FichaPorFechar | null {
  if (r.form_type !== 'dia-util' && r.form_type !== 'dia-nao-util') return null;
  const tarefasFeitas = contarTarefasFeitas(r.tasks);
  const processamentos = contarProcessamentos(r.table_rows);
  if (tarefasFeitas === 0 && processamentos === 0 && !temTurnosPreenchidos(r.turn_data)) return null;
  return {
    formType: r.form_type,
    date: r.date,
    atualizadaEm: r.updated_at ?? null,
    tarefasFeitas,
    processamentos,
  };
}

/** Rascunhos de dias anteriores a `hoje` (AAAA-MM-DD) com conteúdo, do mais antigo para o mais recente. */
export function fichasPorFechar(rascunhos: RascunhoBruto[], hoje: string): FichaPorFechar[] {
  return rascunhos
    .filter((r) => r.date < hoje)
    .map(resumirRascunho)
    .filter((f): f is FichaPorFechar => f !== null)
    .sort((a, b) => a.date.localeCompare(b.date) || a.formType.localeCompare(b.formType));
}

/** AAAA-MM-DD → DD/MM/AAAA */
export const dataCurta = (iso: string) => iso.split('-').reverse().join('/');
