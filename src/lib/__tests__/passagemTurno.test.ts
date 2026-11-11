import { describe, expect, it } from 'vitest';
import { confirmacoes, ehNotaExtensa, estaAtiva, estadoDaNota, estaFixada, hojeCaboVerde, ordenarAtivas, paraTurnos, podeEditarNota, porLerPor } from '../passagemTurno';

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

describe('notas fixadas', () => {
  const fixada = (extra: Record<string, unknown> = {}) => nota({ fixada_em: '2026-11-05T10:00:00Z', fixada_ate: null, ...extra });

  it('a data de Cabo Verde é a de UTC-1', () => {
    expect(hojeCaboVerde(new Date('2026-11-07T00:30:00Z'))).toBe('2026-11-06');
    expect(hojeCaboVerde(new Date('2026-11-07T12:00:00Z'))).toBe('2026-11-07');
  });

  it('sem data fica fixada; com data vale até ao fim desse dia e depois volta às regras normais', () => {
    expect(estaFixada(fixada(), agora)).toBe(true);
    expect(estaFixada(fixada({ fixada_ate: '2026-11-07' }), agora)).toBe(true);
    expect(estaFixada(fixada({ fixada_ate: '2026-11-06' }), agora)).toBe(false);
    expect(estaFixada(nota(), agora)).toBe(false);
  });

  it('a fixada não sai das ativas pelo prazo de 24 h; sem fixação sai', () => {
    const prazoPassado = { leituras: [{ user_id: 'b' }, { user_id: 'c' }], arquivar_apos: '2026-11-06T10:00:00Z' };
    expect(estaAtiva(nota(prazoPassado), agora)).toBe(false);
    expect(estaAtiva(fixada(prazoPassado), agora)).toBe(true);
    expect(estadoDaNota(fixada(prazoPassado), agora)).toEqual({ tipo: 'fixada', confirmacoes: 2, ate: null });
    // fixação que expirou: volta a valer o prazo
    expect(estaAtiva(fixada({ ...prazoPassado, fixada_ate: '2026-11-06' }), agora)).toBe(false);
  });

  it('uma nota arquivada nunca conta como fixada', () => {
    expect(estaFixada(fixada({ arquivada_em: '2026-11-07T10:00:00Z' }), agora)).toBe(false);
  });

  it('por ler: ativa, de outra pessoa e ainda não confirmada por mim', () => {
    expect(porLerPor(nota(), 'eu', agora)).toBe(true);
    expect(porLerPor(nota({ autor_user_id: 'eu' }), 'eu', agora)).toBe(false);
    expect(porLerPor(nota({ leituras: [{ user_id: 'eu' }] }), 'eu', agora)).toBe(false);
    expect(porLerPor(nota({ arquivada_em: '2026-11-07T10:00:00Z' }), 'eu', agora)).toBe(false);
    expect(porLerPor(nota(), undefined, agora)).toBe(false);
    // fixada, ainda por ler por mim, mesmo com o prazo passado
    expect(porLerPor(fixada({ arquivar_apos: '2026-11-06T10:00:00Z' }), 'eu', agora)).toBe(true);
  });

  it('as fixadas vêm primeiro, depois as mais recentes', () => {
    const lista = [
      { ...nota(), id: 'a', created_at: '2026-11-07T10:00:00Z' },
      { ...fixada(), id: 'b', created_at: '2026-11-01T10:00:00Z' },
      { ...nota(), id: 'c', created_at: '2026-11-07T11:00:00Z' },
    ];
    expect(ordenarAtivas(lista, agora).map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('editar e expandir', () => {
  it('só o autor edita, e só enquanto a nota não está arquivada', () => {
    expect(podeEditarNota(nota(), 'autor', agora)).toBe(true);
    expect(podeEditarNota(nota(), 'outro', agora)).toBe(false);
    expect(podeEditarNota(nota(), undefined, agora)).toBe(false);
    expect(podeEditarNota(nota({ arquivada_em: '2026-11-07T10:00:00Z' }), 'autor', agora)).toBe(false);
    expect(podeEditarNota(nota({ arquivar_apos: '2026-11-07T11:00:00Z' }), 'autor', agora)).toBe(false);
  });

  it('nota extensa: muitos caracteres ou muitas linhas', () => {
    expect(ehNotaExtensa('curta')).toBe(false);
    expect(ehNotaExtensa('x'.repeat(300))).toBe(false);
    expect(ehNotaExtensa('x'.repeat(301))).toBe(true);
    expect(ehNotaExtensa('1\n2\n3\n4\n5')).toBe(false);
    expect(ehNotaExtensa('1\n2\n3\n4\n5\n6')).toBe(true);
  });
});
