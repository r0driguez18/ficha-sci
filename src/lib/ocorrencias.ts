/**
 * Ficha de Comunicação/Ocorrências: os campos da ficha em papel (N.º Avaria, Descrição, Hora Início,
 * Hora Término, Encaminhamento), mais categoria e sistema opcionais para pesquisar e ver o que se repete.
 * Lógica pura (sem React nem Supabase) para se poder testar à parte.
 */

export const CATEGORIAS = [
  { valor: 'core', nome: 'Core / aplicações' },
  { valor: 'ficheiros', nome: 'Ficheiros e processamentos' },
  { valor: 'rede', nome: 'Rede e comunicações' },
  { valor: 'servidores', nome: 'Servidores e sistemas' },
  { valor: 'balcoes', nome: 'Balcões' },
  { valor: 'cartoes', nome: 'Cartões e SISP' },
  { valor: 'seguranca', nome: 'Segurança' },
  { valor: 'outro', nome: 'Outro' },
] as const;

export const TURNOS = [
  { valor: 'turno1', nome: 'Turno 1' },
  { valor: 'turno2', nome: 'Turno 2' },
  { valor: 'turno3', nome: 'Turno 3' },
] as const;

/** A ficha em papel tem 12 linhas: o PDF completa com linhas em branco até este número. */
export const LINHAS_DA_FICHA = 12;

export type Categoria = (typeof CATEGORIAS)[number]['valor'];

export interface Ocorrencia {
  id: string;
  data: string;
  turno: string | null;
  n_avaria: string | null;
  descricao: string;
  hora_inicio: string | null;
  hora_termino: string | null;
  encaminhamento: string | null;
  categoria: Categoria | null;
  sistema: string | null;
  criada_por_codigo: string | null;
  criada_em: string;
}

/** Sem hora de término = ainda em curso. */
export const emCurso = (o: Pick<Ocorrencia, 'hora_termino'>) => !o.hora_termino;

export const nomeCategoria = (v: string | null) => CATEGORIAS.find((c) => c.valor === v)?.nome ?? '';
export const nomeTurno = (v: string | null) => TURNOS.find((t) => t.valor === v)?.nome ?? '';

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface FormOcorrencia {
  data: string;
  turno: string;
  n_avaria: string;
  descricao: string;
  hora_inicio: string;
  hora_termino: string;
  encaminhamento: string;
  categoria: string;
  sistema: string;
}

/** Devolve a mensagem de erro, ou null se o formulário serve. */
export function validarOcorrencia(f: FormOcorrencia): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.data)) return 'Indica a data.';
  const descricao = f.descricao.trim();
  if (descricao.length < 3) return 'A descrição deve ter pelo menos 3 caracteres.';
  if (descricao.length > 1000) return 'A descrição não pode ter mais de 1000 caracteres.';
  if (f.hora_inicio && !HORA.test(f.hora_inicio)) return 'A hora de início não é válida (HH:MM).';
  if (f.hora_termino && !HORA.test(f.hora_termino)) return 'A hora de término não é válida (HH:MM).';
  if (f.hora_termino && !f.hora_inicio) return 'Indica a hora de início antes da hora de término.';
  if (f.n_avaria.trim().length > 30) return 'O N.º da avaria não pode ter mais de 30 caracteres.';
  if (f.encaminhamento.trim().length > 300) return 'O encaminhamento não pode ter mais de 300 caracteres.';
  if (f.sistema.trim().length > 60) return 'O sistema não pode ter mais de 60 caracteres.';
  if (f.categoria && !CATEGORIAS.some((c) => c.valor === f.categoria)) return 'A categoria não é válida.';
  return null;
}

/** Minutos entre duas horas HH:MM; passa a meia-noite (uma avaria do Turno 3 pode acabar no dia seguinte). */
export function duracaoMinutos(inicio: string | null, termino: string | null): number | null {
  if (!inicio || !termino || !HORA.test(inicio) || !HORA.test(termino)) return null;
  const m = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
  return (m(termino) - m(inicio) + 1440) % 1440;
}

/** 85 → "1h25", 40 → "40 min". */
export function formatarDuracao(min: number | null): string {
  if (min === null) return '';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r === 0 ? `${h}h` : `${h}h${String(r).padStart(2, '0')}`;
}

/** As linhas da ficha em papel: as ocorrências e, até ao mínimo, linhas em branco. */
export function linhasDaFicha<T>(linhas: T[], minimo = LINHAS_DA_FICHA): (T | null)[] {
  const extra = Math.max(0, minimo - linhas.length);
  return [...linhas, ...Array<null>(extra).fill(null)];
}

export interface Contagem {
  chave: string;
  total: number;
}

export interface ResumoOcorrencias {
  /** Sem hora de término. */
  emCurso: number;
  /** Ocorrências dos últimos `dias` dias com categoria, da mais frequente para a menos. */
  porCategoria: Contagem[];
  /** Sistemas com 2 ou mais ocorrências no período: o que se repete. */
  recorrentes: Contagem[];
}

const normalizar = (s: string) => s.trim().toLowerCase();

/** Resumo para o painel. `hoje` em AAAA-MM-DD (injetado para ser testável). */
export function resumirOcorrencias(lista: Ocorrencia[], hoje: string, dias = 90): ResumoOcorrencias {
  const limite = new Date(`${hoje}T00:00:00Z`);
  limite.setUTCDate(limite.getUTCDate() - dias);
  const desde = limite.toISOString().slice(0, 10);

  const noPeriodo = lista.filter((o) => o.data >= desde && o.data <= hoje);

  const porCategoria = new Map<string, number>();
  const porSistema = new Map<string, { nome: string; total: number }>();
  for (const o of noPeriodo) {
    if (o.categoria) porCategoria.set(o.categoria, (porCategoria.get(o.categoria) ?? 0) + 1);
    if (o.sistema && o.sistema.trim()) {
      const k = normalizar(o.sistema);
      const atual = porSistema.get(k);
      porSistema.set(k, { nome: atual?.nome ?? o.sistema.trim(), total: (atual?.total ?? 0) + 1 });
    }
  }

  const ordenar = (a: Contagem, b: Contagem) => b.total - a.total || a.chave.localeCompare(b.chave);
  return {
    emCurso: lista.filter(emCurso).length,
    porCategoria: [...porCategoria].map(([chave, total]) => ({ chave, total })).sort(ordenar),
    recorrentes: [...porSistema.values()]
      .filter((s) => s.total >= 2)
      .map((s) => ({ chave: s.nome, total: s.total }))
      .sort(ordenar),
  };
}

/** A hora de agora em HH:MM. */
export function horaAtual(d: Date = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Soma `dias` a uma data AAAA-MM-DD (para o "dia anterior/seguinte" da ficha). */
export function somarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}
