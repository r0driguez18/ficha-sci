import { describe, expect, it } from 'vitest';
import { dataCurta, fichasPorFechar, resumirRascunho, type RascunhoBruto } from '../fichasPorFechar';

const vazio = {
  turno1: { operator: '', entrada: '', saida: '', observations: '' },
  turno2: { operator: '', entrada: '', saida: '', observations: '' },
  turno3: { operator: '', entrada: '', saida: '', observations: '' },
};

const rascunho = (p: Partial<RascunhoBruto> = {}): RascunhoBruto => ({
  form_type: 'dia-nao-util',
  date: '2026-10-18',
  turn_data: vazio,
  tasks: { turno3: { datacenter: false, sistemas: false } },
  table_rows: [{ id: 1, hora: '09:00', tarefa: '', nomeAs: '', operacao: '', executado: 'nalves', tipo: '' }],
  updated_at: '2026-10-18T22:00:00Z',
  ...p,
});

describe('resumirRascunho: o que conta como "trabalho feito"', () => {
  it('um rascunho vazio (só abriram a ficha) não conta, mesmo com a hora e o executado pré-preenchidos', () => {
    expect(resumirRascunho(rascunho())).toBeNull();
  });

  it('conta com uma tarefa marcada', () => {
    expect(resumirRascunho(rascunho({ tasks: { turno3: { datacenter: true, sistemas: true, x: 'texto' } } }))).toMatchObject({
      tarefasFeitas: 2,
      processamentos: 0,
    });
  });

  it('conta com um processamento, e ignora linhas que só têm hora/executado', () => {
    const rows = [
      { id: 1, hora: '09:00', tarefa: '', nomeAs: '', operacao: '', executado: 'nalves', tipo: '' },
      { id: 2, hora: '10:00', tarefa: 'Salários', nomeAs: '', operacao: '', executado: 'nalves', tipo: '' },
      { id: 3, hora: '', tarefa: ' ', nomeAs: '', operacao: '123456789', executado: '', tipo: '' },
    ];
    expect(resumirRascunho(rascunho({ table_rows: rows }))).toMatchObject({ processamentos: 2 });
  });

  it('conta com operador, hora ou observações preenchidos', () => {
    for (const campo of ['operator', 'entrada', 'saida', 'observations'] as const) {
      const td = { ...vazio, turno3: { ...vazio.turno3, [campo]: 'x' } };
      expect(resumirRascunho(rascunho({ turn_data: td })), campo).not.toBeNull();
    }
  });

  it('aguenta dados em falta ou com forma inesperada', () => {
    expect(resumirRascunho(rascunho({ turn_data: null, tasks: null, table_rows: null }))).toBeNull();
    expect(resumirRascunho(rascunho({ tasks: 'lixo', table_rows: 'lixo', turn_data: 5 }))).toBeNull();
  });

  it('ignora tipos de ficha desconhecidos', () => {
    expect(resumirRascunho(rascunho({ form_type: 'outro', tasks: { t: { a: true } } }))).toBeNull();
  });
});

describe('fichasPorFechar', () => {
  const feito = { turno3: { datacenter: true } };

  it('só dias anteriores a hoje (o de hoje está em curso)', () => {
    const r = fichasPorFechar(
      [rascunho({ date: '2026-10-19', tasks: feito }), rascunho({ date: '2026-10-20', tasks: feito }), rascunho({ date: '2026-10-21', tasks: feito })],
      '2026-10-20',
    );
    expect(r.map((f) => f.date)).toEqual(['2026-10-19']);
  });

  it('o caso da segunda-feira: ficha de dia não útil de domingo com trabalho + ficha vazia de sábado', () => {
    const r = fichasPorFechar(
      [
        rascunho({ date: '2026-10-17' }), // aberta e vazia: não conta
        rascunho({ date: '2026-10-18', tasks: feito }),
      ],
      '2026-10-19',
    );
    expect(r).toEqual([
      { formType: 'dia-nao-util', date: '2026-10-18', atualizadaEm: '2026-10-18T22:00:00Z', tarefasFeitas: 1, processamentos: 0 },
    ]);
  });

  it('ordena do mais antigo para o mais recente e, no mesmo dia, por tipo', () => {
    const r = fichasPorFechar(
      [
        rascunho({ date: '2026-10-18', form_type: 'dia-util', tasks: feito }),
        rascunho({ date: '2026-10-16', form_type: 'dia-util', tasks: feito }),
        rascunho({ date: '2026-10-18', form_type: 'dia-nao-util', tasks: feito }),
      ],
      '2026-10-20',
    );
    expect(r.map((f) => `${f.date} ${f.formType}`)).toEqual(['2026-10-16 dia-util', '2026-10-18 dia-nao-util', '2026-10-18 dia-util']);
  });

  it('sem rascunhos devolve lista vazia', () => {
    expect(fichasPorFechar([], '2026-10-20')).toEqual([]);
  });
});

describe('dataCurta', () => {
  it('AAAA-MM-DD → DD/MM/AAAA', () => expect(dataCurta('2026-10-18')).toBe('18/10/2026'));
});
