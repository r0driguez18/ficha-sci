import { describe, expect, it } from 'vitest';
import { fatiaDaPagina } from '../paginacao';

describe('fatiaDaPagina', () => {
  it('130 itens a 25 por página: 6 páginas; a 2.ª mostra 26–50', () => {
    expect(fatiaDaPagina(130, 1, 25)).toEqual({ paginas: 6, atual: 1, de: 26, ate: 50, inicio: 25, fim: 50 });
  });
  it('a última página é a que sobra', () => {
    expect(fatiaDaPagina(130, 5, 25)).toMatchObject({ de: 126, ate: 130, inicio: 125, fim: 130 });
  });
  it('lista vazia: uma página, sem itens', () => {
    expect(fatiaDaPagina(0, 0, 25)).toMatchObject({ paginas: 1, atual: 0, de: 0, ate: 0, inicio: 0, fim: 0 });
  });
  it('nunca fica numa página que não existe (a lista encolheu)', () => {
    expect(fatiaDaPagina(30, 9, 25)).toMatchObject({ atual: 1, de: 26, ate: 30 });
    expect(fatiaDaPagina(10, 3, 25)).toMatchObject({ atual: 0, de: 1, ate: 10 });
  });
  it('valores estranhos não rebentam', () => {
    expect(fatiaDaPagina(10, -2, 25).atual).toBe(0);
    expect(fatiaDaPagina(10, NaN, 25).atual).toBe(0);
    expect(fatiaDaPagina(10, 0, 0).paginas).toBe(10);
  });
  it('exatamente o tamanho da página: uma página só', () => {
    expect(fatiaDaPagina(25, 0, 25)).toMatchObject({ paginas: 1, de: 1, ate: 25 });
    expect(fatiaDaPagina(26, 0, 25).paginas).toBe(2);
  });
});
