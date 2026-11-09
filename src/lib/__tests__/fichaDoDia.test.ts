import { describe, expect, it } from 'vitest';
import { fichaDoDia } from '../fichaDoDia';
import { diffFicha } from '../retificacaoFicha';

describe('fichaDoDia', () => {
  it('dia útil numa segunda-feira normal', () => {
    expect(fichaDoDia(new Date(2026, 10, 9)).formType).toBe('dia-util');
  });
  it('fim de semana é dia não útil', () => {
    expect(fichaDoDia(new Date(2026, 10, 8)).formType).toBe('dia-nao-util'); // domingo
    expect(fichaDoDia(new Date(2026, 10, 7)).formType).toBe('dia-nao-util'); // sábado
  });
  it('feriado em dia de semana é dia não útil (1 de maio, sexta-feira)', () => {
    expect(fichaDoDia(new Date(2026, 4, 1)).formType).toBe('dia-nao-util');
  });
});

describe('diffFicha com o tipo da ficha', () => {
  const base = { date: '2026-11-08', turn_data: {}, tasks: {}, table_rows: [] };
  it('mostra a mudança de tipo', () => {
    const d = diffFicha({ ...base, form_type: 'dia-util' }, { ...base, form_type: 'dia-nao-util' });
    expect(d).toEqual([{ campo: 'Tipo da ficha', de: 'Dia Útil', para: 'Dia Não Útil' }]);
  });
  it('sem tipo nos dois lados não acrescenta nada', () => {
    expect(diffFicha(base, base)).toEqual([]);
  });
});
