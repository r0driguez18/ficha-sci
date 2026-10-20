import { describe, expect, it } from 'vitest';
import { foiArredondado, gerarPS2, montarNib, nomeFicheiroPS2, valorEmEscudos } from '../ps2';
import { tratarNib } from '../nibBca';

const nibEmpresa = montarNib('12345678'); // 0003 0000 12345678 10176
const base = {
  tipo: 'Ordenado',
  nibEmpresa,
  data: '2026-10-16',
  referenciaOrdenante: 'ACME SA',
  linhas: [
    { nib: montarNib('00000001'), valor: 15000, descritivo: 'Ordenado João' },
    { nib: montarNib('00000002'), valor: '17331,5', descritivo: 'Ordenado Maria' },
  ],
};

describe('gerarPS2 (ficheiro que movimenta dinheiro)', () => {
  const r = gerarPS2(base);
  const linhas = r.conteudo.split('\r\n');

  it('gera cabeçalho, uma linha por beneficiário e rodapé, tudo com 80 posições', () => {
    expect(r.erros).toEqual([]);
    expect(linhas.at(-1)).toBe(''); // CRLF final
    const util = linhas.slice(0, -1);
    expect(util).toHaveLength(4);
    for (const l of util) expect(l, l).toHaveLength(80);
    expect(util[0].startsWith('PS21')).toBe(true);
    expect(util[1].startsWith('PS22')).toBe(true);
    expect(util[3].startsWith('PS29')).toBe(true);
  });

  it('soma e conta certo, arredondando como o Excel (17331,5 → 17332)', () => {
    expect(r.totalRegistos).toBe(2);
    expect(r.somaTotal).toBe(15000 + 17332);
    const rodape = linhas[3];
    expect(rodape.slice(0, 80).includes(String(32332).padStart(11, '0'))).toBe(true);
  });

  it('o valor de cada linha vai em escudos com 11 dígitos + 00', () => {
    expect(linhas[1]).toContain('0000001500000');
  });

  it('tira os acentos do descritivo (1 carácter = 1 byte)', () => {
    expect(linhas[1]).toContain('Ordenado Joao');
    expect(r.conteudo).not.toMatch(/[ãáâéêíóôõúç]/i);
  });

  it('a data e a referência entram no cabeçalho', () => {
    expect(linhas[0]).toContain('CVE20261016ACME SA');
  });
});

describe('gerarPS2 — nunca gera ficheiro com erros', () => {
  const semConteudo = (r: ReturnType<typeof gerarPS2>) => {
    expect(r.erros.length).toBeGreaterThan(0);
    expect(r.conteudo).toBe('');
  };

  it('NIB de outro banco numa linha', () => {
    const r = gerarPS2({ ...base, linhas: [{ nib: '000500001234567810176', valor: 100, descritivo: 'X' }] });
    semConteudo(r);
    expect(r.erros[0]).toMatch(/linha 1.*não pertence ao BCA/);
  });

  it('descritivo em falta, montante inválido, tipo, empresa, referência e data inválidos', () => {
    semConteudo(gerarPS2({ ...base, linhas: [{ nib: montarNib('00000001'), valor: 100, descritivo: '  ' }] }));
    semConteudo(gerarPS2({ ...base, linhas: [{ nib: montarNib('00000001'), valor: 'abc', descritivo: 'X' }] }));
    semConteudo(gerarPS2({ ...base, tipo: 'Inventado' }));
    semConteudo(gerarPS2({ ...base, nibEmpresa: '000512345678' }));
    semConteudo(gerarPS2({ ...base, nibEmpresa: '' }));
    semConteudo(gerarPS2({ ...base, referenciaOrdenante: '' }));
    semConteudo(gerarPS2({ ...base, referenciaOrdenante: 'x'.repeat(36) }));
    semConteudo(gerarPS2({ ...base, data: 'ontem' }));
  });

  it('linhas em branco são ignoradas e contadas, sem erro', () => {
    const r = gerarPS2({ ...base, linhas: [...base.linhas, { nib: '', valor: '', descritivo: '' }] });
    expect(r.erros).toEqual([]);
    expect(r.linhasIgnoradas).toBe(1);
    expect(r.totalRegistos).toBe(2);
  });
});

describe('valores e nomes', () => {
  it('arredonda como o Excel e sabe quando houve arredondamento', () => {
    expect(valorEmEscudos('19893.333333333332')).toBe(19893);
    expect(valorEmEscudos('17331,5')).toBe(17332);
    expect(valorEmEscudos(1234)).toBe(1234);
    expect(valorEmEscudos('')).toBeNull();
    expect(foiArredondado('100,50')).toBe(true);
    expect(foiArredondado('100')).toBe(false);
  });

  it('nome do ficheiro com a data', () => {
    expect(nomeFicheiroPS2(new Date(2026, 9, 16))).toBe('PS2_20261016.txt');
  });
});

describe('tratarNib (NIB do BCA)', () => {
  it('um NIB completo do BCA fica como veio (só a natureza se converte)', () => {
    const t = tratarNib('000300001234567810176');
    expect(t.estado).toBe('ok');
    expect(t.nib).toBe('000300001234567810176');
  });

  it('só a conta é preenchida com zeros e leva a natureza por omissão', () => {
    const t = tratarNib('1234567', undefined, 'so-conta');
    expect(t.estado).toBe('ok');
    expect(t.nib).toBe('000300000123456710176');
    expect(t.nib).toHaveLength(21);
  });

  it('NIB de outro banco nunca é arranjado: fica de fora', () => {
    for (const outro of ['000500001234567810176', '000200001234567810176', '000800001234567810176']) {
      const t = tratarNib(outro);
      expect(t.estado, outro).toBe('nao-bca');
      expect(t.nib).toBe('');
    }
  });

  it('sem dígitos fica em alerta', () => {
    expect(tratarNib('').estado).toBe('alerta');
    expect(tratarNib('abc').estado).toBe('alerta');
  });
});
