import { describe, expect, it } from 'vitest';
import { confirmacoes, estaAtiva, estadoDaNota, paraTurnos } from '../passagemTurno';

const agora = new Date('2026-11-07T12:00:00Z');
const nota = (extra: Record<string, unknown> = {}) => ({
  autor_user_id: 'autor',
  leituras: [] as { user_id: string }[],
  arquivada_em: null as string | null,
  arquivar_apos: null as string | null,
  ...extra,
});

describe('quem vê a nota', () => {
  it('os dois turnos seguintes', () => {
    expect(paraTurnos('turno1')).toEqual(['turno2', 'turno3']);
    expect(paraTurnos('turno2')).toEqual(['turno3', 'turno1']);
    expect(paraTurnos('turno3')).toEqual(['turno1', 'turno2']);
  });
});

describe('confirmações', () => {
  it('só contam pessoas diferentes de quem deixou a nota, e cada pessoa uma vez', () => {
    expect(confirmacoes(nota({ leituras: [{ user_id: 'autor' }, { user_id: 'b' }, { user_id: 'b' }, { user_id: 'c' }] }))).toBe(2);
  });
});

describe('estado da nota', () => {
  it('por ler → a meio → a sair (24 h depois da 2.ª) → arquivada sozinha', () => {
    expect(estadoDaNota(nota(), agora)).toEqual({ tipo: 'por-ler' });
    expect(estadoDaNota(nota({ leituras: [{ user_id: 'b' }] }), agora)).toEqual({ tipo: 'a-meio', confirmacoes: 1, faltam: 1 });
    const dois = nota({ leituras: [{ user_id: 'b' }, { user_id: 'c' }], arquivar_apos: '2026-11-08T05:30:00Z' });
    expect(estadoDaNota(dois, agora)).toEqual({ tipo: 'a-sair', confirmacoes: 2, horasRestantes: 18 });
    expect(estadoDaNota({ ...dois, arquivar_apos: '2026-11-07T11:59:00Z' }, agora)).toEqual({ tipo: 'arquivada-sozinha' });
  });

  it('a nota arquivada à mão é arquivada', () => {
    expect(estadoDaNota(nota({ arquivada_em: '2026-11-07T10:00:00Z' }), agora)).toEqual({ tipo: 'arquivada' });
  });

  it('só as que não foram arquivadas (à mão ou pelo prazo) ficam ativas', () => {
    expect(estaAtiva(nota(), agora)).toBe(true);
    expect(estaAtiva(nota({ arquivar_apos: '2026-11-08T05:30:00Z' }), agora)).toBe(true);
    expect(estaAtiva(nota({ arquivar_apos: '2026-11-07T11:00:00Z' }), agora)).toBe(false);
    expect(estaAtiva(nota({ arquivada_em: '2026-11-07T10:00:00Z' }), agora)).toBe(false);
  });
});
