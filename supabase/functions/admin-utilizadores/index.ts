// Administracao de utilizadores do SCI (so para administradores).
//
// Corre no servidor (Supabase Edge Functions). A chave de administracao do Supabase
// (SUPABASE_SERVICE_ROLE_KEY) fica aqui e nunca chega ao browser.
//
//   POST /functions/v1/admin-utilizadores   { "acao": "listar" }
//   POST /functions/v1/admin-utilizadores   { "acao": "criar", "email", "nome", "codigo" }
//   POST /functions/v1/admin-utilizadores   { "acao": "novo-link", "email" }
//
// "criar" faz tudo de uma vez: cria a conta com uma palavra-passe aleatoria que ninguem ve,
// liga-a ao operador (cria o operador se for novo) e devolve um link de uso unico para a
// pessoa escolher a sua palavra-passe. Quem chama tem de ser administrador (operators.papel).

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export interface Ambiente {
  /** URL do Supabase vista da funcao (ex.: http://kong:8000). */
  supabaseUrl: string;
  serviceKey: string;
  /** Endereco publico da app (opcional); se faltar usa-se o Origin do pedido. */
  urlPublica?: string;
}

type Json = Record<string, unknown>;

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

// ----------------------------------------------------------------- validacao (puro)

export function normalizarEmail(v: unknown): string {
  const e = String(v ?? '').trim().toLowerCase();
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(e)) throw new ErroPedido(400, 'Email inválido.');
  return e;
}

export function normalizarNome(v: unknown): string {
  const n = String(v ?? '').replace(/\s+/g, ' ').trim();
  if (n.length < 2 || n.length > 80) throw new ErroPedido(400, 'O nome deve ter entre 2 e 80 caracteres.');
  return n;
}

export function normalizarCodigo(v: unknown): string {
  const c = String(v ?? '').trim().toLowerCase();
  if (!/^[a-z][a-z0-9_]{2,19}$/.test(c)) {
    throw new ErroPedido(400, 'O código de operador deve ter 3 a 20 caracteres (letras minúsculas, números ou _) e começar por uma letra.');
  }
  return c;
}

/** Troca o endereco interno do link pelo que os colegas conseguem abrir. */
export function linkPublico(actionLink: string, origem: string): string {
  const i = actionLink.indexOf('/auth/v1/verify');
  if (i < 0) throw new ErroPedido(502, 'Formato de link inesperado.');
  return origem.replace(/\/+$/, '') + actionLink.slice(i);
}

function aleatoria(n: number): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join('');
}

// ----------------------------------------------------------------- chamadas ao Supabase

type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

function cliente(amb: Ambiente, f: FetchFn) {
  const cab = {
    apikey: amb.serviceKey,
    Authorization: `Bearer ${amb.serviceKey}`,
    'Content-Type': 'application/json',
  };
  const base = amb.supabaseUrl.replace(/\/+$/, '');
  return {
    async pedir(caminho: string, init: RequestInit = {}): Promise<{ estado: number; corpo: any }> {
      const r = await f(base + caminho, { ...init, headers: { ...cab, ...(init.headers as Record<string, string> | undefined) } });
      const texto = await r.text();
      let corpo: any = null;
      try {
        corpo = texto ? JSON.parse(texto) : null;
      } catch {
        corpo = { raw: texto };
      }
      return { estado: r.status, corpo };
    },
  };
}

/** Quem esta a chamar: valida o token no GoTrue e confirma que e administrador ativo. */
async function exigirAdministrador(req: Request, amb: Ambiente, f: FetchFn): Promise<string> {
  const auth = req.headers.get('authorization') ?? '';
  if (!/^Bearer\s+\S+/i.test(auth)) throw new ErroPedido(401, 'Sem sessão.');

  const base = amb.supabaseUrl.replace(/\/+$/, '');
  const r = await f(`${base}/auth/v1/user`, { headers: { apikey: amb.serviceKey, Authorization: auth } });
  if (!r.ok) throw new ErroPedido(401, 'Sessão inválida ou expirada.');
  const u = await r.json();
  const uid = u?.id as string | undefined;
  if (!uid) throw new ErroPedido(401, 'Sessão inválida.');

  const c = cliente(amb, f);
  const q = await c.pedir(
    `/rest/v1/operators?select=id&user_id=eq.${encodeURIComponent(uid)}&papel=eq.administrador&ativo=eq.true&limit=1`,
  );
  if (q.estado !== 200 || !Array.isArray(q.corpo) || q.corpo.length === 0) {
    throw new ErroPedido(403, 'Só um administrador pode gerir utilizadores.');
  }
  return uid;
}

function origemPublica(req: Request, amb: Ambiente): string {
  if (amb.urlPublica) return amb.urlPublica.replace(/\/+$/, '');
  const o = req.headers.get('origin') ?? '';
  if (!/^https?:\/\/[^/\s]+$/.test(o)) throw new ErroPedido(400, 'Não consegui determinar o endereço da aplicação.');
  return o;
}

async function gerarLink(c: ReturnType<typeof cliente>, email: string, origem: string) {
  const g = await c.pedir('/auth/v1/admin/generate_link', {
    method: 'POST',
    body: JSON.stringify({ type: 'recovery', email, redirect_to: `${origem}/reset-password` }),
  });
  if (g.estado === 404 || g.estado === 422) throw new ErroPedido(404, 'Não existe nenhuma conta com esse email.');
  if (g.estado !== 200 || typeof g.corpo?.action_link !== 'string') {
    throw new ErroPedido(502, 'Não consegui gerar o link de acesso.');
  }
  return { link: linkPublico(g.corpo.action_link, origem), userId: g.corpo.id as string | undefined };
}

// ----------------------------------------------------------------- acoes

async function criar(req: Request, amb: Ambiente, f: FetchFn, corpo: Json): Promise<Json> {
  const email = normalizarEmail(corpo.email);
  const nome = normalizarNome(corpo.nome);
  const codigo = normalizarCodigo(corpo.codigo);
  const origem = origemPublica(req, amb);
  const c = cliente(amb, f);

  // O operador (codigo) tem de estar livre, ou ja ser desta conta.
  const op = await c.pedir(`/rest/v1/operators?select=id,value,nome,user_id&value=eq.${encodeURIComponent(codigo)}&limit=1`);
  if (op.estado !== 200) throw new ErroPedido(502, 'Não consegui consultar os operadores.');
  const existente = Array.isArray(op.corpo) ? op.corpo[0] : null;

  // Recusa antes de criar nada: o codigo ja pertence a uma conta que nao e esta.
  if (existente?.user_id) {
    const dono = await c.pedir(`/auth/v1/admin/users/${encodeURIComponent(existente.user_id)}`);
    if (dono.estado === 200 && String(dono.corpo?.email ?? '').toLowerCase() !== email) {
      throw new ErroPedido(409, `O código "${codigo}" já está associado a outra conta.`);
    }
  }

  // 1. Conta (palavra-passe aleatoria que ninguem ve). Se ja existir, segue para o link.
  const novo = await c.pedir('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password: aleatoria(40),
      email_confirm: true,
      user_metadata: { name: nome, must_change_password: true },
    }),
  });
  if (![200, 201, 409, 422].includes(novo.estado)) throw new ErroPedido(502, 'O Supabase recusou a criação da conta.');
  const jaExistia = novo.estado === 409 || novo.estado === 422;
  if (jaExistia && !/exist|already|registered/i.test(JSON.stringify(novo.corpo))) {
    throw new ErroPedido(502, 'O Supabase recusou a criação da conta.');
  }

  // 2. Link para a pessoa definir a palavra-passe (devolve tambem o id da conta).
  const { link, userId } = await gerarLink(c, email, origem);
  const uid = (novo.corpo?.id as string | undefined) ?? userId;
  if (!uid) throw new ErroPedido(502, 'Não consegui obter o identificador da conta.');

  // 3. Ligar ao operador.
  if (existente) {
    if (existente.user_id && existente.user_id !== uid) {
      throw new ErroPedido(409, `O código "${codigo}" já está associado a outra conta.`);
    }
    const p = await c.pedir(`/rest/v1/operators?id=eq.${existente.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ user_id: uid, ativo: true }),
    });
    if (p.estado >= 300) throw new ErroPedido(409, 'Esta conta já está associada a outro operador.');
  } else {
    const p = await c.pedir('/rest/v1/operators', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ value: codigo, nome, user_id: uid, ativo: true, papel: 'operador' }),
    });
    if (p.estado >= 300) throw new ErroPedido(409, 'Esta conta já está associada a outro operador.');
  }

  return { ok: true, email, nome, codigo, link, jaExistia };
}

async function novoLink(req: Request, amb: Ambiente, f: FetchFn, corpo: Json): Promise<Json> {
  const email = normalizarEmail(corpo.email);
  const { link } = await gerarLink(cliente(amb, f), email, origemPublica(req, amb));
  return { ok: true, email, link };
}

async function listar(amb: Ambiente, f: FetchFn): Promise<Json> {
  const c = cliente(amb, f);
  const u = await c.pedir('/auth/v1/admin/users?page=1&per_page=500');
  if (u.estado !== 200) throw new ErroPedido(502, 'Não consegui listar as contas.');
  const contas: any[] = Array.isArray(u.corpo?.users) ? u.corpo.users : [];

  const o = await c.pedir('/rest/v1/operators?select=value,nome,papel,ativo,user_id&order=nome');
  const ops: any[] = o.estado === 200 && Array.isArray(o.corpo) ? o.corpo : [];
  const porConta = new Map(ops.filter((x) => x.user_id).map((x) => [x.user_id as string, x]));

  const utilizadores = contas
    .map((x) => {
      const op = porConta.get(x.id);
      return {
        email: x.email as string,
        nome: (x.user_metadata?.name as string | undefined) ?? op?.nome ?? '',
        codigo: (op?.value as string | undefined) ?? null,
        papel: (op?.papel as string | undefined) ?? null,
        pendente: x.user_metadata?.must_change_password === true,
        ultimoAcesso: (x.last_sign_in_at as string | null) ?? null,
        criadaEm: x.created_at as string,
      };
    })
    .sort((a, b) => a.email.localeCompare(b.email));

  // Operadores sem conta (para escolher o codigo ao criar).
  const semConta = ops.filter((x) => !x.user_id && x.ativo).map((x) => ({ codigo: x.value, nome: x.nome }));
  return { ok: true, utilizadores, operadoresSemConta: semConta };
}

// ----------------------------------------------------------------- entrada

export async function manipular(req: Request, amb: Ambiente, f: FetchFn = fetch): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return resposta({ erro: 'Método não permitido.' }, 405);

  try {
    if (!amb.supabaseUrl || !amb.serviceKey) throw new ErroPedido(500, 'Função sem configuração do servidor.');
    await exigirAdministrador(req, amb, f);

    let corpo: Json;
    try {
      corpo = (await req.json()) as Json;
    } catch {
      throw new ErroPedido(400, 'Pedido inválido.');
    }

    switch (corpo.acao) {
      case 'listar':
        return resposta(await listar(amb, f));
      case 'criar':
        return resposta(await criar(req, amb, f, corpo));
      case 'novo-link':
        return resposta(await novoLink(req, amb, f, corpo));
      default:
        throw new ErroPedido(400, 'Ação desconhecida.');
    }
  } catch (e) {
    if (e instanceof ErroPedido) return resposta({ erro: e.message }, e.estado);
    console.error('admin-utilizadores:', e instanceof Error ? e.message : e);
    return resposta({ erro: 'Erro interno.' }, 500);
  }
}

// Arranque no runtime do Supabase (Deno). Fora dele (testes) este bloco nao corre.
declare const Deno: any;
if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
  Deno.serve((req: Request) =>
    manipular(req, {
      supabaseUrl: Deno.env.get('SUPABASE_URL') ?? '',
      serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      urlPublica: Deno.env.get('SCI_URL_PUBLICA') || undefined,
    }),
  );
}
