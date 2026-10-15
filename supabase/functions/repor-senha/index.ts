// "Esqueceu a senha?" sem email: a pessoa prova quem é com o utilizador + o PIN de assinatura e
// escolhe a senha nova. Não precisa de sessão (quem esqueceu a senha não a tem).
//
//   POST /functions/v1/repor-senha   { "utilizador": "nalves", "pin": "1234", "novaSenha": "..." }
//
// Segurança:
//  - 5 PIN errados por conta em 24 h bloqueiam esta via durante 24 h (tentar_pin_reposicao);
//  - a resposta é sempre a mesma quando o utilizador não existe, não tem PIN ou o PIN está
//    errado, para não revelar que contas existem;
//  - cada reposição fica registada (reposicoes_senha) e os administradores veem-na;
//  - REPOR_SENHA_POR_PIN=false desliga esta via (fica só a reposição pelo administrador).

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export interface Ambiente {
  supabaseUrl: string;
  serviceKey: string;
  /** "false" desliga a reposição pelo PIN. */
  ativa?: string;
}

export const DOMINIO_INTERNO = 'bca.cv';
const SENHA_MIN = 8;
const SENHA_MAX = 72; // limite do bcrypt

const GENERICO = 'Utilizador ou PIN incorretos. Se não tens PIN definido, pede ao administrador um link novo.';

type Json = Record<string, unknown>;
type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

function resposta(corpo: Json, estado = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status: estado,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

class ErroPedido extends Error {
  constructor(public estado: number, mensagem: string) {
    super(mensagem);
  }
}

export function contaDoUtilizador(v: unknown): string {
  const u = String(v ?? '').trim().toLowerCase();
  if (u.includes('@')) {
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(u)) throw new ErroPedido(400, GENERICO);
    return u;
  }
  if (!/^[a-z][a-z0-9_]{2,19}$/.test(u)) throw new ErroPedido(400, GENERICO);
  return `${u}@${DOMINIO_INTERNO}`;
}

export async function manipular(req: Request, amb: Ambiente, f: FetchFn = fetch): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return resposta({ erro: 'Método não permitido.' }, 405);

  try {
    if (!amb.supabaseUrl || !amb.serviceKey) throw new ErroPedido(500, 'Função sem configuração do servidor.');
    if ((amb.ativa ?? 'true').toLowerCase() === 'false') {
      throw new ErroPedido(403, 'A reposição pelo PIN está desligada. Pede ao administrador um link novo.');
    }

    let corpo: Json;
    try {
      corpo = (await req.json()) as Json;
    } catch {
      throw new ErroPedido(400, 'Pedido inválido.');
    }

    const conta = contaDoUtilizador(corpo.utilizador);
    const pin = String(corpo.pin ?? '');
    const novaSenha = String(corpo.novaSenha ?? '');
    if (!/^[0-9]{4}$/.test(pin)) throw new ErroPedido(400, GENERICO);
    if (novaSenha.length < SENHA_MIN) {
      throw new ErroPedido(400, `A senha nova deve ter pelo menos ${SENHA_MIN} caracteres.`);
    }
    if (novaSenha.length > SENHA_MAX) {
      throw new ErroPedido(400, `A senha nova não pode ter mais de ${SENHA_MAX} caracteres.`);
    }

    const base = amb.supabaseUrl.replace(/\/+$/, '');
    const cab = {
      apikey: amb.serviceKey,
      Authorization: `Bearer ${amb.serviceKey}`,
      'Content-Type': 'application/json',
    };
    const pedir = async (caminho: string, init: RequestInit = {}) => {
      const r = await f(base + caminho, { ...init, headers: { ...cab, ...(init.headers as Record<string, string> | undefined) } });
      const t = await r.text();
      let c: any = null;
      try {
        c = t ? JSON.parse(t) : null;
      } catch {
        c = null;
      }
      return { estado: r.status, corpo: c };
    };

    // A conta (o GoTrue não filtra por email).
    const lista = await pedir('/auth/v1/admin/users?page=1&per_page=500');
    if (lista.estado !== 200) throw new ErroPedido(502, 'Não consegui verificar a conta.');
    const contas: any[] = Array.isArray(lista.corpo?.users) ? lista.corpo.users : [];
    const alvo = contas.find((x) => String(x.email ?? '').toLowerCase() === conta);
    // Utilizador inexistente: mesma resposta que um PIN errado.
    if (!alvo) throw new ErroPedido(400, GENERICO);

    const t = await pedir('/rest/v1/rpc/tentar_pin_reposicao', {
      method: 'POST',
      body: JSON.stringify({ p_user_id: alvo.id, p_pin: pin }),
    });
    if (t.estado !== 200) throw new ErroPedido(502, 'Não consegui verificar o PIN.');
    const veredicto = String(t.corpo);

    if (veredicto === 'bloqueado') {
      throw new ErroPedido(429, 'Demasiadas tentativas. Pede ao administrador um link novo.');
    }
    if (veredicto !== 'ok') throw new ErroPedido(400, GENERICO); // pin_errado ou sem_pin: indistinguiveis

    const atualiza = await pedir(`/auth/v1/admin/users/${encodeURIComponent(alvo.id)}`, {
      method: 'PUT',
      body: JSON.stringify({ password: novaSenha, user_metadata: { must_change_password: false } }),
    });
    if (atualiza.estado !== 200) throw new ErroPedido(502, 'Não consegui guardar a senha nova.');

    // Fica registado (visivel aos administradores). Falhar aqui nao desfaz a reposicao.
    await pedir('/rest/v1/reposicoes_senha', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ user_id: alvo.id, metodo: 'pin' }),
    });

    return resposta({ ok: true });
  } catch (e) {
    if (e instanceof ErroPedido) return resposta({ erro: e.message }, e.estado);
    console.error('repor-senha:', e instanceof Error ? e.message : e);
    return resposta({ erro: 'Erro interno.' }, 500);
  }
}

// Arranque no runtime do Supabase (Deno). Fora dele (testes) este bloco não corre.
declare const Deno: any;
if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
  Deno.serve((req: Request) =>
    manipular(req, {
      supabaseUrl: Deno.env.get('SUPABASE_URL') ?? '',
      serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      ativa: Deno.env.get('REPOR_SENHA_POR_PIN') || undefined,
    }),
  );
}
