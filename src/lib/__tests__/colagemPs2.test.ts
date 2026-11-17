import { describe, expect, it } from 'vitest';
import { autodetectar, parseColagem } from '../colagemPs2';

describe('colagem PS2: primeira linha', () => {
  it('conta curta (7 dígitos) na primeira linha não é saltada', () => {
    const rows = [
      ['', '', '1234567', '', '', '', '15000', ''],
      ['', '', '12345678901', '', '', '', '20000', ''],
      ['', '', '12345678902', '', '', '', '30000', ''],
      ['', '', '', '', '', '', '65000', 'Total'],
    ];
    const d = autodetectar(rows);
    expect(d.linhaInicial).toBe(1);
    expect(d.colConta).toBe(2);
    expect(d.colValor).toBe(6);
  });

  it('com cabeçalho, a primeira linha de dados também conta', () => {
    const rows = [
      ['Nome', 'Conta', 'Valor'],
      ['Ana Lima', '1234567', '1000'],
      ['Rui Sá', '12345678901', '2000'],
    ];
    expect(autodetectar(rows).linhaInicial).toBe(2);
  });

  it('prioridade da coluna da conta: NIB > conta com natureza > conta simples', () => {
    const dados = (cab: string[], conta: string[]) => [cab, ['Ana Lima', ...conta, '1000'], ['Rui Sá', ...conta, '2000']];
    const nib = '000300001234567810176';
    // as três: o NIB ganha, mesmo estando à direita
    expect(autodetectar(dados(['Nome', 'Conta', 'Conta com natureza', 'NIB', 'Valor'], ['1234567', '123456710176', nib])).colConta).toBe(3);
    // sem NIB: conta com natureza ganha à conta simples
    expect(autodetectar(dados(['Nome', 'Conta', 'Conta com natureza', 'Valor'], ['1234567', '123456710176'])).colConta).toBe(2);
    // só a conta simples
    expect(autodetectar(dados(['Nome', 'Conta', 'Valor'], ['1234567'])).colConta).toBe(1);
    // coluna NIB vazia: passa à seguinte
    expect(autodetectar(dados(['Nome', 'Conta', 'NIB', 'Valor'], ['12345678901', ''])).colConta).toBe(1);
  });

  it('parseColagem devolve todas as linhas', () => {
    const txt = ['1234567\t1000\tAna Lima', '12345678901\t2000\tRui Sa'].join('\n');
    const l = parseColagem(txt);
    expect(l).toHaveLength(2);
    expect(l[0]).toMatchObject({ recebido: '1234567', valor: '1000', nome: 'Ana Lima' });
  });
});
