import { describe, expect, it } from 'vitest';
import { linkPublico, manipular, normalizarEmail, normalizarNome, normalizarUtilizador } from './index';

const amb = { supabaseUrl: 'http://kong:8000', serviceKey: 'SK' };

interface Op {
  id: string;
  value: string;
  nome: string;
  papel: 'administrador' | 'operador';
  ativo: boolean;
  user_id: string | null;
}

/** Supabase simulado com 3 contas: admin (u1, o chamador), outro admin (u2) e um operador (u3). */
function montar(opts: { papelChamador?: 'administrador' | 'operador'; soUmAdmin?: boolean } = {}) {
  const contas = [
    { id: 'u1', email: 'nalves@bca.cv', created_at: '2026-01-01', user_metadata: { name: 'Nelson' } },
    { id: 'u2', email: 'ebrito@bca.cv', created_at: '2026-01-01', user_metadata: { name: 'Elvis' } },
    { id: 'u3', email: 'etavares@bca.cv', created_at: '2026-01-01', user_metadata: { name: 'Edson' } },
  ];
  const ops: Op[] = [
    { id: 'o1', value: 'nalves', nome: 'Nelson', papel: opts.papelChamador ?? 'administrador', ativo: true, user_id: 'u1' },
    { id: 'o2', value: 'ebrito', nome: 'Elvis', papel: opts.soUmAdmin ? 'operador' : 'administrador', ativo: true, user_id: 'u2' },
    { id: 'o3', value: 'etavares', nome: 'Edson', papel: 'operador', ativo: true, user_id: 'u3' },
  ];
  const chamadas: { metodo: string; url: string; corpo: any; ator?: string }[] = [];

  const fake = async (url: string, init: RequestInit = {}) => {
    const metodo = init.method ?? 'GET';
    const corpo = init.body ? JSON.parse(String(init.body)) : null;
    chamadas.push({ metodo, url, corpo, ator: (init.headers as Record<string, string> | undefined)?.['x-sci-ator'] });
    const json = (v: unknown, s = 200) => new Response(v === null ? null : JSON.stringify(v), { status: s });
    if (url.endsWith('/auth/v1/user')) return json({ id: 'u1' });
    if (url.includes('/auth/v1/admin/users?')) return json({ users: contas });
    if (url.includes('/auth/v1/admin/users/') && metodo === 'PUT') return json({ id: 'x' });
    if (url.includes('/auth/v1/admin/users/') && metodo === 'DELETE') return json(null, 204);
    if (url.includes('/rest/v1/reposicoes_senha') || url.includes('/rest/v1/registo_alteracoes')) return new Response(null, { status: 201 });
    if (url.includes('/rest/v1/operators')) {
      const q = new URL(url).searchParams;
      if (metodo === 'PATCH') return new Response(null, { status: 204 });
      let r = ops;
      const uid = q.get('user_id');
      if (uid?.startsWith('eq.')) r = r.filter((o) => o.user_id === uid.slice(3));
      if (q.get('papel') === 'eq.administrador') r = r.filter((o) => o.papel === 'administrador');
      if (q.get('ativo') === 'eq.true') r = r.filter((o) => o.ativo);
      const naoId = q.get('id');
      if (naoId?.startsWith('neq.')) r = r.filter((o) => o.id !== naoId.slice(4));
      if (q.get('user_id') === 'not.is.null') r = r.filter((o) => o.user_id);
      return json(r);
    }
    throw new Error(`inesperado ${metodo} ${url}`);
  };

  const pedir = async (corpo: unknown, auth: string | null = 'Bearer tk') => {
    const headers: Record<string, string> = { origin: 'https://sci.exemplo' };
    if (auth) headers.authorization = auth;
    const r = await manipular(new Request('http://x/f', { method: 'POST', headers, body: JSON.stringify(corpo) }), amb, fake as never);
    return { estado: r.status, corpo: (await r.json().catch(() => null)) as any };
  };
  return { pedir, chamadas };
}

describe('admin-utilizadores: acesso', () => {
  it('sem sessão → 401; operador normal → 403', async () => {
    expect((await montar().pedir({ acao: 'listar' }, null)).estado).toBe(401);
    expect((await montar({ papelChamador: 'operador' }).pedir({ acao: 'listar' })).estado).toBe(403);
  });

  it('ação desconhecida → 400', async () => {
    expect((await montar().pedir({ acao: 'apagar-tudo' })).estado).toBe(400);
  });

  it('um operador normal não consegue nenhuma ação, nem eliminar', async () => {
    const { pedir, chamadas } = montar({ papelChamador: 'operador' });
    for (const acao of ['eliminar', 'repor', 'papel', 'criar', 'novo-link']) {
      const r = await pedir({ acao, conta: 'etavares@bca.cv', administrador: true });
      expect(r.estado, acao).toBe(403);
    }
    expect(chamadas.some((c) => ['PUT', 'DELETE', 'PATCH'].includes(c.metodo))).toBe(false);
  });
});

describe('admin-utilizadores: listar', () => {
  it('marca como eliminável só quem não sou eu e não é administrador', async () => {
    const r = await montar().pedir({ acao: 'listar' });
    const por = Object.fromEntries(r.corpo.utilizadores.map((u: any) => [u.utilizador, u]));
    expect(por.nalves).toMatchObject({ eu: true, administrador: true, eliminavel: false });
    expect(por.ebrito).toMatchObject({ administrador: true, eliminavel: false });
    expect(por.etavares).toMatchObject({ administrador: false, eliminavel: true });
  });
});

describe('admin-utilizadores: eliminar', () => {
  it('elimina um operador normal', async () => {
    const { pedir, chamadas } = montar();
    const r = await pedir({ acao: 'eliminar', conta: 'etavares@bca.cv' });
    expect(r.estado).toBe(200);
    expect(chamadas.some((c) => c.metodo === 'DELETE' && c.url.includes('/u3'))).toBe(true);
  });

  it('não elimina a própria conta nem a de um administrador', async () => {
    const m1 = montar();
    const propria = await m1.pedir({ acao: 'eliminar', conta: 'nalves@bca.cv' });
    expect(propria.estado).toBe(409);
    expect(propria.corpo.erro).toMatch(/própria conta/);
    const m2 = montar();
    const outroAdmin = await m2.pedir({ acao: 'eliminar', conta: 'ebrito@bca.cv' });
    expect(outroAdmin.estado).toBe(409);
    expect(outroAdmin.corpo.erro).toMatch(/administrador/);
    for (const m of [m1, m2]) expect(m.chamadas.some((c) => c.metodo === 'DELETE')).toBe(false);
  });

  it('conta inexistente → 404', async () => {
    expect((await montar().pedir({ acao: 'eliminar', conta: 'fantasma@bca.cv' })).estado).toBe(404);
  });
});

describe('admin-utilizadores: repor senha', () => {
  it('repõe com senha temporária e obriga a trocar; regista quem fez', async () => {
    const { pedir, chamadas } = montar();
    const r = await pedir({ acao: 'repor', conta: 'etavares@bca.cv' });
    expect(r.estado).toBe(200);
    expect(r.corpo.senhaTemporaria).toMatch(/^[A-Za-z0-9]{12}$/);
    const put = chamadas.find((c) => c.metodo === 'PUT')!;
    expect(put.corpo.user_metadata).toEqual({ must_change_password: true });
    expect(chamadas.find((c) => c.url.includes('reposicoes_senha'))!.corpo).toMatchObject({ metodo: 'admin', feito_por: 'u1' });
  });

  it('não repõe a própria senha (pede-se a outro administrador)', async () => {
    const { pedir, chamadas } = montar();
    expect((await pedir({ acao: 'repor', conta: 'nalves@bca.cv' })).estado).toBe(409);
    expect(chamadas.some((c) => c.metodo === 'PUT')).toBe(false);
  });
});

describe('admin-utilizadores: papel de administrador', () => {
  it('promove um operador', async () => {
    const { pedir, chamadas } = montar();
    const r = await pedir({ acao: 'papel', conta: 'etavares@bca.cv', administrador: true });
    expect(r.estado).toBe(200);
    expect(chamadas.find((c) => c.metodo === 'PATCH')!.corpo).toEqual({ papel: 'administrador' });
  });

  it('retira o papel a outro administrador se sobrar pelo menos um', async () => {
    const { pedir, chamadas } = montar();
    expect((await pedir({ acao: 'papel', conta: 'ebrito@bca.cv', administrador: false })).estado).toBe(200);
    expect(chamadas.some((c) => c.metodo === 'PATCH')).toBe(true);
  });

  it('nunca deixa o sistema sem administrador', async () => {
    const { pedir, chamadas } = montar({ soUmAdmin: true });
    const r = await pedir({ acao: 'papel', conta: 'nalves@bca.cv', administrador: false });
    expect(r.estado).toBe(409);
    expect(chamadas.some((c) => c.metodo === 'PATCH')).toBe(false);
  });

  it('exige um booleano', async () => {
    expect((await montar().pedir({ acao: 'papel', conta: 'etavares@bca.cv', administrador: 'sim' })).estado).toBe(400);
  });
});

describe('admin-utilizadores: registo de alterações', () => {
  const registos = (m: ReturnType<typeof montar>) =>
    m.chamadas.filter((c) => c.url.includes('/rest/v1/registo_alteracoes')).map((c) => c.corpo);

  it('eliminar e repor senha ficam registados com o administrador que os fez', async () => {
    const m = montar();
    await m.pedir({ acao: 'eliminar', conta: 'etavares@bca.cv' });
    await m.pedir({ acao: 'repor', conta: 'etavares@bca.cv' });
    expect(registos(m).map((r) => [r.operador, r.registo_id, r.resumo])).toEqual([
      ['nalves', 'etavares@bca.cv', 'Conta eliminada (etavares)'],
      ['nalves', 'etavares@bca.cv', expect.stringContaining('Senha reposta')],
    ]);
  });

  it('as escritas na base levam o cabeçalho do ator (para os gatilhos de auditoria)', async () => {
    const m = montar();
    await m.pedir({ acao: 'papel', conta: 'etavares@bca.cv', administrador: true });
    expect(m.chamadas.find((c) => c.metodo === 'PATCH')!.ator).toBe('nalves');
  });

  it('uma ação recusada não deixa registo', async () => {
    const m = montar();
    await m.pedir({ acao: 'eliminar', conta: 'nalves@bca.cv' });
    expect(registos(m)).toEqual([]);
  });
});

describe('validação de entradas', () => {
  it('email, nome e utilizador', () => {
    expect(normalizarEmail(' A@B.com ')).toBe('a@b.com');
    expect(() => normalizarEmail('sem-arroba')).toThrow();
    expect(normalizarNome('  Nelson   Alves ')).toBe('Nelson Alves');
    expect(() => normalizarNome('x')).toThrow();
    expect(normalizarUtilizador('NAlves')).toBe('nalves');
    for (const mau of ['ab', '1abc', 'a@b', 'x'.repeat(21)]) expect(() => normalizarUtilizador(mau), mau).toThrow();
  });

  it('o link de acesso usa o endereço público, não o interno', () => {
    const interno = 'http://kong:8000/auth/v1/verify?token=abc&type=recovery&redirect_to=x';
    expect(linkPublico(interno, 'https://172.20.11.54:8443/')).toBe(
      'https://172.20.11.54:8443/auth/v1/verify?token=abc&type=recovery&redirect_to=x',
    );
    expect(() => linkPublico('http://kong:8000/outra/coisa', 'https://x')).toThrow();
  });
});
