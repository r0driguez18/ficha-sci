import { describe, expect, it } from 'vitest';
import { parseTabular } from '../colagemTabular';
import { autodetectar, linhasDaMatriz, parseColagem } from '../colagemPs2';
import { autodetectarColunasOIC, secaoDaLinha, tratarFolhaOIC, tratarLinhaOIC } from '../oic';

describe('parseTabular', () => {
  it('Excel normal: tabs, células vazias mantêm a coluna', () => {
    expect(parseTabular('Ana\t1000\t\tNIB1\nRui\t2000\tFerias\tNIB2')).toEqual([
      ['Ana', '1000', '', 'NIB1'],
      ['Rui', '2000', 'Ferias', 'NIB2'],
    ]);
  });

  it('uma célula com tab ou quebra de linha vem entre aspas e não desloca as colunas', () => {
    const txt = '"Ana\tLima"\t1000\tNIB1\n"Rui\nSá"\t2000\tNIB2\nEva "B"\t300\tNIB3';
    expect(parseTabular(txt)).toEqual([
      ['Ana\tLima', '1000', 'NIB1'],
      ['Rui Sá', '2000', 'NIB2'],
      ['Eva "B"', '300', 'NIB3'],
    ]);
  });

  it('aspas duplas dentro de aspas', () => {
    expect(parseTabular('"Ana ""Nini"" Lima"\t10')).toEqual([['Ana "Nini" Lima', '10']]);
  });

  it('espaços e espaços sem quebra à volta das células saem', () => {
    const nbsp = String.fromCharCode(0xa0);
    expect(parseTabular(`  Ana ${nbsp}\t ${nbsp}1000 \t NIB `)).toEqual([['Ana', '1000', 'NIB']]);
  });

  it('linhas em branco: saem, ou mantêm-se (para a numeração das linhas bater com a do Excel)', () => {
    const txt = 'A\t1\n\nB\t2\n';
    expect(parseTabular(txt)).toHaveLength(2);
    expect(parseTabular(txt, { manterVazias: true })).toEqual([['A', '1'], [''], ['B', '2']]);
  });

  it('CRLF e CR do Windows', () => {
    expect(parseTabular('A\t1\r\nB\t2\rC\t3')).toHaveLength(3);
  });

  it('sem tabs: ponto e vírgula, barra vertical, dois ou mais espaços', () => {
    expect(parseTabular('Ana;1000;NIB1\nRui;2000;NIB2')).toEqual([['Ana', '1000', 'NIB1'], ['Rui', '2000', 'NIB2']]);
    expect(parseTabular('Ana|1000|NIB1\nRui|2000|NIB2')[1]).toEqual(['Rui', '2000', 'NIB2']);
    expect(parseTabular('Ana Lima   1000   NIB1\nRui Sá Costa    2000    NIB2')).toEqual([
      ['Ana Lima', '1000', 'NIB1'],
      ['Rui Sá Costa', '2000', 'NIB2'],
    ]);
  });

  it('vírgula só serve se as colunas baterem certo (nomes com vírgula não partem sozinhos)', () => {
    expect(parseTabular('Ana,1000,NIB1\nRui,2000,NIB2')[0]).toEqual(['Ana', '1000', 'NIB1']);
    // uma só coluna com vírgulas soltas: não parte
    expect(parseTabular('Caetano Auto Cv,Sa\nOutro Nome\nMais Um\nUltimo')).toEqual([['Caetano Auto Cv,Sa'], ['Outro Nome'], ['Mais Um'], ['Ultimo']]);
  });

  it('uma lista só de NIBs fica numa coluna', () => {
    expect(parseTabular('000300001234567810176\n000500001234567810176')).toEqual([['000300001234567810176'], ['000500001234567810176']]);
  });

  it('texto vazio', () => {
    expect(parseTabular('')).toEqual([]);
    expect(parseTabular('  \n \n')).toEqual([]);
  });
});

describe('PS2: a colagem usa o mesmo leitor', () => {
  it('um nome com tab (entre aspas) não desloca o valor', () => {
    const txt = '000300001234567810176\t1000,00\t"JOAO\tSILVA"\n000300009876543210176\t2500\tMARIA';
    const l = parseColagem(txt);
    expect(l).toHaveLength(2);
    expect(l[0]).toMatchObject({ valor: '1000,00', nome: 'JOAO SILVA'.replace(' ', '\t') });
    expect(l[1]).toMatchObject({ valor: '2500', nome: 'MARIA' });
  });

  it('colar com colunas separadas por espaços (de um PDF)', () => {
    const l = parseColagem('000300001234567810176   1000,00   JOAO SILVA\n000300009876543210176   2500   MARIA COSTA');
    expect(l.map((x) => x.nome)).toEqual(['JOAO SILVA', 'MARIA COSTA']);
    expect(autodetectar(parseTabular('000300001234567810176   1000,00   JOAO'))).toMatchObject({ colConta: 0 });
  });
});

// A folha "Pagamento" que o cliente manda: dois blocos (BCA e Outros Bancos), cada um com o seu cabeçalho,
// um TOTAL no meio, um título "Outros Bancos" e contas de 13 dígitos do BCA. Valores inventados.
const FOLHA = [
  'BCA\t\t\t',
  'Beneficiário\tValor a pagar\tDescritivo\tNº Conta/ NIB',
  'Inova Assistance\t86135\tFT/2026/CV/100\t000300001234567810176',
  'Danilo Teste\t21250\tAjuda de custo\t000300001234567810177',
  'Transport Teste\t66010\tFA BR26/130\t8496957610001',
  'TOTAL\t278694\t\t',
  '\t\t\t',
  'Outros Bancos\t\t\t',
  'Beneficiário\tValor a pagar\tDescritivo\tNº Conta/ NIB',
  'Roseanne Teste\t15833\tAjuda de custo\t000500000446995510197',
  'Hotel Teste\t5176\tFAP 2026/143\t000800001501001234567',
  'Sem Descritivo\t100\t\t000200001234567810176',
  'TOTAL\t104558\t\t',
].join('\n');

describe('OIC: folha Pagamento (descritivo do cliente + título e cabeçalho repetidos)', () => {
  const rows = parseTabular(FOLHA, { manterVazias: true });
  const d = autodetectarColunasOIC(rows);
  const tratadas = rows.slice(d.linhaInicial - 1).map((r, i) => ({
    ref: d.linhaInicial + i,
    ...tratarLinhaOIC(
      { nib: r[d.colNib], montante: r[d.colMontante], nome: r[d.colNome], descritivo: d.colDescritivo >= 0 ? r[d.colDescritivo] : '' },
      'Pagamento Ordenado',
    ),
  }));
  const por = (nome: string) => tratadas.find((t) => t.nome.startsWith(nome))!;

  it('deteta as colunas pelo cabeçalho, incluindo o descritivo', () => {
    expect(d).toMatchObject({ colNome: 0, colMontante: 1, colDescritivo: 2, colNib: 3, linhaInicial: 3 });
  });

  it('o descritivo do cliente manda; o por defeito só entra onde não há', () => {
    expect(por('Roseanne').descritivo).toBe('Ajuda de custo');
    expect(por('Hotel').descritivo).toBe('FAP 2026/143');
    expect(por('Sem Descritivo').descritivo).toBe('Pagamento Ordenado');
  });

  it('pagamentos de outros bancos ficam prontos; os do BCA ficam de fora', () => {
    for (const n of ['Roseanne', 'Hotel', 'Sem Descritivo']) expect(por(n).erro, n).toBeNull();
    expect(por('Inova').foraDoFicheiro).toBe(true);
    expect(por('Danilo').foraDoFicheiro).toBe(true);
  });

  it('o título "Outros Bancos", o cabeçalho repetido, os TOTAL e as linhas em branco não dão erro', () => {
    const comErro = tratadas.filter((t) => !t.vazia && t.erro);
    // só a conta de 13 dígitos (que o gerador diz que é do BCA e vai pelo PS2)
    expect(comErro.map((t) => t.nome)).toEqual(['Transport Teste']);
    expect(comErro[0].erro).toMatch(/21 dígitos \(tem 13\).*PS2/);
  });
});

describe('OIC: o bloco BCA e os NIBs do BCA não entram na lista', () => {
  const rows = parseTabular(FOLHA, { manterVazias: true });
  const d = autodetectarColunasOIC(rows);
  const { linhas, nBcaIgnoradas } = tratarFolhaOIC(rows, d, 'Pagamento Ordenado');

  it('só ficam os pagamentos do bloco "Outros Bancos"', () => {
    expect(linhas.map((l) => l.nome)).toEqual(['Roseanne Teste', 'Hotel Teste', 'Sem Descritivo']);
    expect(linhas.every((l) => !l.erro && !l.foraDoFicheiro)).toBe(true);
  });

  it('as 3 linhas do bloco BCA (2 NIBs 0003 e 1 conta de 13 dígitos) só se contam, não se listam nem dão erro', () => {
    expect(nBcaIgnoradas).toBe(3);
  });

  it('NIB 0003 fora de qualquer bloco também fica de fora', () => {
    const r = [
      ['Nome', 'Valor', 'NIB'],
      ['Ana', '100', '000300001234567810176'],
      ['Rui', '200', '000500001234567810176'],
    ];
    const t = tratarFolhaOIC(r, { colNib: 2, colMontante: 1, colNome: 0, colDescritivo: -1, linhaInicial: 2 }, 'Pagamento');
    expect(t.linhas.map((l) => l.nome)).toEqual(['Rui']);
    expect(t.nBcaIgnoradas).toBe(1);
  });

  it('uma conta curta fora do bloco BCA continua a aparecer (é um erro a ver)', () => {
    const r = [
      ['Nome', 'Valor', 'NIB'],
      ['Ana', '100', '8201957610001'],
    ];
    const t = tratarFolhaOIC(r, { colNib: 2, colMontante: 1, colNome: 0, colDescritivo: -1, linhaInicial: 2 }, 'Pagamento');
    expect(t.linhas).toHaveLength(1);
    expect(t.linhas[0].erro).toMatch(/21 dígitos/);
  });

  it('as linhas mantêm o número que têm na folha', () => {
    expect(linhas[0].ref).toBe(10);
  });

  it('secaoDaLinha', () => {
    expect(secaoDaLinha(['BCA', '', '', ''])).toBe('bca');
    expect(secaoDaLinha(['', 'Outros Bancos', '', ''])).toBe('outros');
    expect(secaoDaLinha(['Interbancário'])).toBe('outros');
    expect(secaoDaLinha(['BCA Seguros', '10'])).toBeNull();
    expect(secaoDaLinha(['Ana Lima', '100', '', ''])).toBeNull();
    expect(secaoDaLinha(['TOTAL', '', '', ''])).toBeNull();
  });
});

describe('PS2: folha Pagamento (só o bloco BCA; descritivo do cliente)', () => {
  const matriz = parseTabular(FOLHA, { manterVazias: true });
  const det = autodetectar(matriz);
  const { linhas, nOutrosBlocos } = linhasDaMatriz(matriz, det);

  it('deteta as colunas pelo cabeçalho, incluindo o descritivo', () => {
    expect(det).toMatchObject({ colNome: 0, colValor: 1, colDescritivo: 2, colConta: 3 });
  });

  it('só entram as linhas do bloco BCA; as de "Outros Bancos" só se contam', () => {
    const nomes = linhas.filter((l) => l.recebido !== '').map((l) => l.nome);
    expect(nomes).toEqual(['Inova Assistance', 'Danilo Teste', 'Transport Teste']);
    expect(nOutrosBlocos).toBe(3); // Roseanne, Hotel e Sem Descritivo (não o cabeçalho nem o TOTAL)
  });

  it('o descritivo do cliente vem na linha; sem ele, fica vazio (vale o prefixo)', () => {
    expect(linhas.find((l) => l.nome === 'Inova Assistance')?.descritivo).toBe('FT/2026/CV/100');
    expect(linhas.find((l) => l.nome === 'Danilo Teste')?.descritivo).toBe('Ajuda de custo');
  });

  it('parseColagem (texto colado) também traz o descritivo', () => {
    const l = parseColagem(['Nome\tValor\tDescritivo\tNIB', 'Ana Lima\t1000\tSubsidio Ferias\t000300001234567810176', 'Rui Sa\t2000\t\t000300001234567810177'].join('\n'));
    expect(l.map((x) => x.descritivo)).toEqual(['Subsidio Ferias', '']);
  });

  it('sem cabeçalho não se adivinha coluna de descritivo', () => {
    expect(autodetectar([['000300001234567810176', '1000', 'Ana Lima', 'qualquer texto']]).colDescritivo).toBe(-1);
  });

  it('sem blocos: tudo entra', () => {
    const r = [['Nome', 'Valor', 'NIB'], ['Ana', '100', '000300001234567810176'], ['Rui', '200', '000300001234567810177']];
    const t = linhasDaMatriz(r, { colConta: 2, colValor: 1, colNome: 0, colDescritivo: -1, linhaInicial: 2 });
    expect(t.linhas).toHaveLength(2);
    expect(t.nOutrosBlocos).toBe(0);
  });
});
