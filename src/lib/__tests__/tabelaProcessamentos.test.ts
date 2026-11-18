import { describe, expect, it } from 'vitest';
import { linhasParaTabela } from '../tabelaProcessamentos';
import type { OperacaoAplicada } from '../aplicacoesDia';
import type { TaskTableRow } from '@/types/taskTableRow';

const op = (c: Partial<OperacaoAplicada> = {}): OperacaoAplicada => ({
  data: '2026-11-18', hora: '14:39', ficheiro: 'INP2611181', referencia: '', modulo: 'DC', utilizador: 'NALVES', tipo: 'A', nOrdem: '',
  empresa: 'INPS', nOperacao: '584447214', movimentos: 5, aplicados: 5, ...c,
});
const linha = (c: Partial<TaskTableRow> = {}): TaskTableRow => ({ id: 1, hora: '10:00', tarefa: '', nomeAs: '', operacao: '', executado: 'nalves', tipo: '', ...c });
const OPERADORES = ['nalves', 'etavares'];
const doLog = (c: Partial<OperacaoAplicada>) => op({ empresa: undefined, nOperacao: undefined, ...c });

describe('das aplicações para a tabela de Processamentos', () => {
  it('uma operação nova vira uma linha completa, com o tipo e o executante certos', () => {
    const { novas, jaExistiam } = linhasParaTabela([op()], [], OPERADORES);
    expect(jaExistiam).toBe(0);
    expect(novas).toEqual([{ hora: '14:39', tarefa: '', nomeAs: 'INP2611181', operacao: '584447214', executado: 'nalves', tipo: 'cobrancas', origem: 'core' }]);
  });

  it('o tipo vem da regra: SP é SISP, TE/CD é compensação, DC fora da lista é salário', () => {
    const { novas } = linhasParaTabela(
      [doLog({ modulo: 'SP', ficheiro: 'ECI2611181', nOrdem: '9' }), doLog({ modulo: 'TE', ficheiro: 'RTR2611181', nOrdem: '8' }), op({ empresa: 'ORD_PS2_01', ficheiro: 'SACMF11A' })],
      [],
      OPERADORES,
    );
    expect(Object.fromEntries(novas.map((n) => [n.nomeAs, n.tipo]))).toEqual({ ECI2611181: 'sisp', RTR2611181: 'compensacao', SACMF11A: 'salario' });
  });

  it('o que já está escrito à mão não se repete (a linha da pessoa fica como está)', () => {
    const feita = linha({ id: 3, nomeAs: 'inp2611181', operacao: '584447214', tarefa: 'Cobrança INPS', tipo: 'cobrancas' });
    const { novas, jaExistiam } = linhasParaTabela([op(), op({ ficheiro: 'SACMF11A', empresa: 'ORD_PS2_01', nOperacao: '5' })], [feita], OPERADORES);
    expect(jaExistiam).toBe(1);
    expect(novas.map((n) => n.nomeAs)).toEqual(['SACMF11A']);
  });

  it('uma linha à mão sem nº de operação também conta como o mesmo ficheiro', () => {
    expect(linhasParaTabela([op()], [linha({ nomeAs: 'INP2611181', tarefa: 'x' })], OPERADORES).novas).toEqual([]);
  });

  it('com nº de operação diferente, é outra operação do mesmo ficheiro', () => {
    const { novas } = linhasParaTabela([op({ nOperacao: '2' })], [linha({ nomeAs: 'INP2611181', operacao: '1' })], OPERADORES);
    expect(novas).toHaveLength(1);
  });

  it('correr duas vezes não duplica (inclusive o mesmo ficheiro aplicado duas vezes e linhas sem ficheiro)', () => {
    const ops = [op(), op({ hora: '15:00', nOperacao: '584447999' }), doLog({ ficheiro: '', referencia: 'BEN', modulo: 'EC', nOrdem: '7', hora: '09:00' })];
    const primeira = linhasParaTabela(ops, [], OPERADORES);
    expect(primeira.novas).toHaveLength(3);
    const tabela = primeira.novas.map((n, i) => ({ ...n, id: i + 1 }));
    const segunda = linhasParaTabela(ops, tabela, OPERADORES);
    expect(segunda.novas).toEqual([]);
    expect(segunda.jaExistiam).toBe(3);
  });

  it('o mesmo ficheiro aplicado duas vezes, com uma só linha à mão: falta uma', () => {
    const ops = [op(), op({ hora: '15:00', nOperacao: '584447999' })];
    expect(linhasParaTabela(ops, [linha({ nomeAs: 'INP2611181' })], OPERADORES).novas).toHaveLength(1);
  });

  it('as linhas novas vêm por ordem de hora', () => {
    const { novas } = linhasParaTabela([op({ hora: '16:00', ficheiro: 'B' }), op({ hora: '08:00', ficheiro: 'A' })], [], OPERADORES);
    expect(novas.map((n) => n.nomeAs)).toEqual(['A', 'B']);
  });

  it('a «Tarefa» fica sempre vazia nas linhas do core', () => {
    const { novas } = linhasParaTabela([op(), doLog({ ficheiro: '', referencia: 'BEN', modulo: 'EC', nOrdem: '7' })], [], OPERADORES);
    expect(novas.every((n) => n.tarefa === '' && n.origem === 'core')).toBe(true);
  });

  it('um executante que não está na lista fica em minúsculas', () => {
    expect(linhasParaTabela([op({ utilizador: 'XPTO' })], [], OPERADORES).novas[0].executado).toBe('xpto');
  });

  it('o nome do ficheiro escrito na «Tarefa» também conta (é onde se escreve à mão)', () => {
    const manual = [linha({ tarefa: 'ECI2611181', tipo: '' }), linha({ id: 2, tarefa: 'Aplicação ERI2611181 (ok)' })];
    const ops = [doLog({ modulo: 'SP', ficheiro: 'ECI2611181', nOrdem: '1' }), doLog({ modulo: 'CD', ficheiro: 'ERI2611181', nOrdem: '2' }), doLog({ modulo: 'TE', ficheiro: 'ETR2611182', nOrdem: '3' })];
    const r = linhasParaTabela(ops, manual, OPERADORES);
    expect(r.jaExistiam).toBe(2);
    expect(r.novas.map((n) => n.nomeAs)).toEqual(['ETR2611182']);
    expect(r.manuaisSemCorrespondencia).toBe(0);
  });

  it('um ficheiro com o nome parecido na Tarefa não conta (só a palavra inteira)', () => {
    const r = linhasParaTabela([doLog({ modulo: 'SP', ficheiro: 'ECI261118', nOrdem: '1' })], [linha({ tarefa: 'ECI2611181' })], OPERADORES);
    expect(r.novas).toHaveLength(1);
    expect(r.manuaisSemCorrespondencia).toBe(1);
  });

  it('conta as linhas à mão sem correspondência (e não as do core nem as vazias)', () => {
    const existentes = [
      linha({ id: 1, tarefa: 'Envio de impostos', tipo: 'salario' }), // à mão, sem ficheiro do core
      linha({ id: 2, nomeAs: 'INP2611181', operacao: '584447214' }), // corresponde
      linha({ id: 3, nomeAs: 'X', origem: 'core' }), // veio do core: não conta
      linha({ id: 4 }), // vazia: não conta
    ];
    const r = linhasParaTabela([op()], existentes, OPERADORES);
    expect(r.jaExistiam).toBe(1);
    expect(r.manuaisSemCorrespondencia).toBe(1);
  });
});
