import { describe, expect, it } from 'vitest';
import {
  autodetectarColunas,
  construirPrn,
  extrairLinhas,
  nomeBaseRenovacao,
  nomeFicheiroExcelLote,
  normalizarBalcao,
  normalizarNumeroCartao,
} from '../renovacaoCartoes';

describe('renovação de cartões', () => {
  it('normaliza o nº do cartão a 7 dígitos e o balcão', () => {
    expect(normalizarNumeroCartao('752923')).toBe('0752923');
    expect(normalizarNumeroCartao(' 12 ')).toBe('0000012');
    expect(normalizarNumeroCartao('')).toBe('');
    expect(normalizarNumeroCartao(null)).toBe('');
    expect(normalizarBalcao(' 14.0')).toBe('14');
  });

  it('deteta as colunas pelo cabeçalho', () => {
    const c = autodetectarColunas([['Relatório', ''], ['Balcão', 'Nº Cartão', 'Nome do Titular'], ['14', '752923', 'Ana']]);
    expect(c).toMatchObject({ colBalcao: 0, colCartao: 1, colNome: 2 });
  });

  it('nunca descarta uma linha em silêncio: separa válidas e inválidas com o motivo', () => {
    const rows = [
      ['Balcão', 'Cartão', 'Nome'],
      ['14', '752923', 'Ana'],
      ['', '123', 'Sem balcão'],
      ['15', '', 'Sem cartão'],
      ['16', '12345678', 'Cartão a mais'],
      ['', '', ''],
      ['17', '12ab', 'Inválido'],
    ];
    const { validas, invalidas } = extrairLinhas(rows, 0, 1, 2, 2, rows[0]);
    expect(validas).toHaveLength(1);
    expect(validas[0]).toMatchObject({ balcao: '14', numeroCartao: '0752923', nomeTitular: 'Ana' });
    expect(invalidas.map((i) => [i.linha, i.motivo])).toEqual([
      [3, 'sem balcão'],
      [4, 'sem nº de cartão'],
      [5, 'nº de cartão com mais de 7 dígitos'],
      [7, 'nº de cartão inválido'],
    ]);
  });

  it('o .prn tem um cartão por linha (CRLF) e os nomes seguem o lote', () => {
    expect(construirPrn(['0000001', '0000002'])).toBe('0000001\r\n0000002\r\n');
    expect(nomeBaseRenovacao(new Date(2026, 9, 5))).toBe('Renovações Outubro');
    expect(nomeFicheiroExcelLote('Renovações Outubro', 2)).toBe('Renovações Outubro 2.xlsx');
  });
});
