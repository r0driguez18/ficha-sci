import { describe, expect, it } from 'vitest';
import { fichaSemAssinaturaTapes, tapesAssinadas } from '../tapesAssinatura';

describe('tapesAssinadas', () => {
  it('exige um nome', () => {
    expect(tapesAssinadas('Nelson Alves')).toBe(true);
    expect(tapesAssinadas('  nalves ')).toBe(true);
    expect(tapesAssinadas('')).toBe(false);
    expect(tapesAssinadas('   ')).toBe(false);
    expect(tapesAssinadas('-')).toBe(false);
    expect(tapesAssinadas('.')).toBe(false);
    expect(tapesAssinadas(undefined)).toBe(false);
    expect(tapesAssinadas(null)).toBe(false);
  });
});

describe('fichaSemAssinaturaTapes', () => {
  it('só conta nas fichas com folha de tapes', () => {
    expect(fichaSemAssinaturaTapes('nao_aplicavel', {})).toBe(false);
    expect(fichaSemAssinaturaTapes(undefined, {})).toBe(false);
    expect(fichaSemAssinaturaTapes('pendente', {})).toBe(true);
    expect(fichaSemAssinaturaTapes('anexada', { verificacaoTapes: { verificadoPor: '' } })).toBe(true);
    expect(fichaSemAssinaturaTapes('anexada', { verificacaoTapes: { verificadoPor: 'Elvis' } })).toBe(false);
    expect(fichaSemAssinaturaTapes('pendente', null)).toBe(true);
  });
});
