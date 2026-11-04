import { describe, expect, it } from 'vitest';
import { dataSuspeitaExportada, validarDataFicha } from '../validarDataFicha';

// 2026-10-20 é terça-feira; 2026-10-18 é domingo.
describe('validarDataFicha', () => {
  it('data normal: sem problemas', () => {
    expect(validarDataFicha('dia-util', '2026-10-20', '2026-10-20')).toEqual([]);
    expect(validarDataFicha('dia-nao-util', '2026-10-18', '2026-10-19')).toEqual([]);
  });

  it('data futura bloqueia', () => {
    const p = validarDataFicha('dia-util', '2026-10-21', '2026-10-20');
    expect(p.some((x) => x.gravidade === 'erro')).toBe(true);
  });

  it('data inválida bloqueia', () => {
    expect(validarDataFicha('dia-util', '2026-02-31', '2026-10-20')[0].gravidade).toBe('erro');
    expect(validarDataFicha('dia-util', '', '2026-10-20')[0].gravidade).toBe('erro');
  });

  it('tipo que não bate com o dia: aviso', () => {
    const a = validarDataFicha('dia-nao-util', '2026-10-20', '2026-10-20');
    expect(a).toHaveLength(1);
    expect(a[0].gravidade).toBe('aviso');
    expect(a[0].mensagem).toMatch(/terça-feira/);
    const b = validarDataFicha('dia-util', '2026-10-18', '2026-10-18');
    expect(b[0].mensagem).toMatch(/domingo/);
  });

  it('feriado conta como dia não útil (5 de julho)', () => {
    expect(validarDataFicha('dia-nao-util', '2026-07-05', '2026-07-05')).toEqual([]);
    expect(validarDataFicha('dia-util', '2026-01-01', '2026-01-01')[0].gravidade).toBe('aviso');
  });

  it('muito atrasada: aviso; até 3 dias não', () => {
    expect(validarDataFicha('dia-util', '2026-10-16', '2026-10-19')).toEqual([]);
    const p = validarDataFicha('dia-util', '2026-10-13', '2026-10-20');
    expect(p.some((x) => /há 7 dias/.test(x.mensagem))).toBe(true);
  });
});

describe('dataSuspeitaExportada', () => {
  it('tipo errado para o dia', () => {
    expect(dataSuspeitaExportada('dia-nao-util', '2026-10-19', '2026-10-19T10:00:00')).toMatch(/dia não útil num dia útil/);
  });
  it('exportada muito depois ou antes', () => {
    expect(dataSuspeitaExportada('dia-util', '2026-10-13', '2026-10-22T21:58:00')).toMatch(/9 dias depois/);
    expect(dataSuspeitaExportada('dia-util', '2026-10-22', '2026-10-20T08:00:00')).toMatch(/antes/);
  });
  it('normal', () => {
    expect(dataSuspeitaExportada('dia-util', '2026-10-20', '2026-10-21T02:00:00')).toBeNull();
  });
});
