import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

import { descreverAlteracoes, mostrarValor, proximoDia } from '../registoAlteracoesService';

describe('registo de alterações: apresentação', () => {
  it('proximoDia dá o limite superior exclusivo do filtro "até"', () => {
    expect(proximoDia('2026-10-16')).toBe('2026-10-17');
    expect(proximoDia('2026-10-31')).toBe('2026-11-01');
    expect(proximoDia('2026-12-31')).toBe('2027-01-01');
    expect(proximoDia('2028-02-28')).toBe('2028-02-29');
  });

  it('mostrarValor torna legíveis os valores nulos, vazios e booleanos', () => {
    expect(mostrarValor(null)).toBe('—');
    expect(mostrarValor(undefined)).toBe('—');
    expect(mostrarValor('')).toBe('(vazio)');
    expect(mostrarValor('ACME')).toBe('ACME');
    expect(mostrarValor(true)).toBe('sim');
    expect(mostrarValor(false)).toBe('não');
    expect(mostrarValor(12.5)).toBe('12.5');
  });

  it('um UPDATE mostra "campo: de → para"', () => {
    expect(
      descreverAlteracoes({
        operacao: 'UPDATE',
        alteracoes: { empresa: { de: 'ACME', para: 'ACME Lda' }, estado: { de: 'por_verificar', para: 'verificado' } },
      }),
    ).toEqual(['empresa: ACME → ACME Lda', 'estado: por_verificar → verificado']);
  });

  it('criado/apagado mostra os campos principais', () => {
    expect(descreverAlteracoes({ operacao: 'INSERT', alteracoes: { nome: 'Edson', ativo: true } })).toEqual([
      'nome: Edson',
      'ativo: sim',
    ]);
  });

  it('sem alterações devolve lista vazia', () => {
    expect(descreverAlteracoes({ operacao: 'UPDATE', alteracoes: {} })).toEqual([]);
  });
});
