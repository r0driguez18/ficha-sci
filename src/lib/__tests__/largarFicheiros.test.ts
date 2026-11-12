import { describe, expect, it } from 'vitest';
import { extensaoDe, filtrarFicheiros, ficheirosDe, mensagemTipoErrado } from '../largarFicheiros';

const f = (nome: string) => new File(['x'], nome);

describe('largarFicheiros', () => {
  it('extensaoDe: minúsculas, com ponto; sem extensão devolve vazio', () => {
    expect(extensaoDe('Folha.XLSX')).toBe('.xlsx');
    expect(extensaoDe('a.b.csv')).toBe('.csv');
    expect(extensaoDe('semextensao')).toBe('');
  });

  it('filtra pelas extensões aceites', () => {
    const r = filtrarFicheiros([f('a.xlsx'), f('b.pdf'), f('c.XLS')], ['.xlsx', '.xls'], true);
    expect(r.aceites.map((x) => x.name)).toEqual(['a.xlsx', 'c.XLS']);
    expect(r.recusados.map((x) => x.name)).toEqual(['b.pdf']);
  });

  it('sem «varios» fica só com o primeiro aceite', () => {
    const r = filtrarFicheiros([f('a.xlsx'), f('b.xlsx')], ['.xlsx'], false);
    expect(r.aceites.map((x) => x.name)).toEqual(['a.xlsx']);
  });

  it('nada aceite: lista vazia e recusados preenchidos', () => {
    const r = filtrarFicheiros([f('a.docx')], ['.xlsx'], false);
    expect(r.aceites).toEqual([]);
    expect(mensagemTipoErrado(r.recusados, ['.xlsx'])).toContain('a.docx');
  });

  it('ficheirosDe: aceita null e lê dt.files', () => {
    expect(ficheirosDe(null)).toEqual([]);
    const dt = { files: [f('a.xlsx')], items: [] } as unknown as DataTransfer;
    expect(ficheirosDe(dt).map((x) => x.name)).toEqual(['a.xlsx']);
  });

  it('ficheirosDe: cai para dt.items quando files vem vazio', () => {
    const item = { kind: 'file', getAsFile: () => f('b.xlsx') };
    const dt = { files: [], items: [item, { kind: 'string', getAsFile: () => null }] } as unknown as DataTransfer;
    expect(ficheirosDe(dt).map((x) => x.name)).toEqual(['b.xlsx']);
  });
});
