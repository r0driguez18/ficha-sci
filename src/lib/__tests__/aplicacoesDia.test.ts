import { describe, expect, it } from 'vitest';
import {
  CODIGOS_APLICACAO,
  dataDoCore,
  excelDasAplicacoes,
  horaDoCore,
  indicesDosCampos,
  lerExcelAplicacoes,
  lerOperacoes,
  nomeExcelAplicacoes,
  type LinhaBruta,
} from '../aplicacoesDia';

const N = CODIGOS_APLICACAO.length;

/** Um registo do core: tudo vazio/zero, com os campos pedidos preenchidos pelo código. */
function registo(campos: Record<string, string | number>): LinhaBruta {
  const l: LinhaBruta = CODIGOS_APLICACAO.map((c) => (/^(ACHORA|ACDTIN|ACNOPR|ACNMOV|ACTAPL|ACTPND|ACTDEB|ACTCRE|ACSQAP)$/.test(c) ? 0 : ''));
  for (const [c, v] of Object.entries(campos)) l[CODIGOS_APLICACAO.indexOf(c as (typeof CODIGOS_APLICACAO)[number])] = v;
  return l;
}

const CODIGOS: LinhaBruta = [...CODIGOS_APLICACAO];
const OPERACOES: LinhaBruta[] = [
  registo({ ACEMP: 'ORD_PS2_01', ACSQAP: 2, ACSITU: 'T', ACFILE: 'SACERM11A', ACHORA: 103825, ACDTIN: 20261111, ACNOPR: 583520575, ACUSER: 'NALVES', ACNMOV: 23, ACTAPL: 23, ACTCRE: 385000 }),
  registo({ ACEMP: 'CARTOES', ACSQAP: 1, ACSITU: 'T', ACFILE: 'EDST111101', ACHORA: 25932, ACDTIN: 20261111, ACNOPR: 583510366, ACUSER: 'SISP', ACNMOV: 61526, ACTAPL: 61526 }),
  registo({ ACEMP: 'OUTROS', ACSQAP: 1, ACSITU: 'P' }), // pendente a zeros: sem nº de operação
  registo({ ACNOPR: 'Taxa IVA Custo Serviço' }), // linha de documentação da tabela
];

describe('aplicações do dia', () => {
  it('hora e data do core', () => {
    expect(horaDoCore(103752)).toBe('10:37');
    expect(horaDoCore(25932)).toBe('02:59');
    expect(horaDoCore('85702')).toBe('08:57');
    expect(horaDoCore(0)).toBe('');
    expect(dataDoCore(20261111)).toBe('2026-11-11');
    expect(dataDoCore(0)).toBe('');
  });

  it('o nome do Excel é Aplicacoes_ddmmaaaa.xlsx', () => {
    expect(nomeExcelAplicacoes('2026-11-11')).toBe('Aplicacoes_11112026.xlsx');
  });

  it('as colunas conhecidas têm 54 códigos únicos', () => {
    expect(N).toBe(54);
    expect(new Set(CODIGOS_APLICACAO).size).toBe(N);
  });

  it('reconhece o registo de códigos do core; sem ele usa a ordem conhecida', () => {
    expect(indicesDosCampos([CODIGOS, ...OPERACOES]).origem).toBe('registo-de-codigos');
    const sem = indicesDosCampos(OPERACOES);
    expect(sem.origem).toBe('ordem-conhecida');
    expect(sem.indices.ACNOPR).toBe(CODIGOS_APLICACAO.indexOf('ACNOPR'));
  });

  it('só as operações reais, por hora; ignora códigos, pendentes a zeros e documentação', () => {
    const { operacoes, avisos } = lerOperacoes([CODIGOS, ...OPERACOES], '2026-11-11');
    expect(avisos).toEqual([]);
    expect(operacoes.map((o) => [o.hora, o.ficheiro, o.nOperacao, o.utilizador])).toEqual([
      ['02:59', 'EDST111101', '583510366', 'SISP'],
      ['10:38', 'SACERM11A', '583520575', 'NALVES'],
    ]);
    expect(operacoes[1]).toMatchObject({ empresa: 'ORD_PS2_01', seq: 2, situacao: 'T', movimentos: 23, aplicados: 23, totalCredito: 385000, data: '2026-11-11' });
  });

  it('avisa quando os dados são de outro dia que o da ficha', () => {
    const { avisos } = lerOperacoes([CODIGOS, ...OPERACOES], '2026-11-12');
    expect(avisos[0]).toContain('2026-11-11');
  });

  it('avisa quando a estrutura da tabela mudou', () => {
    const sem = [['A', 'B'], ['ACEMP', 'ACSQAP']];
    const r = lerOperacoes(sem);
    expect(r.operacoes).toEqual([]);
    expect(r.avisos[0]).toContain('estrutura');
  });

  it('o Excel gerado volta a ser lido igual (colunas e linhas)', async () => {
    const colunas = CODIGOS_APLICACAO.map((c) => `col ${c}`);
    const blob = await excelDasAplicacoes(colunas, [CODIGOS, ...OPERACOES.slice(0, 2)]);
    const lido = await lerExcelAplicacoes(await blob.arrayBuffer());
    expect(lido.colunas).toEqual(colunas);
    expect(lido.linhas).toHaveLength(3);
    expect(lerOperacoes(lido.linhas, '2026-11-11').operacoes).toHaveLength(2);
  });
});
