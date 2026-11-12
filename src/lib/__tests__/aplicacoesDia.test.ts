import { describe, expect, it } from 'vitest';
import {
  CODIGOS_APLICACAO,
  COLUNAS_EXCEL_OPERACOES,
  dataDoCore,
  excelDasAplicacoes,
  excelDasOperacoes,
  filtrarPorOperadores,
  janelaDaFicha,
  selecionarOperacoes,
  horaDoCore,
  indicesDosCampos,
  lerExcelAplicacoes,
  lerOperacoes,
  nomeExcelAplicacoes,
  situacaoDoPedido,
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
    const { operacoes, avisos } = lerOperacoes([CODIGOS, ...OPERACOES]);
    expect(avisos).toEqual([]);
    expect(operacoes.map((o) => [o.hora, o.ficheiro, o.nOperacao, o.utilizador])).toEqual([
      ['02:59', 'EDST111101', '583510366', 'SISP'],
      ['10:38', 'SACERM11A', '583520575', 'NALVES'],
    ]);
    expect(operacoes[1]).toMatchObject({ empresa: 'ORD_PS2_01', seq: 2, situacao: 'T', movimentos: 23, aplicados: 23, totalCredito: 385000, data: '2026-11-11' });
  });

  it('já não avisa de «outro dia»: a ficha cobre duas datas (07:00 → 07:00)', () => {
    expect(lerOperacoes([CODIGOS, ...OPERACOES]).avisos).toEqual([]);
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
    expect(lerOperacoes(lido.linhas).operacoes).toHaveLength(2);
  });
});

describe('situação do pedido', () => {
  const agora = new Date('2026-11-12T10:00:00Z').getTime();
  const pedido = (estado: 'pendente' | 'a-correr' | 'concluido' | 'erro', pedidoEm: string, iniciadoEm: string | null = null) => ({ estado, pedido_em: pedidoEm, iniciado_em: iniciadoEm });

  it('pendente recente espera pelo worker; passados 3 min é sem resposta (não fica preso para sempre)', () => {
    expect(situacaoDoPedido(pedido('pendente', '2026-11-12T09:59:30Z'), agora)).toBe('a-esperar-worker');
    expect(situacaoDoPedido(pedido('pendente', '2026-11-12T09:56:00Z'), agora)).toBe('sem-resposta');
    expect(situacaoDoPedido(pedido('pendente', '2026-11-11T09:56:00Z'), agora)).toBe('sem-resposta'); // de ontem, após logoff
  });

  it('a-correr conta desde que o worker começou', () => {
    expect(situacaoDoPedido(pedido('a-correr', '2026-11-12T09:50:00Z', '2026-11-12T09:59:50Z'), agora)).toBe('worker-a-ler');
    expect(situacaoDoPedido(pedido('a-correr', '2026-11-12T09:50:00Z', '2026-11-12T09:55:00Z'), agora)).toBe('sem-resposta');
  });

  it('concluído e erro não dependem do tempo', () => {
    expect(situacaoDoPedido(pedido('concluido', '2026-11-01T09:00:00Z'), agora)).toBe('concluido');
    expect(situacaoDoPedido(pedido('erro', '2026-11-01T09:00:00Z'), agora)).toBe('erro');
  });
});

describe('só as operações dos operadores', () => {
  const ops = lerOperacoes([CODIGOS, ...OPERACOES]).operacoes; // NALVES e SISP

  it('fica com os operadores (sem distinguir maiúsculas) e põe os outros à parte', () => {
    const r = filtrarPorOperadores(ops, ['nalves', 'etavares']);
    expect(r.dosOperadores.map((o) => o.utilizador)).toEqual(['NALVES']);
    expect(r.deOutros.map((o) => o.utilizador)).toEqual(['SISP']);
  });

  it('sem lista de operadores não filtra (para não esconder tudo se ainda não carregou)', () => {
    expect(filtrarPorOperadores(ops, undefined).dosOperadores).toHaveLength(2);
    expect(filtrarPorOperadores(ops, []).dosOperadores).toHaveLength(2);
  });

  it('operador desconhecido deixa tudo de fora', () => {
    expect(filtrarPorOperadores(ops, ['ninguem']).dosOperadores).toHaveLength(0);
  });

  it('o Excel tratado só tem as colunas úteis e as operações dadas', async () => {
    const { dosOperadores } = filtrarPorOperadores(ops, ['nalves']);
    const lido = await lerExcelAplicacoes(await (await excelDasOperacoes(dosOperadores)).arrayBuffer());
    expect(lido.colunas).toEqual([...COLUNAS_EXCEL_OPERACOES]);
    expect(lido.linhas).toHaveLength(1);
    const l = lido.linhas[0];
    expect(l[1]).toBe('10:38'); // hora
    expect(l[2]).toBe('ORD_PS2_01'); // tarefa
    expect(l[3]).toBe('SACERM11A'); // ficheiro
    expect(l[5]).toBe('NALVES');
    expect(l[6]).toBe('T');
    expect(l[7]).toBe(23); // movimentos
  });
});

describe('janela da ficha: 07:00 do dia → 07:00 do dia seguinte', () => {
  const op = (data: string, hora: number, user = 'NALVES') =>
    registo({ ACEMP: 'TEIS', ACSITU: 'T', ACFILE: 'F', ACHORA: hora, ACDTIN: Number(data.replace(/-/g, '')), ACNOPR: hora + 1, ACUSER: user });
  const ops = lerOperacoes([
    CODIGOS,
    op('2026-11-11', 25932), // 02:59 de 11 -> ficha de 10
    op('2026-11-11', 70000), // 07:00 de 11 -> entra na ficha de 11 (início incluído)
    op('2026-11-11', 85702), // 08:57
    op('2026-11-11', 235900), // 23:59
    op('2026-11-12', 15000), // 01:50 de 12 -> ainda é a ficha de 11 (madrugada)
    op('2026-11-12', 65959), // 06:59 de 12 -> ainda de 11
    op('2026-11-12', 70000), // 07:00 de 12 -> já é da ficha de 12 (fim excluído)
    op('2026-11-11', 90000, 'SISP'),
  ]).operacoes;

  it('a janela vai das 07:00 de D às 07:00 de D+1', () => {
    expect(janelaDaFicha('2026-11-11')).toEqual({ inicio: '2026-11-11 07:00', fim: '2026-11-12 07:00' });
    expect(janelaDaFicha('2026-12-31').fim).toBe('2027-01-01 07:00');
  });

  it('fica com manhã, tarde, noite e madrugada da ficha, e põe o resto fora', () => {
    const r = selecionarOperacoes(ops, '2026-11-11', ['nalves']);
    expect(r.selecionadas.map((o) => `${o.data} ${o.hora}`).sort()).toEqual([
      '2026-11-11 07:00', '2026-11-11 08:57', '2026-11-11 23:59', '2026-11-12 01:50', '2026-11-12 06:59',
    ]);
    expect(r.foraDaJanela.map((o) => `${o.data} ${o.hora}`).sort()).toEqual(['2026-11-11 02:59', '2026-11-12 07:00']);
    expect(r.deOutros.map((o) => o.utilizador)).toEqual(['SISP']);
    expect(r.aviso).toBeNull();
  });

  it('a mesma lista dá outra ficha noutra data', () => {
    const r = selecionarOperacoes(ops, '2026-11-10', ['nalves']);
    expect(r.selecionadas.map((o) => o.hora)).toEqual(['02:59']);
  });

  it('avisa quando nada cai na janela', () => {
    const r = selecionarOperacoes(ops, '2026-11-20', ['nalves']);
    expect(r.selecionadas).toEqual([]);
    expect(r.aviso).toContain('2026-11-20 07:00');
  });
});
