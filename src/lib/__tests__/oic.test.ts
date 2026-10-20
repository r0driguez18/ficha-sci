import { describe, expect, it } from 'vitest';
import {
  TAMANHO_LINHA,
  formatarLinhaOIC,
  gerarOIC,
  nomeFicheiroOIC,
  parseMontante,
  tratarLinhaOIC,
  type LinhaOICComRef,
} from '../oic';

const NIB_OUTRO_BANCO = '000500001234567810176';
const NIB_BCA = '000300001234567810176';

const tratar = (nib: unknown, montante: unknown, nome = 'Maria Silva', descritivo = 'Ordenado Outubro') =>
  tratarLinhaOIC({ nib, montante, nome, descritivo });

describe('parseMontante', () => {
  it('aceita os formatos que aparecem nas folhas', () => {
    expect(parseMontante('1234.5')).toBe(1234.5);
    expect(parseMontante('1.234,56')).toBe(1234.56);
    expect(parseMontante('1,234.56')).toBe(1234.56);
    expect(parseMontante('1 234,56')).toBe(1234.56);
    expect(parseMontante('CVE 1.000,00')).toBe(1000);
    expect(parseMontante('6,860')).toBe(6860);
    expect(parseMontante('1,5')).toBe(1.5);
    expect(parseMontante(250)).toBe(250);
  });

  it('distingue vazio de inválido', () => {
    expect(parseMontante('')).toBeNull();
    expect(parseMontante(null)).toBeNull();
    expect(parseMontante('abc')).toBeNaN();
    expect(parseMontante('--')).toBeNaN();
  });
});

describe('tratarLinhaOIC', () => {
  it('linha válida: valor arredondado a escudos, em cêntimos', () => {
    const l = tratar(NIB_OUTRO_BANCO, '1500,40');
    expect(l.erro).toBeNull();
    expect(l.cents).toBe(150000);
    expect(l.arredondado).toBe(true);
  });

  it('NIB do BCA fica fora do ficheiro sem ser erro (vai pelo PS2)', () => {
    const l = tratar(NIB_BCA, 1000);
    expect(l.foraDoFicheiro).toBe(true);
    expect(l.erro).toBeNull();
  });

  it('cada validação dá o seu erro', () => {
    expect(tratar('', 100).erro).toMatch(/NIB obrigatório/);
    expect(tratar('12345', 100).erro).toMatch(/21 dígitos/);
    expect(tratar(NIB_OUTRO_BANCO, 100, '').erro).toMatch(/Nome obrigatório/);
    expect(tratar(NIB_OUTRO_BANCO, 100, 'Ana', '').erro).toMatch(/Descritivo obrigatório/);
    expect(tratar(NIB_OUTRO_BANCO, 100, 'Ana', 'x'.repeat(41)).erro).toMatch(/exceder 40/);
    expect(tratar(NIB_OUTRO_BANCO, null).erro).toMatch(/Montante obrigatório/);
    expect(tratar(NIB_OUTRO_BANCO, 'abc').erro).toMatch(/numérico/);
    expect(tratar(NIB_OUTRO_BANCO, 0).erro).toMatch(/maior que 0/);
    expect(tratar(NIB_OUTRO_BANCO, -5).erro).toMatch(/maior que 0/);
    expect(tratar(NIB_OUTRO_BANCO, 0.4).erro).toMatch(/dá 0/);
    expect(tratar(NIB_OUTRO_BANCO, 100_000_000).erro).toMatch(/demasiado grande/);
  });

  it('linhas de totais e linhas vazias são ignoradas', () => {
    expect(tratar('', null, '', '').vazia).toBe(true);
    expect(tratar('', 12345, 'Total Vencimento').vazia).toBe(true);
  });

  it('tira os acentos do nome', () => {
    expect(tratar(NIB_OUTRO_BANCO, 100, 'João Conceição').nome).toBe('Joao Conceicao');
  });
});

describe('ficheiro OIC', () => {
  const linha = (extra: Partial<LinhaOICComRef> = {}, ref = 1): LinhaOICComRef => ({
    ...tratar(NIB_OUTRO_BANCO, 1000, 'Ana Lima', 'Ordenado'),
    ref,
    ...extra,
  });

  it('cada linha tem exatamente 135 caracteres', () => {
    const l = formatarLinhaOIC(linha());
    expect(l).toHaveLength(TAMANHO_LINHA);
    expect(l).toContain(NIB_OUTRO_BANCO);
    expect(l).toContain('CVE');
  });

  it('junta as linhas válidas e soma os cêntimos', () => {
    const r = gerarOIC([linha({}, 1), linha({}, 2), linha({ vazia: true }, 3), linha({ foraDoFicheiro: true }, 4)]);
    expect(r.erros).toEqual([]);
    expect(r.totalRegistos).toBe(2);
    expect(r.totalCentimos).toBe(200000);
    expect(r.conteudo.split('\r\n')).toHaveLength(2);
  });

  it('se uma linha tiver erro não gera nada e diz qual', () => {
    const r = gerarOIC([linha({}, 1), linha({ erro: 'Nome obrigatório.' }, 2)]);
    expect(r.conteudo).toBe('');
    expect(r.erros).toEqual(['Erro na linha 2: Nome obrigatório.']);
  });

  it('sem linhas não gera ficheiro', () => {
    expect(gerarOIC([]).erros).toEqual(['Não há linhas para gerar.']);
  });

  it('nome do ficheiro com a data', () => {
    expect(nomeFicheiroOIC(new Date(2026, 9, 16))).toBe('Interbancario_20261016.txt');
  });
});
