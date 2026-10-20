import { describe, expect, it } from 'vitest';
import {
  nomeCategoria,
  nomeGravidade,
  nomeTurno,
  resumirOcorrencias,
  validarOcorrencia,
  type FormOcorrencia,
  type Ocorrencia,
} from '../ocorrencias';

const form: FormOcorrencia = {
  data: '2026-10-16',
  hora: '23:15',
  turno: 'turno3',
  categoria: 'servidores',
  gravidade: 'alta',
  sistema: 'BCACV1',
  titulo: 'Replicação parada',
  descricao: 'Sem resposta do servidor',
};

describe('validarOcorrencia', () => {
  it('aceita um formulário completo e um mínimo (sem hora, turno, sistema nem descrição)', () => {
    expect(validarOcorrencia(form)).toBeNull();
    expect(validarOcorrencia({ ...form, hora: '', turno: '', sistema: '', descricao: '' })).toBeNull();
  });

  it('rejeita cada campo inválido com uma mensagem', () => {
    expect(validarOcorrencia({ ...form, data: '' })).toMatch(/data/i);
    expect(validarOcorrencia({ ...form, data: '16/10/2026' })).toMatch(/data/i);
    expect(validarOcorrencia({ ...form, hora: '25:00' })).toMatch(/hora/i);
    expect(validarOcorrencia({ ...form, hora: '9:5' })).toMatch(/hora/i);
    expect(validarOcorrencia({ ...form, categoria: '' })).toMatch(/categoria/i);
    expect(validarOcorrencia({ ...form, categoria: 'inventada' })).toMatch(/categoria/i);
    expect(validarOcorrencia({ ...form, gravidade: 'critica' })).toMatch(/gravidade/i);
    expect(validarOcorrencia({ ...form, titulo: ' ab ' })).toMatch(/título/i);
    expect(validarOcorrencia({ ...form, titulo: 'x'.repeat(121) })).toMatch(/título/i);
    expect(validarOcorrencia({ ...form, sistema: 'x'.repeat(61) })).toMatch(/sistema/i);
    expect(validarOcorrencia({ ...form, descricao: 'x'.repeat(2001) })).toMatch(/descrição/i);
  });
});

describe('nomes para mostrar', () => {
  it('traduz os valores e devolve o próprio valor se for desconhecido', () => {
    expect(nomeCategoria('servidores')).toBe('Servidores e sistemas');
    expect(nomeCategoria('x')).toBe('x');
    expect(nomeGravidade('alta')).toBe('Alta');
    expect(nomeTurno('turno3')).toBe('Turno 3');
    expect(nomeTurno(null)).toBe('');
  });
});

const oc = (p: Partial<Ocorrencia>): Ocorrencia => ({
  id: Math.random().toString(36),
  data: '2026-10-10',
  hora: null,
  turno: null,
  categoria: 'core',
  gravidade: 'media',
  sistema: null,
  titulo: 'x',
  descricao: null,
  estado: 'aberta',
  resolucao: null,
  criada_por_codigo: 'nalves',
  criada_em: '2026-10-10T10:00:00Z',
  resolvida_por_codigo: null,
  resolvida_em: null,
  ...p,
});

describe('resumirOcorrencias', () => {
  const hoje = '2026-10-20';

  it('conta as abertas e as de gravidade alta (só entre as abertas)', () => {
    const r = resumirOcorrencias(
      [
        oc({ gravidade: 'alta' }),
        oc({ gravidade: 'alta', estado: 'resolvida' }),
        oc({ gravidade: 'baixa' }),
      ],
      hoje,
    );
    expect(r.abertas).toBe(2);
    expect(r.abertasAltas).toBe(1);
  });

  it('conta por categoria só nos últimos 90 dias, da mais frequente para a menos', () => {
    const r = resumirOcorrencias(
      [
        oc({ categoria: 'rede', data: '2026-10-01' }),
        oc({ categoria: 'core', data: '2026-09-01' }),
        oc({ categoria: 'core', data: '2026-08-01' }),
        oc({ categoria: 'ficheiros', data: '2026-07-22' }), // 90 dias antes de 20/10 → ainda conta
        oc({ categoria: 'seguranca', data: '2026-07-21' }), // 91 dias → fora
      ],
      hoje,
    );
    expect(r.porCategoria).toEqual([
      { chave: 'core', total: 2 },
      { chave: 'ficheiros', total: 1 },
      { chave: 'rede', total: 1 },
    ]);
  });

  it('só considera recorrentes os sistemas com 2 ou mais ocorrências, sem distinguir maiúsculas', () => {
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
    expect(resumirOcorrencias([], hoje)).toEqual({ abertas: 0, abertasAltas: 0, porCategoria: [], recorrentes: [] });
  });
});
