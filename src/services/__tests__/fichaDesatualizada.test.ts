import { beforeEach, describe, expect, it, vi } from 'vitest';

// O serviço importa hooks do React e o cliente do Supabase: simula-se o cliente.
const respostas: Record<string, { data: unknown; error: unknown }> = {};
const filtros: Record<string, Record<string, unknown>> = {};

vi.mock('@/integrations/supabase/client', () => {
  const consulta = (tabela: string) => {
    const f: Record<string, unknown> = {};
    filtros[tabela] = f;
    const q: any = {
      select: () => q,
      eq: (c: string, v: unknown) => ((f[c] = v), q),
      gt: (c: string, v: unknown) => ((f[`${c}>`] = v), q),
      order: () => q,
      limit: () => q,
      then: (ok: (v: unknown) => unknown) => Promise.resolve(respostas[tabela] ?? { data: [], error: null }).then(ok),
    };
    return q;
  };
  return { supabase: { from: consulta } };
});
vi.mock('@/components/auth/AuthProvider', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/hooks/useSyncStatus', () => ({ useSyncStatus: () => ({ report: () => {}, clear: () => {} }) }));
vi.mock('@/components/ui/use-toast', () => ({ toast: () => {} }));

import { clearTaskboardLocalDraft, taskboardLocalPrefix, verificarFichaDesatualizada } from '../taskboardService';

beforeEach(() => {
  for (const k of Object.keys(respostas)) delete respostas[k];
  for (const k of Object.keys(filtros)) delete filtros[k];
});

describe('verificarFichaDesatualizada', () => {
  it('ficha em vigor → null', async () => {
    expect(await verificarFichaDesatualizada('dia-util', '2026-10-16')).toBeNull();
  });

  it('data já exportada → "exportada" (e a pergunta é por tipo de ficha e data)', async () => {
    respostas.exported_taskboards = { data: [{ id: 'x' }], error: null };
    expect(await verificarFichaDesatualizada('dia-util', '2026-10-16')).toEqual({ tipo: 'exportada' });
    expect(filtros.exported_taskboards).toMatchObject({ form_type: 'dia-util', date: '2026-10-16' });
  });

  it('rascunho de data posterior → "mais-recente" com essa data (só do mesmo tipo de ficha)', async () => {
    respostas.taskboard_data = { data: [{ date: '2026-10-18' }], error: null };
    expect(await verificarFichaDesatualizada('dia-nao-util', '2026-10-16')).toEqual({
      tipo: 'mais-recente',
      data: '2026-10-18',
    });
    expect(filtros.taskboard_data).toMatchObject({ form_type: 'dia-nao-util', 'date>': '2026-10-16' });
  });

  it('exportada ganha a "mais-recente"', async () => {
    respostas.exported_taskboards = { data: [{ id: 'x' }], error: null };
    respostas.taskboard_data = { data: [{ date: '2026-10-18' }], error: null };
    expect(await verificarFichaDesatualizada('dia-util', '2026-10-16')).toEqual({ tipo: 'exportada' });
  });

  it('se a consulta falhar não bloqueia o trabalho (falha aberta)', async () => {
    respostas.exported_taskboards = { data: null, error: { message: 'rede' } };
    respostas.taskboard_data = { data: null, error: { message: 'rede' } };
    expect(await verificarFichaDesatualizada('dia-util', '2026-10-16')).toBeNull();
  });
});

describe('rascunho local', () => {
  it('cada tipo de ficha tem o seu prefixo e o seu rascunho', () => {
    expect(taskboardLocalPrefix('dia-util')).not.toBe(taskboardLocalPrefix('dia-nao-util'));
  });

  it('clearTaskboardLocalDraft limpa só o tipo pedido', () => {
    const guardado = new Map<string, string>();
    const antes = (globalThis as any).localStorage;
    (globalThis as any).localStorage = {
      getItem: (k: string) => guardado.get(k) ?? null,
      setItem: (k: string, v: string) => void guardado.set(k, v),
      removeItem: (k: string) => void guardado.delete(k),
    };
    try {
      for (const t of ['dia-util', 'dia-nao-util'] as const) {
        const p = taskboardLocalPrefix(t);
        for (const k of ['date', 'turnData', 'tasks', 'tableRows', 'activeTab']) guardado.set(`${p}-${k}`, 'x');
      }
      clearTaskboardLocalDraft('dia-util');
      expect([...guardado.keys()].every((k) => k.startsWith(taskboardLocalPrefix('dia-nao-util')))).toBe(true);
      expect(guardado.size).toBe(5);
    } finally {
      (globalThis as any).localStorage = antes;
    }
  });
});
