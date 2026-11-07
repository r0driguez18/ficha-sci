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
}

/** Confirmações que contam: de pessoas diferentes de quem deixou a nota. */
export const confirmacoes = (e: EntradaMinima) => new Set(e.leituras.filter((l) => l.user_id !== e.autor_user_id).map((l) => l.user_id)).size;

export type EstadoNota =
  | { tipo: 'por-ler' }
  | { tipo: 'a-meio'; confirmacoes: number; faltam: number }
  | { tipo: 'a-sair'; confirmacoes: number; horasRestantes: number }
  | { tipo: 'arquivada-sozinha' }
  | { tipo: 'arquivada' };

/** Em que ponto está a nota (para o selo no cartão). */
export function estadoDaNota(e: EntradaMinima, agora: Date = new Date()): EstadoNota {
  if (e.arquivada_em) return { tipo: 'arquivada' };
  const n = confirmacoes(e);
  if (e.arquivar_apos) {
    const resta = new Date(e.arquivar_apos).getTime() - agora.getTime();
    if (resta <= 0) return { tipo: 'arquivada-sozinha' };
    return { tipo: 'a-sair', confirmacoes: n, horasRestantes: Math.ceil(resta / 3_600_000) };
  }
  if (n === 0) return { tipo: 'por-ler' };
  return { tipo: 'a-meio', confirmacoes: n, faltam: Math.max(0, CONFIRMACOES_NECESSARIAS - n) };
}

/** Ainda aparece nas notas ativas? (As arquivadas à mão ou pelo prazo já não.) */
export const estaAtiva = (e: EntradaMinima, agora: Date = new Date()) => {
  const t = estadoDaNota(e, agora).tipo;
  return t !== 'arquivada' && t !== 'arquivada-sozinha';
};
