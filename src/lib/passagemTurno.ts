/**
 * Passagem de turno: quem vê cada nota e quando ela sai das "ativas".
 *
 * Uma nota é vista pelos outros dois turnos. Cada pessoa, que não quem a deixou, confirma a leitura (podem ser mais
 * de duas). Com a 2.ª confirmação conta um prazo de 24 h; passado ele, a nota deixa de estar ativa e fica no histórico.
 */
import type { TurnKey } from '@/types/taskboard';

export const CONFIRMACOES_NECESSARIAS = 2;
export const HORAS_ATE_ARQUIVAR = 24;

const ORDEM: TurnKey[] = ['turno1', 'turno2', 'turno3'];

/** Os turnos que vêem a nota: os dois que seguem o de quem a deixou (a seguir ao 3 volta o 1, no dia seguinte). */
export function paraTurnos(turno: TurnKey): TurnKey[] {
  const i = ORDEM.indexOf(turno);
  return [ORDEM[(i + 1) % 3], ORDEM[(i + 2) % 3]];
}

interface EntradaMinima {
  autor_user_id: string | null;
  leituras: ReadonlyArray<{ user_id: string }>;
  arquivada_em: string | null;
  arquivar_apos?: string | null;
  /** Nota fixada: não sai das ativas pelo prazo, nem se arquiva, até `fixada_ate` (inclusive) ou até ser desafixada. */
  fixada_em?: string | null;
  fixada_ate?: string | null;
}

/** Hoje em Cabo Verde (UTC-1) como AAAA-MM-DD — a data limite da fixação é comparada com esta. */
export function hojeCaboVerde(agora: Date = new Date()): string {
  return new Date(agora.getTime() - 3_600_000).toISOString().slice(0, 10);
}

/** Está fixada neste momento? (Sem data limite fica até ser desafixada; com data, vale até ao fim desse dia.) */
export const estaFixada = (e: EntradaMinima, agora: Date = new Date()) =>
  !!e.fixada_em && !e.arquivada_em && (!e.fixada_ate || e.fixada_ate >= hojeCaboVerde(agora));

/** Confirmações que contam: de pessoas diferentes de quem deixou a nota. */
export const confirmacoes = (e: EntradaMinima) => new Set(e.leituras.filter((l) => l.user_id !== e.autor_user_id).map((l) => l.user_id)).size;

export type EstadoNota =
  | { tipo: 'fixada'; confirmacoes: number; ate: string | null }
  | { tipo: 'por-ler' }
  | { tipo: 'a-meio'; confirmacoes: number; faltam: number }
  | { tipo: 'a-sair'; confirmacoes: number; horasRestantes: number }
  | { tipo: 'arquivada-sozinha' }
  | { tipo: 'arquivada' };

/** Em que ponto está a nota (para o selo no cartão). */
export function estadoDaNota(e: EntradaMinima, agora: Date = new Date()): EstadoNota {
  if (e.arquivada_em) return { tipo: 'arquivada' };
  const n = confirmacoes(e);
  if (estaFixada(e, agora)) return { tipo: 'fixada', confirmacoes: n, ate: e.fixada_ate ?? null };
  if (e.arquivar_apos) {
    const resta = new Date(e.arquivar_apos).getTime() - agora.getTime();
    if (resta <= 0) return { tipo: 'arquivada-sozinha' };
    return { tipo: 'a-sair', confirmacoes: n, horasRestantes: Math.ceil(resta / 3_600_000) };
  }
  if (n === 0) return { tipo: 'por-ler' };
  return { tipo: 'a-meio', confirmacoes: n, faltam: Math.max(0, CONFIRMACOES_NECESSARIAS - n) };
}

/** Ainda aparece nas notas ativas? (As arquivadas à mão ou pelo prazo já não; as fixadas ficam.) */
export const estaAtiva = (e: EntradaMinima, agora: Date = new Date()) => {
  const t = estadoDaNota(e, agora).tipo;
  return t !== 'arquivada' && t !== 'arquivada-sozinha';
};

/** Esta pessoa ainda tem de ler a nota? (Ativa, não é dela e ainda não confirmou.) */
export const porLerPor = (e: EntradaMinima, userId: string | undefined, agora: Date = new Date()) =>
  !!userId && estaAtiva(e, agora) && e.autor_user_id !== userId && !e.leituras.some((l) => l.user_id === userId);

/** Fixadas primeiro, depois as mais recentes. */
export function ordenarAtivas<T extends EntradaMinima & { created_at: string }>(lista: T[], agora: Date = new Date()): T[] {
  return [...lista].sort((a, b) => {
    const fa = estaFixada(a, agora) ? 0 : 1;
    const fb = estaFixada(b, agora) ? 0 : 1;
    return fa - fb || b.created_at.localeCompare(a.created_at);
  });
}
