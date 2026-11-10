import { describe, expect, it } from 'vitest';
import { coincidenciasDosLotes } from '../coincidenciasLotes';
import type { Ps2Lote } from '@/services/ps2LotesService';

const lote = (id: string, criado: string, extra: Partial<Ps2Lote> = {}): Ps2Lote => ({
  id,
  created_at: criado,
  gerado_por_codigo: 'A',
  nome_ficheiro: `f${id}.txt`,
  empresa: 'Emp',
  conta_empresa: '000300001234567810176',
  tipo_operacao: 'Ordenado',
  sentido: 'debito',
  data_processamento: criado.slice(0, 10),
  total: 1000,
  n_registos: 5,
  hash_ficheiro: `h${id}`,
  estado: 'por_verificar',
  verificado_por_codigo: null,
  verificado_em: null,
  contagem: null,
  mesma_pessoa: null,
  observacoes: null,
  ...extra,
});

describe('coincidências entre ficheiros PS2', () => {
  it('mesmo valor na mesma conta dentro da janela coincide, dos dois lados', () => {
    const m = coincidenciasDosLotes([lote('1', '2026-11-02T10:00:00Z'), lote('2', '2026-11-05T09:00:00Z')], 5);
    expect(m.get('1')?.[0].lote.id).toBe('2');
    expect(m.get('2')?.[0].lote.id).toBe('1');
    expect(m.get('1')?.[0].mesmosRegistos).toBe(true);
  });
  it('um mês depois (folha mensal normal) não coincide', () => {
    const m = coincidenciasDosLotes([lote('1', '2026-10-05T10:00:00Z'), lote('2', '2026-11-05T10:00:00Z')], 5);
    expect(m.size).toBe(0);
  });
  it('fora da janela não coincide; com janela maior coincide', () => {
    const l = [lote('1', '2026-11-01T10:00:00Z'), lote('2', '2026-11-07T10:00:00Z')];
    expect(coincidenciasDosLotes(l, 5).size).toBe(0);
    expect(coincidenciasDosLotes(l, 7).size).toBe(2);
  });
  it('valor, conta ou sentido diferentes não coincidem', () => {
    const l = [
      lote('1', '2026-11-02T10:00:00Z'),
      lote('2', '2026-11-03T10:00:00Z', { total: 1000.5 }),
      lote('3', '2026-11-03T10:00:00Z', { conta_empresa: '000300009999999910176' }),
      lote('4', '2026-11-03T10:00:00Z', { sentido: 'credito' }),
    ];
    expect(coincidenciasDosLotes(l, 5).size).toBe(0);
  });
  it('o mesmo conteúdo coincide sempre, mesmo fora da janela', () => {
    const m = coincidenciasDosLotes(
      [lote('1', '2026-09-01T10:00:00Z', { hash_ficheiro: 'x' }), lote('2', '2026-11-05T10:00:00Z', { hash_ficheiro: 'x' })],
      3,
    );
    expect(m.get('1')?.[0].motivo).toBe('mesmo-conteudo');
  });
});
