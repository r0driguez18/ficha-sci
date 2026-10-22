import { describe, expect, it } from 'vitest';
import {
  duracaoMinutos,
  emCurso,
  formatarDuracao,
  horaAtual,
  linhasDaFicha,
  nomeCategoria,
  nomeTurno,
  resumirOcorrencias,
  somarDias,
  validarOcorrencia,
  type FormOcorrencia,
  type Ocorrencia,
} from '../ocorrencias';

const form: FormOcorrencia = {
  data: '2026-10-16',
  turno: 'turno3',
  n_avaria: 'INC-2041',
  descricao: 'Servidor BCACV1 sem resposta',
  hora_inicio: '23:15',
  hora_termino: '01:40',
  encaminhamento: 'DSI - Redes',
  categoria: 'servidores',
  sistema: 'BCACV1',
};

describe('validarOcorrencia (campos da ficha em papel)', () => {
  it('aceita um formulário completo e um mínimo (só data e descrição)', () => {
    expect(validarOcorrencia(form)).toBeNull();
    expect(
      validarOcorrencia({ ...form, turno: '', n_avaria: '', hora_inicio: '', hora_termino: '', encaminhamento: '', categoria: '', sistema: '' }),
    ).toBeNull();
  });

  it('rejeita cada campo inválido com uma mensagem', () => {
    expect(validarOcorrencia({ ...form, data: '' })).toMatch(/data/i);
    expect(validarOcorrencia({ ...form, data: '16/10/2026' })).toMatch(/data/i);
    expect(validarOcorrencia({ ...form, descricao: ' ab ' })).toMatch(/descrição/i);
    expect(validarOcorrencia({ ...form, descricao: 'x'.repeat(1001) })).toMatch(/descrição/i);
    expect(validarOcorrencia({ ...form, hora_inicio: '25:00' })).toMatch(/início/i);
    expect(validarOcorrencia({ ...form, hora_termino: '9:5' })).toMatch(/término/i);
    expect(validarOcorrencia({ ...form, n_avaria: 'x'.repeat(31) })).toMatch(/avaria/i);
    expect(validarOcorrencia({ ...form, encaminhamento: 'x'.repeat(301) })).toMatch(/encaminhamento/i);
    expect(validarOcorrencia({ ...form, sistema: 'x'.repeat(61) })).toMatch(/sistema/i);
    expect(validarOcorrencia({ ...form, categoria: 'inventada' })).toMatch(/categoria/i);
  });

  it('não deixa pôr hora de término sem hora de início', () => {
    expect(validarOcorrencia({ ...form, hora_inicio: '', hora_termino: '02:00' })).toMatch(/início/i);
  });

  it('uma avaria do Turno 3 pode acabar "antes" de começar (passa a meia-noite)', () => {
    expect(validarOcorrencia({ ...form, hora_inicio: '23:15', hora_termino: '01:40' })).toBeNull();
  });
});

describe('duração', () => {
  it('calcula os minutos, também a passar a meia-noite', () => {
    expect(duracaoMinutos('09:00', '10:25')).toBe(85);
    expect(duracaoMinutos('23:15', '01:40')).toBe(145);
    expect(duracaoMinutos('10:00', '10:00')).toBe(0);
  });
  it('sem horas válidas não há duração', () => {
    expect(duracaoMinutos(null, '10:00')).toBeNull();
    expect(duracaoMinutos('09:00', null)).toBeNull();
    expect(duracaoMinutos('9h', '10:00')).toBeNull();
  });
  it('mostra-a de forma legível', () => {
    expect(formatarDuracao(40)).toBe('40 min');
    expect(formatarDuracao(60)).toBe('1h');
    expect(formatarDuracao(85)).toBe('1h25');
    expect(formatarDuracao(125)).toBe('2h05');
    expect(formatarDuracao(null)).toBe('');
  });
});

describe('linhas da ficha em papel', () => {
  it('completa com linhas em branco até 12', () => {
    const r = linhasDaFicha([{ a: 1 }, { a: 2 }]);
    expect(r).toHaveLength(12);
    expect(r.slice(0, 2)).toEqual([{ a: 1 }, { a: 2 }]);
    expect(r.slice(2).every((x) => x === null)).toBe(true);
  });
  it('com mais de 12 não corta nenhuma', () => {
    expect(linhasDaFicha(Array.from({ length: 15 }, (_, i) => i))).toHaveLength(15);
  });
});

describe('datas e nomes', () => {
  it('somarDias passa o fim do mês e do ano', () => {
    expect(somarDias('2026-10-31', 1)).toBe('2026-11-01');
    expect(somarDias('2026-01-01', -1)).toBe('2025-12-31');
    expect(somarDias('2028-02-28', 1)).toBe('2028-02-29');
  });
  it('horaAtual devolve HH:MM', () => {
    expect(horaAtual(new Date(2026, 9, 16, 7, 5))).toBe('07:05');
  });
  it('nomes para mostrar', () => {
    expect(nomeCategoria('servidores')).toBe('Servidores e sistemas');
    expect(nomeCategoria(null)).toBe('');
    expect(nomeTurno('turno3')).toBe('Turno 3');
    expect(nomeTurno(null)).toBe('');
  });
});

const oc = (p: Partial<Ocorrencia>): Ocorrencia => ({
  id: Math.random().toString(36),
  data: '2026-10-10',
  turno: null,
  n_avaria: null,
  descricao: 'x',
  hora_inicio: '10:00',
  hora_termino: '11:00',
  encaminhamento: null,
  categoria: null,
  sistema: null,
  criada_por_codigo: 'nalves',
  criada_em: '2026-10-10T10:00:00Z',
  ...p,
});

describe('emCurso e resumirOcorrencias', () => {
  const hoje = '2026-10-20';

  it('sem hora de término está em curso', () => {
    expect(emCurso(oc({ hora_termino: null }))).toBe(true);
    expect(emCurso(oc({ hora_termino: '11:00' }))).toBe(false);
  });

  it('conta as em curso (de qualquer data)', () => {
    const r = resumirOcorrencias([oc({ hora_termino: null }), oc({ hora_termino: null, data: '2025-01-01' }), oc({})], hoje);
    expect(r.emCurso).toBe(2);
  });

  it('conta por categoria só nos últimos 90 dias e ignora as sem categoria', () => {
    const r = resumirOcorrencias(
      [
        oc({ categoria: 'rede', data: '2026-10-01' }),
        oc({ categoria: 'core', data: '2026-09-01' }),
        oc({ categoria: 'core', data: '2026-08-01' }),
        oc({ categoria: 'ficheiros', data: '2026-07-22' }), // 90 dias antes de 20/10: ainda conta
        oc({ categoria: 'seguranca', data: '2026-07-21' }), // 91 dias: fora
        oc({ categoria: null, data: '2026-10-02' }),
      ],
      hoje,
    );
    expect(r.porCategoria).toEqual([
      { chave: 'core', total: 2 },
      { chave: 'ficheiros', total: 1 },
      { chave: 'rede', total: 1 },
    ]);
  });

  it('só considera recorrentes os sistemas com 2 ou mais, sem distinguir maiúsculas', () => {
    const r = resumirOcorrencias(
      [
        oc({ sistema: 'BCACV1' }),
        oc({ sistema: 'bcacv1 ' }),
        oc({ sistema: 'SISP' }),
        oc({ sistema: null }),
        oc({ sistema: 'Vinti4', data: '2026-01-01' }), // fora do período
        oc({ sistema: 'Vinti4', data: '2026-01-02' }),
      ],
      hoje,
    );
    expect(r.recorrentes).toEqual([{ chave: 'BCACV1', total: 2 }]);
  });

  it('sem ocorrências devolve tudo a zero', () => {
    expect(resumirOcorrencias([], hoje)).toEqual({ emCurso: 0, porCategoria: [], recorrentes: [] });
  });
});
