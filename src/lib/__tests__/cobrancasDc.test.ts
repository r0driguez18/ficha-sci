import { describe, expect, it } from 'vitest';
import { cobrancasParaRetorno, EMPRESAS_COBRANCAS, ehEmpresaDeCobranca } from '../cobrancasDc';
import type { OperacaoAplicada } from '../aplicacoesDia';

const dc = (c: Partial<OperacaoAplicada> = {}): OperacaoAplicada => ({
  data: '2026-11-18', hora: '10:00', ficheiro: 'CVTMOV01', referencia: '', modulo: 'DC', utilizador: 'NALVES', tipo: 'A', nOrdem: '',
  empresa: 'CVT_MOVEL', nOperacao: '123456789', movimentos: 5, aplicados: 5, ...c,
});

describe('cobranças dentro dos DC', () => {
  it('são 18 empresas', () => {
    expect(EMPRESAS_COBRANCAS).toHaveLength(18);
  });

  it('reconhece as empresas da lista, sem distinguir maiúsculas nem espaços', () => {
    for (const e of ['IMPAR', 'cvt_movel', ' QUOTAS1 ', 'SINDICATO', 'P_COM_SISP']) expect(ehEmpresaDeCobranca(e), e).toBe(true);
    for (const e of ['ORD_PS2_01', 'MSCC', 'TELECOMP', '', null, undefined]) expect(ehEmpresaDeCobranca(e), String(e)).toBe(false);
  });

  it('só as cobranças aplicadas vão para retorno', () => {
    const r = cobrancasParaRetorno([
      dc({ ficheiro: 'COB1' }),
      dc({ ficheiro: 'SAL1', empresa: 'ORD_PS2_01' }), // salário: não
      dc({ ficheiro: 'VAL1', tipo: 'V', aplicados: 0 }), // validação: não
      dc({ ficheiro: 'ZERO', aplicados: 0 }), // nada aplicado: não
    ]);
    expect(r).toEqual(['COB1']);
  });

  it('o mesmo ficheiro aplicado duas vezes é um só retorno', () => {
    expect(cobrancasParaRetorno([dc({ ficheiro: 'COB1' }), dc({ ficheiro: 'COB1', nOperacao: '2' })])).toEqual(['COB1']);
  });

  it('sem nome de ficheiro usa a empresa e o nº de operação', () => {
    expect(cobrancasParaRetorno([dc({ ficheiro: '', empresa: 'IMPAR', nOperacao: '77' })])).toEqual(['IMPAR 77']);
  });

  it('o que não é DC não conta, mesmo com o nome igual', () => {
    expect(cobrancasParaRetorno([dc({ modulo: 'TE', empresa: 'IMPAR' })])).toEqual([]);
  });
});
