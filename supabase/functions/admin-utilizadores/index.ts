// Administracao de utilizadores do SCI (so para administradores).
//
// Corre no servidor (Supabase Edge Functions). A chave de administracao do Supabase
// (SUPABASE_SERVICE_ROLE_KEY) fica aqui e nunca chega ao browser.
//
//   POST /functions/v1/admin-utilizadores   { "acao": "listar" }
//   POST /functions/v1/admin-utilizadores   { "acao": "criar", "email", "nome", "utilizador" }
//   POST /functions/v1/admin-utilizadores   { "acao": "novo-link", "conta" }
//   POST /functions/v1/admin-utilizadores   { "acao": "eliminar", "conta" }
//   POST /functions/v1/admin-utilizadores   { "acao": "repor", "conta" }          senha temporaria
//   POST /functions/v1/admin-utilizadores   { "acao": "papel", "conta", "administrador": true|false }
//
// "criar" faz tudo de uma vez: cria a conta com uma palavra-passe aleatoria que ninguem ve,
// liga-a ao operador (o codigo de operador e o proprio utilizador; cria o operador se for novo)
// e devolve um link de uso unico para a pessoa escolher a sua palavra-passe. Quem chama tem de ser administrador (operators.papel).

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
  /** Codigo do administrador que fez o pedido: vai no cabecalho x-sci-ator para o registo de alteracoes. */
  ator?: string;
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

/**
 * O utilizador de login (sem email). O Supabase identifica contas por email: o utilizador
 * "nalves" é a conta "nalves@bca.cv" — mesmo valor que src/lib/utilizador.ts (DOMINIO_INTERNO).
 */
export const DOMINIO_INTERNO = 'bca.cv';

/** O utilizador e tambem o codigo de operador (ex.: "nalves", "etavares", "elvisb"). */
export function normalizarUtilizador(v: unknown): string {
  const u = String(v ?? '').trim().toLowerCase();
  if (!/^[a-z][a-z0-9_]{2,19}$/.test(u)) {
    throw new ErroPedido(400, 'O utilizador deve ter 3 a 20 caracteres (letras minúsculas, números ou _), sem @, e começar por uma letra.');
  }
  return u;
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
    ...(amb.ator ? { 'x-sci-ator': amb.ator } : {}),
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
async function exigirAdministrador(req: Request, amb: Ambiente, f: FetchFn): Promise<{ uid: string; codigo: string }> {
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
    `/rest/v1/operators?select=id,value&user_id=eq.${encodeURIComponent(uid)}&papel=eq.administrador&ativo=eq.true&limit=1`,
  );
  if (q.estado !== 200 || !Array.isArray(q.corpo) || q.corpo.length === 0) {
    throw new ErroPedido(403, 'Só um administrador pode gerir utilizadores.');
  }
  return { uid, codigo: String(q.corpo[0]?.value ?? '') };
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

// ----------------------------------------------------------------- registo de alteracoes

/**
 * Acoes sobre contas (que nao passam por uma tabela publica) ficam no registo de alteracoes.
 * Falhar aqui nao desfaz a acao: o registo e uma garantia a mais, nao uma condicao.
 */
async function auditar(
  c: ReturnType<typeof cliente>,
  ator: string | undefined,
  registo: string,
  resumo: string,
  dados: Json = {},
): Promise<void> {
  try {
    await c.pedir('/rest/v1/registo_alteracoes', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ tabela: 'contas', operacao: 'UPDATE', registo_id: registo, operador: ator || 'sistema', resumo, alteracoes: dados }),
    });
  } catch {
    /* sem registo, a acao mantem-se */
  }
}

// ----------------------------------------------------------------- acoes

/** Todas as contas (ate 500) — o GoTrue nao filtra por email. */
async function todasAsContas(c: ReturnType<typeof cliente>): Promise<any[]> {
  const u = await c.pedir('/auth/v1/admin/users?page=1&per_page=500');
  if (u.estado !== 200) throw new ErroPedido(502, 'Não consegui listar as contas.');
  return Array.isArray(u.corpo?.users) ? u.corpo.users : [];
}

async function criar(req: Request, amb: Ambiente, f: FetchFn, corpo: Json): Promise<Json> {
  const email = normalizarEmail(corpo.email); // email verdadeiro da pessoa (contacto)
  const nome = normalizarNome(corpo.nome);
  const utilizador = normalizarUtilizador(corpo.utilizador);
  const codigo = utilizador; // o utilizador e o codigo de operador
  const conta = `${utilizador}@${DOMINIO_INTERNO}`; // a conta no Supabase (ex.: nalves@bca.cv)
  const origem = origemPublica(req, amb);
  const c = cliente(amb, f);

  // O utilizador ja existe? So se retoma se ficou a meio (a pessoa ainda nao definiu a palavra-passe);
  // se ja tem palavra-passe, e outra pessoa: nao se gera um link que lhe daria acesso a conta.
  const contas = await todasAsContas(c);
  const jaExiste = contas.find((x) => String(x.email ?? '').toLowerCase() === conta);
  if (jaExiste && jaExiste.user_metadata?.must_change_password !== true) {
    throw new ErroPedido(409, `O utilizador "${utilizador}" já existe e já tem palavra-passe. Para gerar um link novo usa "Novo link" na lista.`);
  }

  // O operador (codigo) tem de estar livre, ou ja ser desta conta.
  const op = await c.pedir(`/rest/v1/operators?select=id,value,nome,user_id&value=eq.${encodeURIComponent(codigo)}&limit=1`);
  if (op.estado !== 200) throw new ErroPedido(502, 'Não consegui consultar os operadores.');
  const existente = Array.isArray(op.corpo) ? op.corpo[0] : null;
  if (existente?.user_id && existente.user_id !== jaExiste?.id) {
    throw new ErroPedido(409, `O código "${codigo}" já está associado a outra conta.`);
  }

  // 1. Conta (palavra-passe aleatoria que ninguem ve).
  let uid: string | undefined = jaExiste?.id;
  if (!jaExiste) {
    const novo = await c.pedir('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: conta,
        password: aleatoria(40),
        email_confirm: true,
        user_metadata: { name: nome, utilizador, email_contacto: email, must_change_password: true },
      }),
    });
    if (![200, 201].includes(novo.estado) || !novo.corpo?.id) {
      throw new ErroPedido(502, 'O Supabase recusou a criação da conta.');
    }
    uid = novo.corpo.id as string;
  }

  // 2. Link para a pessoa definir a palavra-passe.
  const { link } = await gerarLink(c, conta, origem);
  if (!uid) throw new ErroPedido(502, 'Não consegui obter o identificador da conta.');

  // 3. Ligar ao operador.
  if (existente) {
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

  await auditar(c, amb.ator, conta, `Conta ${jaExiste ? 'retomada' : 'criada'} (${codigo})`, { utilizador, codigo, retomada: !!jaExiste });
  return { ok: true, utilizador, email, nome, codigo, conta, link, retomada: !!jaExiste };
}

/** Novo link para uma conta que ja existe. `conta` e o identificador devolvido por "listar". */
async function novoLink(req: Request, amb: Ambiente, f: FetchFn, corpo: Json): Promise<Json> {
  const conta = normalizarEmail(corpo.conta);
  const c = cliente(amb, f);
  const { link } = await gerarLink(c, conta, origemPublica(req, amb));
  await auditar(c, amb.ator, conta, 'Novo link de acesso gerado');
  return { ok: true, conta, link };
}

/**
 * Elimina uma conta. Nao se elimina a propria conta nem a de um administrador (para isso
 * deixa-se primeiro de ser administrador). O operador fica (sem conta) — o historico e as
 * fichas assinadas continuam a mostrar o codigo; o PIN e os tokens apagam-se com a conta.
 */
async function eliminar(uidChamador: string, amb: Ambiente, f: FetchFn, corpo: Json): Promise<Json> {
  const conta = normalizarEmail(corpo.conta);
  const c = cliente(amb, f);

  const contas = await todasAsContas(c);
  const alvo = contas.find((x) => String(x.email ?? '').toLowerCase() === conta);
  if (!alvo) throw new ErroPedido(404, 'Não existe nenhuma conta com esse email.');
  if (alvo.id === uidChamador) throw new ErroPedido(409, 'Não podes eliminar a tua própria conta.');

  const op = await c.pedir(
    `/rest/v1/operators?select=value,papel&user_id=eq.${encodeURIComponent(alvo.id)}&limit=1`,
  );
  if (op.estado !== 200) throw new ErroPedido(502, 'Não consegui consultar os operadores.');
  const ligado = Array.isArray(op.corpo) ? op.corpo[0] : null;
  if (ligado?.papel === 'administrador') {
    throw new ErroPedido(409, 'Esta conta é de um administrador e não se elimina aqui.');
  }

  const d = await c.pedir(`/auth/v1/admin/users/${encodeURIComponent(alvo.id)}`, { method: 'DELETE' });
  if (![200, 204].includes(d.estado)) throw new ErroPedido(502, 'O Supabase recusou eliminar a conta.');

  await auditar(c, amb.ator, conta, `Conta eliminada${ligado?.value ? ` (${ligado.value})` : ''}`, { codigo: ligado?.value ?? null });
  return { ok: true, conta, codigo: (ligado?.value as string | undefined) ?? null };
}

/** Senha temporaria legivel (sem 0/O, 1/l/I). So aparece uma vez ao administrador. */
function senhaTemporaria(): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join('');
}

/**
 * Repoe a senha de uma conta com uma senha temporaria; a pessoa e obrigada a trocá-la ao entrar.
 * (Quem prefere que ninguem saiba a senha usa "novo-link".) Nao serve para a propria conta.
 */
async function repor(uidChamador: string, amb: Ambiente, f: FetchFn, corpo: Json): Promise<Json> {
  const conta = normalizarEmail(corpo.conta);
  const c = cliente(amb, f);

  const contas = await todasAsContas(c);
  const alvo = contas.find((x) => String(x.email ?? '').toLowerCase() === conta);
  if (!alvo) throw new ErroPedido(404, 'Não existe nenhuma conta com esse email.');
  if (alvo.id === uidChamador) {
    throw new ErroPedido(409, 'Não podes repor a tua própria senha aqui: pede a outro administrador.');
  }

  const temporaria = senhaTemporaria();
  const u = await c.pedir(`/auth/v1/admin/users/${encodeURIComponent(alvo.id)}`, {
    method: 'PUT',
    body: JSON.stringify({ password: temporaria, user_metadata: { must_change_password: true } }),
  });
  if (u.estado !== 200) throw new ErroPedido(502, 'O Supabase recusou repor a senha.');

  // Registo (visivel aos administradores). Falhar aqui nao desfaz a reposicao.
  await c.pedir('/rest/v1/reposicoes_senha', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ user_id: alvo.id, metodo: 'admin', feito_por: uidChamador }),
  });

  await auditar(c, amb.ator, conta, 'Senha reposta pelo administrador (senha temporária)');
  return { ok: true, conta, senhaTemporaria: temporaria };
}

/** Torna (ou deixa de tornar) alguem administrador. Nunca deixa o sistema sem administrador. */
async function papel(uidChamador: string, amb: Ambiente, f: FetchFn, corpo: Json): Promise<Json> {
  const conta = normalizarEmail(corpo.conta);
  if (typeof corpo.administrador !== 'boolean') throw new ErroPedido(400, 'Indica se é administrador.');
  const quer = corpo.administrador as boolean;
  const c = cliente(amb, f);

  const contas = await todasAsContas(c);
  const alvo = contas.find((x) => String(x.email ?? '').toLowerCase() === conta);
  if (!alvo) throw new ErroPedido(404, 'Não existe nenhuma conta com esse email.');

  const op = await c.pedir(`/rest/v1/operators?select=id,value,papel,ativo&user_id=eq.${encodeURIComponent(alvo.id)}&limit=1`);
  if (op.estado !== 200) throw new ErroPedido(502, 'Não consegui consultar os operadores.');
  const ligado = Array.isArray(op.corpo) ? op.corpo[0] : null;
  if (!ligado) throw new ErroPedido(409, 'Esta conta não tem operador ligado — liga-a a um operador primeiro.');

  const novoPapel = quer ? 'administrador' : 'operador';
  if (ligado.papel === novoPapel) return { ok: true, conta, administrador: quer };

  if (!quer) {
    // Tem de ficar pelo menos um administrador ativo com conta.
    const outros = await c.pedir(
      `/rest/v1/operators?select=id&papel=eq.administrador&ativo=eq.true&user_id=not.is.null&id=neq.${encodeURIComponent(ligado.id)}&limit=1`,
    );
    if (outros.estado !== 200) throw new ErroPedido(502, 'Não consegui consultar os administradores.');
    if (!Array.isArray(outros.corpo) || outros.corpo.length === 0) {
      throw new ErroPedido(409, 'Tem de ficar pelo menos um administrador: torna outra pessoa administradora primeiro.');
    }
  }

  const p = await c.pedir(`/rest/v1/operators?id=eq.${encodeURIComponent(ligado.id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ papel: novoPapel }),
  });
  if (p.estado >= 300) throw new ErroPedido(502, 'Não consegui alterar o papel.');
  return { ok: true, conta, administrador: quer };
}

async function listar(uidChamador: string, amb: Ambiente, f: FetchFn): Promise<Json> {
  const c = cliente(amb, f);
  const contas = await todasAsContas(c);

  const o = await c.pedir('/rest/v1/operators?select=value,nome,papel,ativo,user_id&order=nome');
  const ops: any[] = o.estado === 200 && Array.isArray(o.corpo) ? o.corpo : [];
  const porConta = new Map(ops.filter((x) => x.user_id).map((x) => [x.user_id as string, x]));
  const sufixo = `@${DOMINIO_INTERNO}`;

  // Ultima reposicao de senha por conta (a mais recente primeiro).
  const rp = await c.pedir('/rest/v1/reposicoes_senha?select=user_id,quando,metodo&order=quando.desc&limit=500');
  const ultimaReposicao = new Map<string, { quando: string; metodo: string }>();
  if (rp.estado === 200 && Array.isArray(rp.corpo)) {
    for (const r of rp.corpo) if (!ultimaReposicao.has(r.user_id)) ultimaReposicao.set(r.user_id, { quando: r.quando, metodo: r.metodo });
  }

  const utilizadores = contas
    .map((x) => {
      const op = porConta.get(x.id);
      const conta = String(x.email ?? '');
      const interna = conta.toLowerCase().endsWith(sufixo);
      return {
        // `conta` identifica a conta no Supabase (e e o que "novo-link" recebe).
        conta,
        // Contas novas entram so com o utilizador; as antigas entram com o email.
        utilizador: interna ? conta.slice(0, -sufixo.length) : null,
        email: (x.user_metadata?.email_contacto as string | undefined) ?? (interna ? null : conta),
        nome: (x.user_metadata?.name as string | undefined) ?? op?.nome ?? '',
        codigo: (op?.value as string | undefined) ?? null,
        papel: (op?.papel as string | undefined) ?? null,
        pendente: x.user_metadata?.must_change_password === true,
        // A propria conta e as de administradores nao se eliminam por aqui.
        eliminavel: x.id !== uidChamador && op?.papel !== 'administrador',
        administrador: op?.papel === 'administrador',
        temOperador: !!op,
        eu: x.id === uidChamador,
        ultimaReposicao: ultimaReposicao.get(x.id) ?? null,
        ultimoAcesso: (x.last_sign_in_at as string | null) ?? null,
        criadaEm: x.created_at as string,
      };
    })
    .sort((a, b) => (a.utilizador ?? a.conta).localeCompare(b.utilizador ?? b.conta));

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
    const quem = await exigirAdministrador(req, amb, f);
    const uid = quem.uid;
    // A partir daqui todas as chamadas ao Supabase levam o ator (registo de alteracoes).
    const ambA: Ambiente = { ...amb, ator: quem.codigo };

    let corpo: Json;
    try {
      corpo = (await req.json()) as Json;
    } catch {
      throw new ErroPedido(400, 'Pedido inválido.');
    }

    switch (corpo.acao) {
      case 'listar':
        return resposta(await listar(uid, ambA, f));
      case 'criar':
        return resposta(await criar(req, ambA, f, corpo));
      case 'novo-link':
        return resposta(await novoLink(req, ambA, f, corpo));
      case 'eliminar':
        return resposta(await eliminar(uid, ambA, f, corpo));
      case 'repor':
        return resposta(await repor(uid, ambA, f, corpo));
      case 'papel':
        return resposta(await papel(uid, ambA, f, corpo));
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
