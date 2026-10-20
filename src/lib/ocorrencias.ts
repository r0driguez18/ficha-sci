/**
 * Ocorrências estruturadas: categorias, gravidades e o resumo que o painel mostra.
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

export const GRAVIDADES = [
  { valor: 'baixa', nome: 'Baixa' },
  { valor: 'media', nome: 'Média' },
  { valor: 'alta', nome: 'Alta' },
] as const;

export const TURNOS = [
  { valor: 'turno1', nome: 'Turno 1' },
  { valor: 'turno2', nome: 'Turno 2' },
  { valor: 'turno3', nome: 'Turno 3' },
] as const;

export type Categoria = (typeof CATEGORIAS)[number]['valor'];
export type Gravidade = (typeof GRAVIDADES)[number]['valor'];
export type Estado = 'aberta' | 'resolvida';

export interface Ocorrencia {
  id: string;
  data: string;
  hora: string | null;
  turno: string | null;
  categoria: Categoria;
  gravidade: Gravidade;
  sistema: string | null;
  titulo: string;
  descricao: string | null;
  estado: Estado;
  resolucao: string | null;
  criada_por_codigo: string | null;
  criada_em: string;
  resolvida_por_codigo: string | null;
  resolvida_em: string | null;
}

export const nomeCategoria = (v: string) => CATEGORIAS.find((c) => c.valor === v)?.nome ?? v;
export const nomeGravidade = (v: string) => GRAVIDADES.find((g) => g.valor === v)?.nome ?? v;
export const nomeTurno = (v: string | null) => TURNOS.find((t) => t.valor === v)?.nome ?? '';

export interface FormOcorrencia {
  data: string;
  hora: string;
  turno: string;
  categoria: string;
  gravidade: string;
  sistema: string;
  titulo: string;
  descricao: string;
}

/** Devolve a mensagem de erro, ou null se o formulário serve. */
export function validarOcorrencia(f: FormOcorrencia): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.data)) return 'Indica a data.';
  if (f.hora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(f.hora)) return 'A hora não é válida (HH:MM).';
  if (!CATEGORIAS.some((c) => c.valor === f.categoria)) return 'Escolhe a categoria.';
  if (!GRAVIDADES.some((g) => g.valor === f.gravidade)) return 'Escolhe a gravidade.';
  const titulo = f.titulo.trim();
  if (titulo.length < 3) return 'O título deve ter pelo menos 3 caracteres.';
  if (titulo.length > 120) return 'O título não pode ter mais de 120 caracteres.';
  if (f.sistema.trim().length > 60) return 'O sistema não pode ter mais de 60 caracteres.';
  if (f.descricao.length > 2000) return 'A descrição não pode ter mais de 2000 caracteres.';
  return null;
}

export interface Contagem {
  chave: string;
  total: number;
}

export interface ResumoOcorrencias {
  abertas: number;
  abertasAltas: number;
  /** Ocorrências dos últimos `dias` dias, por categoria (da mais frequente para a menos). */
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

  const abertas = lista.filter((o) => o.estado === 'aberta');
  const noPeriodo = lista.filter((o) => o.data >= desde && o.data <= hoje);

  const porCategoria = new Map<string, number>();
  const porSistema = new Map<string, { nome: string; total: number }>();
  for (const o of noPeriodo) {
    porCategoria.set(o.categoria, (porCategoria.get(o.categoria) ?? 0) + 1);
    if (o.sistema && o.sistema.trim()) {
      const k = normalizar(o.sistema);
      const atual = porSistema.get(k);
      porSistema.set(k, { nome: atual?.nome ?? o.sistema.trim(), total: (atual?.total ?? 0) + 1 });
    }
  }

  const ordenar = (a: Contagem, b: Contagem) => b.total - a.total || a.chave.localeCompare(b.chave);
  return {
    abertas: abertas.length,
    abertasAltas: abertas.filter((o) => o.gravidade === 'alta').length,
    porCategoria: [...porCategoria].map(([chave, total]) => ({ chave, total })).sort(ordenar),
    recorrentes: [...porSistema.values()]
      .filter((s) => s.total >= 2)
      .map((s) => ({ chave: s.nome, total: s.total }))
      .sort(ordenar),
  };
}
