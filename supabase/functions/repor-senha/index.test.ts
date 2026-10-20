import { describe, expect, it } from 'vitest';
import { contaDoUtilizador, manipular } from './index';

const amb = { supabaseUrl: 'http://kong:8000', serviceKey: 'SK' };

interface Cenario {
  contas?: { id: string; email: string }[];
  veredicto?: string;
  listaEstado?: number;
}

/** Supabase simulado: guarda as chamadas para os testes verificarem o que aconteceu. */
function montar(c: Cenario = {}) {
  const chamadas: { metodo: string; url: string; corpo: any }[] = [];
  const contas = c.contas ?? [{ id: 'u1', email: 'nalves@bca.cv' }];
  const fake = async (url: string, init: RequestInit = {}) => {
    const metodo = init.method ?? 'GET';
    const corpo = init.body ? JSON.parse(String(init.body)) : null;
    chamadas.push({ metodo, url, corpo });
    const json = (v: unknown, s = 200) => new Response(v === null ? null : JSON.stringify(v), { status: s });
    if (url.includes('/auth/v1/admin/users?')) return json({ users: contas }, c.listaEstado ?? 200);
    if (url.includes('/rpc/tentar_pin_reposicao')) return json(c.veredicto ?? 'ok');
    if (url.includes('/auth/v1/admin/users/') && metodo === 'PUT') return json({ id: 'u1' });
    if (url.includes('/rest/v1/reposicoes_senha')) return new Response(null, { status: 201 });
    throw new Error(`inesperado ${metodo} ${url}`);
  };
  const pedir = async (corpo: unknown, a = amb, metodo = 'POST') => {
    const r = await manipular(
      new Request('http://x/f', { method: metodo, body: metodo === 'POST' ? JSON.stringify(corpo) : undefined }),
      a,
      fake as never,
    );
    return { estado: r.status, corpo: (await r.json().catch(() => null)) as any };
  };
  return { pedir, chamadas };
}

const valido = { utilizador: 'nalves', pin: '1234', novaSenha: 'senha-nova-123' };

describe('repor-senha: caminho feliz', () => {
  it('repõe a senha, tira a troca obrigatória e regista o método "pin"', async () => {
    const { pedir, chamadas } = montar();
    const r = await pedir(valido);
    expect(r).toEqual({ estado: 200, corpo: { ok: true } });
    const put = chamadas.find((x) => x.metodo === 'PUT')!;
    expect(put.corpo).toEqual({ password: 'senha-nova-123', user_metadata: { must_change_password: false } });
    expect(chamadas.find((x) => x.url.includes('reposicoes_senha'))!.corpo).toEqual({ user_id: 'u1', metodo: 'pin' });
  });

  it('aceita o email completo e maiúsculas', async () => {
    const { pedir } = montar();
    expect((await pedir({ ...valido, utilizador: 'NAlves@BCA.cv' })).estado).toBe(200);
  });
});

describe('repor-senha: não revela se o utilizador existe nem se tem PIN', () => {
  it('utilizador inexistente, PIN errado e sem PIN dão a MESMA resposta', async () => {
    const inexistente = await montar().pedir({ ...valido, utilizador: 'ninguem' });
    const errado = await montar({ veredicto: 'pin_errado' }).pedir(valido);
    const semPin = await montar({ veredicto: 'sem_pin' }).pedir(valido);
    expect(inexistente.estado).toBe(400);
    expect(errado).toEqual(inexistente);
    expect(semPin).toEqual(inexistente);
  });

  it('nunca altera a senha quando o PIN não é "ok"', async () => {
    for (const veredicto of ['pin_errado', 'sem_pin', 'bloqueado', 'qualquer-coisa']) {
      const { pedir, chamadas } = montar({ veredicto });
      await pedir(valido);
      expect(chamadas.some((x) => x.metodo === 'PUT'), veredicto).toBe(false);
    }
  });

  it('conta bloqueada (5 falhas em 24 h) → 429', async () => {
    const r = await montar({ veredicto: 'bloqueado' }).pedir(valido);
    expect(r.estado).toBe(429);
  });
});

describe('repor-senha: validação do pedido', () => {
  it('PIN tem de ter 4 dígitos', async () => {
    for (const pin of ['123', '12345', 'abcd', '', '12 4']) {
      const r = await montar().pedir({ ...valido, pin });
      expect(r.estado, pin).toBe(400);
    }
  });

  it('senha nova entre 8 e 72 caracteres', async () => {
    expect((await montar().pedir({ ...valido, novaSenha: '1234567' })).estado).toBe(400);
    expect((await montar().pedir({ ...valido, novaSenha: 'x'.repeat(73) })).estado).toBe(400);
    expect((await montar().pedir({ ...valido, novaSenha: 'x'.repeat(72) })).estado).toBe(200);
  });

  it('só aceita POST e corpo JSON; sem configuração falha', async () => {
    expect((await montar().pedir(null, amb, 'GET')).estado).toBe(405);
    const semServidor = await montar().pedir(valido, { supabaseUrl: '', serviceKey: '' });
    expect(semServidor.estado).toBe(500);
  });

  it('REPOR_SENHA_POR_PIN=false desliga a via do PIN', async () => {
    const { pedir, chamadas } = montar();
    const r = await pedir(valido, { ...amb, ativa: 'false' });
    expect(r.estado).toBe(403);
    expect(chamadas).toHaveLength(0);
  });

  it('se o GoTrue falhar a listar contas, não repõe nada', async () => {
    const { pedir, chamadas } = montar({ listaEstado: 500 });
    expect((await pedir(valido)).estado).toBe(502);
    expect(chamadas.some((x) => x.metodo === 'PUT')).toBe(false);
  });
});

describe('contaDoUtilizador', () => {
  it('completa com o domínio interno', () => {
    expect(contaDoUtilizador('nalves')).toBe('nalves@bca.cv');
    expect(contaDoUtilizador(' Elvisb ')).toBe('elvisb@bca.cv');
    expect(contaDoUtilizador('a@b.com')).toBe('a@b.com');
  });
  it('rejeita lixo', () => {
    for (const mau of ['', '1abc', 'a b', 'x@', '@y.com']) expect(() => contaDoUtilizador(mau), mau).toThrow();
  });
});
