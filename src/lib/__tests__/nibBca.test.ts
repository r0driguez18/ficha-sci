import { describe, expect, it } from 'vitest';
import { tratarNib } from '../nibBca';
import { autodetectar, linhasDaMatriz } from '../colagemPs2';

describe('PS2: só é OIC um NIB completo (21 dígitos) que não começa por 0003', () => {
  it('21 dígitos a começar por 0001, 0002, 0004…0009: de outro banco', () => {
    for (const b of ['0001', '0002', '0004', '0005', '0006', '0007', '0008', '0009']) {
      const t = tratarNib(`${b}00001234567810176`);
      expect(t.estado, b).toBe('nao-bca');
      expect(t.motivo).toMatch(/OIC/);
    }
  });

  it('a conta da EDEC: 9 dígitos a acabar em 1 + natureza (14 dígitos) é BCA, não OIC; tira-se o 1 a mais', () => {
    // 93412345 (conta) + 1 (a mais) + 10001 (natureza)
    const t = tratarNib('934123451.10 001');
    expect(t.estado).toBe('ok');
    expect(t.conta).toBe('93412345');
    expect(t.nib).toBe('000300009341234510176');
  });

  it('a mesma conta escrita como NIB de 22 dígitos (um dígito a mais) dá o mesmo NIB', () => {
    const t = tratarNib('BCA0003 0000 934123451 101 76');
    expect(t.estado).toBe('ok');
    expect(t.nib).toBe('000300009341234510176');
  });

  it('conta + natureza normais (13 dígitos) continuam a dar certo', () => {
    const t = tratarNib('85612349.10.001');
    expect(t.estado).toBe('ok');
    expect(t.nib).toBe('000300008561234910176');
  });

  it('sequências longas que não começam por 0003 já não são "outro banco": ou se tratam ou ficam em alerta', () => {
    for (const s of ['934123451.10 001', '12345678910001', '1234567810001']) {
      expect(tratarNib(s).estado, s).not.toBe('nao-bca');
    }
  });

  it('NIB do BCA a que falta um 0 (003… com 20 dígitos): alerta a dizer isso, nunca OIC', () => {
    const t = tratarNib('00300001234567810176'); // 20 dígitos
    expect(t.estado).toBe('alerta');
    expect(t.motivo).toMatch(/falta um 0/);
    expect(t.nib).toBe('');
  });

  it('começa como outro banco mas não tem 21 dígitos: alerta (não se decide sozinho)', () => {
    const t = tratarNib('0005000012345678101'); // 19 dígitos
    expect(t.estado).toBe('alerta');
    expect(t.motivo).toMatch(/outro banco\?/);
  });

  it('contas curtas e NIBs do BCA continuam como antes', () => {
    expect(tratarNib('1234567', undefined, 'so-conta').nib).toBe('000300000123456710176');
    expect(tratarNib('000300001234567810176').nib).toBe('000300001234567810176');
    expect(tratarNib('931558911').nib).toBe('000300009315589110176'); // 93155891 + natureza 1
  });
});

describe('PS2: linhas e número da linha no Excel', () => {
  // Como o ficheiro dos pagamentos: linhas em branco e um título antes do cabeçalho (que está na linha 6).
  const folha = [
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', 'HOTEL TESTE - AGENDA DE PAGAMENTOS', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', 'NOME:', 'DATA:', 'DESCRIÇÃO:', 'TOTAL A PAGAR:', 'CONTA:', 'NIB:'],
    ['1', 'Ana Teste', '2026-10-31', 'VENCIMENTO', '1000', '85612349.10.001', 'BCA0003 0000 85612349 101 76'],
    ['8', 'EDEC Teste', '2026-10-30', 'FATURA', '1600', '934123451.10 001', 'BCA0003 0000 934123451 101 76'],
    ['9', 'Banco Outro', '2026-10-30', 'FATURA', '500', '000500001234567810176', ''],
  ];

  it('acha o cabeçalho mesmo depois de linhas em branco; a coluna da conta é a primeira com "conta"', () => {
    const d = autodetectar(folha);
    expect(d).toMatchObject({ colNome: 1, colValor: 4, colDescritivo: 3, colConta: 5, linhaInicial: 7 });
  });

  it('cada linha leva o seu nº na folha (a mesma do Excel)', () => {
    const d = autodetectar(folha);
    const { linhas } = linhasDaMatriz(folha, d);
    expect(linhas.filter((l) => l.recebido).map((l) => [l.nome, l.linha])).toEqual([
      ['Ana Teste', 7],
      ['EDEC Teste', 8],
      ['Banco Outro', 9],
    ]);
  });

  it('as linhas de "Outros Bancos" ignoradas dizem em que linha estão', () => {
    const m = [
      ['', 'Nome', 'Valor', 'Conta'],
      ['', 'BCA', '', ''],
      ['', 'Ana', '100', '000300001234567810176'],
      ['', 'Outros Bancos', '', ''],
      ['', 'Rui', '200', '000500001234567810176'],
    ];
    const t = linhasDaMatriz(m, { colConta: 3, colValor: 2, colNome: 1, colDescritivo: -1, linhaInicial: 2 });
    expect(t.ignoradasOutros.map((l) => [l.nome, l.linha])).toEqual([['Rui', 5]]);
    expect(t.nOutrosBlocos).toBe(1);
  });
});
