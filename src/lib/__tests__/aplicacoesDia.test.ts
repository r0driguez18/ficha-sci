import { describe, expect, it } from 'vitest';
import {
  CODIGOS_GBAPL,
  CODIGOS_PLOGITF,
  COLUNAS_EXCEL_OPERACOES,
  dataDoCore,
  excelDasAplicacoes,
  excelDasOperacoes,
  filtrarPorOperadores,
  horaDoCore,
  indicesDosCampos,
  janelaDaFicha,
  lerExcelAplicacoes,
  lerOperacoes,
  juntarOperacoes,
  nomeExcelAplicacoes,
  operacoesDeDc,
  selecionarOperacoes,
  situacaoDoPedido,
  type LinhaBruta,
} from '../aplicacoesDia';

const N = CODIGOS_PLOGITF.length;
type Campos = { ficheiro?: string; ref?: string; modulo?: string; user?: string; data?: number; hora?: number; tipo?: string; ordem?: number | string };

let seq = 1000;
/** Um registo do log: vem pela ordem dos códigos, como o core o devolve. */
function registo(c: Campos = {}): LinhaBruta {
  const l: LinhaBruta = CODIGOS_PLOGITF.map(() => '');
  const por: Record<string, string | number> = {
    $PLOFILE: c.ficheiro ?? 'SACERM11A',
    $PLOLIB: 'PROUSR0003',
    $PLOMBR: 'REG80',
    $PLOREFT: c.ref ?? 'PS2',
    $PLOAPLPR: 'BM',
    $PLOUSPR: c.user ?? 'NALVES',
    $PLODTPR: c.data ?? 20261111,
    $PLODTAPPR: c.data ?? 20261111,
    $PLOHOPR: c.hora ?? 103821,
    $PLODTAP: 0,
    $PLODTAPAP: 0,
    $PLOHOAP: 0,
    $PLOTIPR: 'R',
    $PLOAPTR: c.tipo ?? 'A',
    $PLONORD: c.ordem ?? ++seq,
    $PLOMOD: c.modulo ?? 'TE',
  };
  for (const [k, v] of Object.entries(por)) l[CODIGOS_PLOGITF.indexOf(k as (typeof CODIGOS_PLOGITF)[number])] = v;
  return l;
}

const CODIGOS: LinhaBruta = [...CODIGOS_PLOGITF]; // a 1.ª «linha» de dados do core: os códigos dos campos

describe('registo de ficheiros processados (PLOGITF)', () => {
  it('horaDoCore: HHMMSS sem o zero à esquerda', () => {
    expect(horaDoCore(103752)).toBe('10:37');
    expect(horaDoCore(85532)).toBe('08:55');
    expect(horaDoCore(332)).toBe('00:03'); // 00:03:32
    expect(horaDoCore(0)).toBe('');
    expect(horaDoCore('')).toBe('');
  });

  it('dataDoCore: AAAAMMDD', () => {
    expect(dataDoCore(20261111)).toBe('2026-11-11');
    expect(dataDoCore('20260102')).toBe('2026-01-02');
    expect(dataDoCore(0)).toBe('');
    expect(dataDoCore('$PLODTPR')).toBe('');
  });

  it('indicesDosCampos: pelo registo de códigos, ou pela ordem conhecida', () => {
    expect(indicesDosCampos([CODIGOS]).origem).toBe('registo-de-codigos');
    expect(indicesDosCampos([registo()]).origem).toBe('ordem-conhecida');
    expect(indicesDosCampos([CODIGOS]).indices.$PLONORD).toBe(CODIGOS_PLOGITF.indexOf('$PLONORD'));
  });

  it('lerOperacoes: só registos reais (sem o registo de códigos), limpos e por ordem de hora', () => {
    const { operacoes, avisos } = lerOperacoes([
      CODIGOS,
      registo({ ficheiro: 'SACERM11A', hora: 103821, ordem: 225083 }),
      registo({ ficheiro: 'RTR2611111 ', ref: 'RTR', modulo: 'TE', user: 'NALVES    ', hora: 85656, ordem: 225073 }),
    ]);
    expect(avisos).toEqual([]);
    expect(operacoes).toHaveLength(2);
    expect(operacoes.map((o) => o.hora)).toEqual(['08:56', '10:38']);
    expect(operacoes[0]).toEqual({ data: '2026-11-11', hora: '08:56', ficheiro: 'RTR2611111', referencia: 'RTR', modulo: 'TE', utilizador: 'NALVES', tipo: 'A', nOrdem: '225073' });
  });

  it('funciona sem o registo de códigos (consulta por data): usa a ordem conhecida', () => {
    const { operacoes, avisos } = lerOperacoes([registo(), registo({ hora: 90000 })]);
    expect(avisos).toEqual([]);
    expect(operacoes).toHaveLength(2);
  });

  it('um registo sem ficheiro (BEN, COM) conta na mesma', () => {
    const { operacoes } = lerOperacoes([registo({ ficheiro: '', ref: 'BEN', modulo: 'EC' })]);
    expect(operacoes).toHaveLength(1);
    expect(operacoes[0].ficheiro).toBe('');
    expect(operacoes[0].referencia).toBe('BEN');
  });

  it('linhas sem data ou sem nº de ordem ficam de fora', () => {
    const { operacoes } = lerOperacoes([registo({ data: 0 }), registo({ ordem: 0 }), registo({ ordem: 'abc' }), registo()]);
    expect(operacoes).toHaveLength(1);
  });

  it('ordena pelo nº de ordem quando a data e a hora são iguais', () => {
    const { operacoes } = lerOperacoes([registo({ hora: 174836, ordem: 225184 }), registo({ hora: 174836, ordem: 225182 }), registo({ hora: 174836, ordem: 225183 })]);
    expect(operacoes.map((o) => o.nOrdem)).toEqual(['225182', '225183', '225184']);
  });

  it('dados do formato antigo (GBAPL) dão um aviso claro, não um erro', () => {
    const antigo: LinhaBruta = ['ACEMP', 'ACSQAP', 'ACNLOT'];
    const r = lerOperacoes([antigo]);
    expect(r.operacoes).toEqual([]);
    expect(r.avisos[0]).toContain('formato antigo');
  });

  it('54 colunas sem a linha de códigos (consulta antiga por data) também é formato antigo', () => {
    const r = lerOperacoes([Array.from({ length: 54 }, (_, i) => (i === 0 ? 'TEIS' : i))]);
    expect(r.operacoes).toEqual([]);
    expect(r.avisos).toHaveLength(1);
    expect(r.avisos[0]).toContain('formato antigo');
  });

  it('se faltar uma coluna importante, avisa que a estrutura mudou', () => {
    const r = lerOperacoes([CODIGOS.filter((c) => c !== '$PLOHOPR')]);
    expect(r.operacoes).toEqual([]);
    expect(r.avisos[0]).toContain('estrutura');
    expect(r.avisos[0]).toContain('$PLOHOPR');
  });

  it('sem o registo de códigos e com colunas a mais ou a menos, avisa', () => {
    const r = lerOperacoes([registo().slice(0, N - 2)]);
    expect(r.avisos.some((a) => a.includes('colunas'))).toBe(true);
  });

  it('sem processamentos avisa', () => {
    expect(lerOperacoes([CODIGOS]).avisos[0]).toContain('Não há processamentos');
  });

  it('o Excel em bruto vai e volta sem perder nada', async () => {
    const colunas = CODIGOS_PLOGITF.map((c) => `Título ${c}`);
    const blob = await excelDasAplicacoes(colunas, [CODIGOS, registo(), registo({ hora: 90000 })]);
    const lido = await lerExcelAplicacoes(await blob.arrayBuffer());
    expect(lido.colunas).toEqual(colunas);
    expect(lido.linhas).toHaveLength(3);
    expect(lerOperacoes(lido.linhas).operacoes).toHaveLength(2);
  });

  it('o ficheiro vazio dá erro', async () => {
    const blob = await excelDasAplicacoes(['A'], []);
    await expect(lerExcelAplicacoes(await blob.arrayBuffer())).rejects.toThrow('vazio');
  });

  it('nomeExcelAplicacoes: Aplicacoes_ddmmaaaa.xlsx', () => {
    expect(nomeExcelAplicacoes('2026-11-11')).toBe('Aplicacoes_11112026.xlsx');
  });
});

describe('situação do pedido', () => {
  const agora = new Date('2026-11-12T10:00:00Z').getTime();
  const pedido = (estado: 'pendente' | 'a-correr' | 'concluido' | 'erro', pedidoEm: string, iniciadoEm: string | null = null) => ({
    estado,
    pedido_em: pedidoEm,
    iniciado_em: iniciadoEm,
  });

  it('pendente recente está à espera do worker; passados 3 min é «sem resposta»', () => {
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

describe('só os processamentos dos operadores', () => {
  const ops = lerOperacoes([CODIGOS, registo({ user: 'NALVES' }), registo({ user: 'SISP' })]).operacoes;

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

  it('o Excel tratado só tem as colunas úteis e os processamentos dados', async () => {
    const um = lerOperacoes([registo({ ficheiro: 'SACERM11A', ref: 'PS2', modulo: 'TE', hora: 103821, ordem: 225083 })]).operacoes;
    const lido = await lerExcelAplicacoes(await (await excelDasOperacoes(um)).arrayBuffer());
    expect(lido.colunas).toEqual([...COLUNAS_EXCEL_OPERACOES]);
    expect(lido.colunas).toHaveLength(11);
    expect(lido.linhas).toHaveLength(1);
    expect(lido.linhas[0].slice(0, 7)).toEqual(['2026-11-11', '10:38', 'SACERM11A', 'PS2', 'TE', 'NALVES', 225083]);
  });
});

describe('janela da ficha: 07:00 do dia → 07:00 do dia seguinte', () => {
  const ops = lerOperacoes([
    CODIGOS,
    registo({ data: 20261111, hora: 25932 }), // 02:59 de 11 -> ficha de 10
    registo({ data: 20261111, hora: 70000 }), // 07:00 de 11 -> entra na ficha de 11 (início incluído)
    registo({ data: 20261111, hora: 85702 }), // 08:57
    registo({ data: 20261111, hora: 235900 }), // 23:59
    registo({ data: 20261112, hora: 332 }), // 00:03 de 12 -> madrugada: ainda é a ficha de 11
    registo({ data: 20261112, hora: 65959 }), // 06:59 de 12 -> ainda de 11
    registo({ data: 20261112, hora: 70000 }), // 07:00 de 12 -> já é da ficha de 12 (fim excluído)
    registo({ data: 20261111, hora: 90000, user: 'SISP' }),
  ]).operacoes;

  it('a janela vai das 07:00 de D às 07:00 de D+1', () => {
    expect(janelaDaFicha('2026-11-11')).toEqual({ inicio: '2026-11-11 07:00', fim: '2026-11-12 07:00' });
    expect(janelaDaFicha('2026-12-31').fim).toBe('2027-01-01 07:00');
  });

  it('fica com manhã, tarde, noite e madrugada da ficha, e põe o resto fora', () => {
    const r = selecionarOperacoes(ops, '2026-11-11', ['nalves']);
    expect(r.selecionadas.map((o) => `${o.data} ${o.hora}`).sort()).toEqual([
      '2026-11-11 07:00', '2026-11-11 08:57', '2026-11-11 23:59', '2026-11-12 00:03', '2026-11-12 06:59',
    ]);
    expect(r.foraDaJanela.map((o) => `${o.data} ${o.hora}`).sort()).toEqual(['2026-11-11 02:59', '2026-11-12 07:00']);
    expect(r.deOutros.map((o) => o.utilizador)).toEqual(['SISP']);
    expect(r.aviso).toBeNull();
  });

  it('a mesma lista dá outra ficha noutra data', () => {
    expect(selecionarOperacoes(ops, '2026-11-10', ['nalves']).selecionadas.map((o) => o.hora)).toEqual(['02:59']);
  });

  it('avisa quando nada cai na janela', () => {
    const r = selecionarOperacoes(ops, '2026-11-20', ['nalves']);
    expect(r.selecionadas).toEqual([]);
    expect(r.aviso).toContain('2026-11-20 07:00');
  });
});

describe('validações (só validado, sem aplicar) ficam de fora', () => {
  const dia = '2026-11-11';

  it('de cada par validação + aplicação só fica a aplicação', () => {
    const ops = lerOperacoes([registo({ tipo: 'V', hora: 103749 }), registo({ tipo: 'A', hora: 103821 })]).operacoes;
    const r = selecionarOperacoes(ops, dia, ['nalves']);
    expect(r.selecionadas.map((o) => o.hora)).toEqual(['10:38']);
    expect(r.validacoes.map((o) => o.hora)).toEqual(['10:37']);
  });

  it('um ficheiro só validado, sem aplicação, também sai', () => {
    const ops = lerOperacoes([registo({ tipo: 'V', hora: 104248 })]).operacoes;
    const r = selecionarOperacoes(ops, dia, ['nalves']);
    expect(r.selecionadas).toEqual([]);
    expect(r.validacoes).toHaveLength(1);
  });

  it('ficheiros recebidos (só A, sem validação) contam', () => {
    const ops = lerOperacoes([registo({ ficheiro: 'RTR2611111', ref: 'RTR', modulo: 'TE', hora: 85656 })]).operacoes;
    expect(selecionarOperacoes(ops, dia, ['nalves']).selecionadas).toHaveLength(1);
  });

  it('o mesmo ficheiro aplicado duas vezes no dia fica as duas vezes (reprocessamento)', () => {
    const ops = lerOperacoes([registo({ ficheiro: 'CBE260107', hora: 90000 }), registo({ ficheiro: 'CBE260107', hora: 91500 })]).operacoes;
    expect(selecionarOperacoes(ops, dia, ['nalves']).selecionadas).toHaveLength(2);
  });
});

describe('DC: vêm da cópia da GBAPL (com nº de operação), não do log', () => {
  /** Um registo da GBAPL pela ordem conhecida, como o worker o guarda. */
  const dcRegisto = (c: Record<string, string | number> = {}) => {
    const linha: LinhaBruta = CODIGOS_GBAPL.map(() => '');
    const por: Record<string, string | number> = {
      ACEMP: 'ORD_PS2_01', ACSQAP: 1, ACFILE: 'SACERM11A', ACHORA: 103752, ACDTIN: 20261111, ACNOPR: 123456789, ACUSER: 'NALVES',
      ACNMOV: 12, ACTAPL: 12, ...c,
    };
    for (const [k, v] of Object.entries(por)) linha[CODIGOS_GBAPL.indexOf(k as (typeof CODIGOS_GBAPL)[number])] = v;
    return { data: '2026-11-11', empresa: String(por.ACEMP), seq: Number(por.ACSQAP), n_operacao: String(por.ACNOPR), linha };
  };

  it('os DC do log ignoram-se (e contam-se)', () => {
    const r = lerOperacoes([CODIGOS, registo({ modulo: 'DC' }), registo({ modulo: 'TE', ficheiro: 'RTR2611111' }), registo({ modulo: 'dc' })]);
    expect(r.operacoes.map((o) => o.ficheiro)).toEqual(['RTR2611111']);
    expect(r.dcIgnorados).toBe(2);
  });

  it('um ficheiro só com DC não dá o aviso «não há processamentos»', () => {
    expect(lerOperacoes([CODIGOS, registo({ modulo: 'DC' })]).avisos).toEqual([]);
  });

  it('operacoesDeDc: empresa, nº de operação, movimentos e aplicados', () => {
    const [o] = operacoesDeDc([dcRegisto()]);
    expect(o).toMatchObject({
      data: '2026-11-11', hora: '10:37', ficheiro: 'SACERM11A', modulo: 'DC', utilizador: 'NALVES', tipo: 'A',
      empresa: 'ORD_PS2_01', nOperacao: '123456789', movimentos: 12, aplicados: 12,
    });
  });

  it('um lote com 0 aplicados é só uma validação (tipo V) e não entra na seleção', () => {
    const ops = operacoesDeDc([dcRegisto({ ACTAPL: 0 }), dcRegisto({ ACNOPR: 123456790, ACHORA: 110000 })]);
    expect(ops.map((o) => o.tipo)).toEqual(['V', 'A']);
    const sel = selecionarOperacoes(ops, '2026-11-11', ['nalves']);
    expect(sel.selecionadas.map((o) => o.nOperacao)).toEqual(['123456790']);
    expect(sel.validacoes).toHaveLength(1);
  });

  it('um registo curto ou que não é uma lista fica de fora', () => {
    expect(operacoesDeDc([{ ...dcRegisto(), linha: [1, 2, 3] }])).toEqual([]);
  });

  it('juntar: DC e log por data e hora; a janela e os operadores aplicam-se a todos', () => {
    const log = lerOperacoes([registo({ ficheiro: 'RTR2611111', hora: 85656, user: 'NALVES' }), registo({ ficheiro: 'ETR2611112', data: 20261112, hora: 30000, user: 'NALVES' })]).operacoes;
    const dc = operacoesDeDc([
      dcRegisto({ ACHORA: 103752 }),
      { ...dcRegisto({ ACNOPR: 555, ACDTIN: 20261112, ACHORA: 123000 }), data: '2026-11-12' }, // 12/11 12:30: já é da ficha seguinte
      dcRegisto({ ACNOPR: 556, ACUSER: 'SISP', ACHORA: 140000 }),
    ]);
    const todas = juntarOperacoes(log, dc);
    expect(todas.map((o) => `${o.data} ${o.hora}`)).toEqual(['2026-11-11 08:56', '2026-11-11 10:37', '2026-11-11 14:00', '2026-11-12 03:00', '2026-11-12 12:30']);
    const sel = selecionarOperacoes(todas, '2026-11-11', ['nalves', 'etavares']);
    expect(sel.selecionadas.map((o) => o.ficheiro)).toEqual(['RTR2611111', 'SACERM11A', 'ETR2611112']);
    expect(sel.deOutros.map((o) => o.utilizador)).toEqual(['SISP']);
    expect(sel.foraDaJanela.map((o) => o.nOperacao)).toEqual(['555']);
  });

  it('o Excel tratado leva empresa, nº de operação e movimentos dos DC (e vazio nos outros)', async () => {
    const log = lerOperacoes([registo({ ficheiro: 'RTR2611111', hora: 85656 })]).operacoes;
    const todas = juntarOperacoes(log, operacoesDeDc([dcRegisto()]));
    const lido = await lerExcelAplicacoes(await (await excelDasOperacoes(todas)).arrayBuffer());
    expect(lido.colunas).toEqual([...COLUNAS_EXCEL_OPERACOES]);
    expect(lido.colunas.slice(-4)).toEqual(['Empresa', 'Nº operação', 'Movimentos', 'Aplicados']);
    const dcLinha = lido.linhas.find((l) => l[2] === 'SACERM11A');
    expect(dcLinha?.slice(-4)).toEqual(['ORD_PS2_01', 123456789, 12, 12]);
    expect(dcLinha?.[6]).toBeNull(); // sem nº de ordem
    const logLinha = lido.linhas.find((l) => l[2] === 'RTR2611111');
    expect(logLinha?.[7]).toBeNull();
  });
});
