import { describe, expect, it } from 'vitest';
import { primeiraDataLivre, somarDias } from '../datas';

describe('somarDias', () => {
  it('passa o fim do mês, do ano e o 29 de fevereiro', () => {
    expect(somarDias('2026-10-31', 1)).toBe('2026-11-01');
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(somarDias('2028-02-28', 1)).toBe('2028-02-29');
    expect(somarDias('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('primeiraDataLivre (sair do "já foi exportada")', () => {
  it('se a data está livre, é ela', () => {
    expect(primeiraDataLivre('2026-10-22', new Set())).toBe('2026-10-22');
    expect(primeiraDataLivre('2026-10-22', new Set(['2026-10-21', '2026-10-23']))).toBe('2026-10-22');
  });

  it('salta as datas seguidas já exportadas (o caso do bloqueio: 22 e 23 exportadas)', () => {
    expect(primeiraDataLivre('2026-10-22', new Set(['2026-10-22', '2026-10-23']))).toBe('2026-10-24');
  });

  it('só salta datas seguidas: um buraco depois ainda conta como livre', () => {
    expect(primeiraDataLivre('2026-10-22', new Set(['2026-10-22', '2026-10-24']))).toBe('2026-10-23');
  });

  it('atravessa o fim do mês', () => {
    expect(primeiraDataLivre('2026-10-30', new Set(['2026-10-30', '2026-10-31']))).toBe('2026-11-01');
  });

  it('não fica preso se tudo estiver ocupado: pára no limite', () => {
    const tudo = new Set(Array.from({ length: 10 }, (_, i) => somarDias('2026-01-01', i)));
    expect(primeiraDataLivre('2026-01-01', tudo, 5)).toBe('2026-01-06');
  });
});
