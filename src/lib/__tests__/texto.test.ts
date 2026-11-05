import { describe, expect, it } from 'vitest';
import { gerarPS2 } from '../ps2';
import { paraAscii } from '../texto';

describe('paraAscii (ficheiro PS2)', () => {
  it('tira acentos e cedilha', () => {
    expect(paraAscii('João Conceição Açúcar')).toBe('Joao Conceicao Acucar');
    expect(paraAscii('ÀÉÎÕÜ àéîõü Ñ ñ')).toBe('AEIOU aeiou N n');
  });

  it('sinais tipográficos do Word viram os simples', () => {
    expect(paraAscii('Ordenado – Outubro')).toBe('Ordenado - Outubro');
    expect(paraAscii('“Salário” de Maria’s')).toBe('"Salario" de Maria\'s');
    expect(paraAscii('Nº 5 · 2ª via')).toBe('No 5 2a via');
    expect(paraAscii('Reticências…')).toBe('Reticencias...');
  });

  it('o que não existe em ASCII sai, sem deixar espaços a mais', () => {
    expect(paraAscii('Ana    Silva')).toBe('Ana Silva');
    expect(paraAscii('Pedro 😀 Costa')).toBe('Pedro Costa');
    expect(paraAscii('Linha\tcom\ttabs')).toBe('Linha com tabs');
    expect(paraAscii('   ')).toBe('');
  });

  it('texto normal fica igual', () => {
    expect(paraAscii('Ordenado Outubro 2026 - Ana/Rui (A&B)')).toBe('Ordenado Outubro 2026 - Ana/Rui (A&B)');
  });
});

describe('PS2: caracteres especiais no ficheiro gerado', () => {
  const nib = '000300001234567810176';
  const gerar = (descritivo: string, referencia = 'Ordenado') =>
    gerarPS2({
      tipo: 'Ordenado',
      nibEmpresa: nib,
      data: '2026-10-25',
      referenciaOrdenante: referencia,
      linhas: [{ nib, valor: '1000', descritivo }],
    });

  it('o descritivo sai só com ASCII e cada linha mantém os 80 caracteres', () => {
    const r = gerar('Ordenado – João Conceição');
    expect(r.erros).toEqual([]);
    expect(r.conteudo).toContain('Ordenado - Joao Conceicao');
    // eslint-disable-next-line no-control-regex
    expect(r.conteudo).toMatch(/^[\x00-\x7F]*$/);
    for (const l of r.conteudo.split('\r\n').filter(Boolean)) expect(l).toHaveLength(80);
  });

  it('a referência do ordenante também', () => {
    const r = gerar('Ordenado', 'Salários – Outubro');
    expect(r.erros).toEqual([]);
    expect(r.conteudo).toContain('Salarios - Outubro');
    // eslint-disable-next-line no-control-regex
    expect(r.conteudo).toMatch(/^[\x00-\x7F]*$/);
  });

  it('um descritivo só com símbolos fora de ASCII fica vazio e dá erro, em vez de linha estragada', () => {
    const r = gerar('😀😀');
    expect(r.erros.join(' ')).toMatch(/DESCRITIVO/);
  });
});
