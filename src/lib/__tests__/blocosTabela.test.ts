import { describe, expect, it } from 'vitest';
import { blocosDaTabela } from '../blocosTabela';

const rows = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe('blocosDaTabela', () => {
  it('até 20 linhas há um só bloco, o atual', () => {
    const b = blocosDaTabela(rows(20));
    expect(b).toHaveLength(1);
    expect(b[0]).toMatchObject({ de: 1, ate: 20, atual: true });
  });
  it('a 21.ª linha abre um segundo bloco e o primeiro deixa de ser o atual', () => {
    const b = blocosDaTabela(rows(21));
    expect(b.map((x) => [x.de, x.ate, x.atual])).toEqual([[1, 20, false], [21, 21, true]]);
  });
  it('50 linhas: 20 + 20 + 10', () => {
    const b = blocosDaTabela(rows(50));
    expect(b.map((x) => x.linhas.length)).toEqual([20, 20, 10]);
    expect(b.filter((x) => x.atual)).toHaveLength(1);
  });
  it('sem linhas há um bloco vazio', () => {
    expect(blocosDaTabela([])).toHaveLength(1);
  });
});
