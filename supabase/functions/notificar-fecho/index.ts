// Mensagens de início/término do fecho para um canal do Teams (webhook de Workflows).
//
// Corre no servidor (Supabase Edge Functions). O endereço do webhook fica na tabela
// notificacoes_config (só acessível com a chave de serviço) e nunca chega ao browser.
//
//   POST /functions/v1/notificar-fecho   { "acao": "evento", "tipo": "inicio"|"termino", "data": "AAAA-MM-DD", "hora": "HH:MM" }
//        qualquer operador autenticado; uma mensagem por dia e tipo (o segundo pedido responde "ja-enviada")
//   POST /functions/v1/notificar-fecho   { "acao": "estado" }                             administrador
//   POST /functions/v1/notificar-fecho   { "acao": "configurar", "url": "https://..." }   administrador ("" remove)
//   POST /functions/v1/notificar-fecho   { "acao": "testar" }                             administrador

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export interface Ambiente {
  /** URL do Supabase vista da funcao (ex.: http://kong:8000). */
  supabaseUrl: string;
  serviceKey: string;
  /**
   * Anfitriões extra aceites para o webhook (nome exato, ex.: o de um bot de terceiros aprovado pela TI).
   * Vem da variável TEAMS_HOSTS_EXTRA do servidor; por defeito só se aceitam os da Microsoft.
   */
  hostsExtra?: string[];
}

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

// ----------------------------------------------------------------- validacao (puro)

/** Só aceita webhooks do Teams/Power Automate por HTTPS: a função não pode ser usada para chamar outros sítios. */
export function validarWebhook(v: unknown, hostsExtra: string[] = []): string {
  const texto = String(v ?? '').trim();
  let u: URL;
  try {
    u = new URL(texto);
  } catch {
    throw new ErroPedido(400, 'Endereço inválido.');
  }
  const h = u.hostname.toLowerCase();
  const permitido =
    h === 'outlook.office.com' ||
    h.endsWith('.webhook.office.com') ||
    h.endsWith('.logic.azure.com') ||
    h.endsWith('.powerplatform.com') ||
    hostsExtra.some((x) => x.trim().toLowerCase() === h);
  if (u.protocol !== 'https:' || u.username || u.password || !permitido) {
    throw new ErroPedido(400, 'O endereço tem de ser um webhook HTTPS do Teams (Workflows / Power Automate) ou de um anfitrião aprovado no servidor.');
  }
  return u.toString();
}

export function validarTipo(v: unknown): 'inicio' | 'termino' {
  if (v === 'inicio' || v === 'termino') return v;
  throw new ErroPedido(400, 'Tipo inválido.');
}

export function validarData(v: unknown): string {
  const d = String(v ?? '');
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (!m) throw new ErroPedido(400, 'Data inválida.');
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (dt.getUTCFullYear() !== Number(m[1]) || dt.getUTCMonth() !== Number(m[2]) - 1 || dt.getUTCDate() !== Number(m[3])) {
    throw new ErroPedido(400, 'Data inválida.');
  }
  return d;
}

export function validarHora(v: unknown): string {
  const h = String(v ?? '').trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(h) ? h : '';
}

/** O aviso (título e texto) do início ou término do fecho. */
export function montarMensagem(tipo: 'inicio' | 'termino', data: string, hora: string, operador: string): { titulo: string; texto: string } {
  const [a, m, d] = data.split('-');
  const titulo = tipo === 'inicio' ? '🟢 Início do Fecho' : '🔴 Término do Fecho';
  const linha = `${d}/${m}/${a}${hora ? ` às ${hora}` : ''}`;
  return { titulo, texto: operador ? `${linha} — operador: ${operador}` : linha };
}

/** O mesmo aviso em texto simples: webhooks que não aceitam cartões (ex.: bots de terceiros) aceitam `{ text }`. */
function textoSimples(titulo: string, texto: string): Json {
  return { text: `${titulo}

${texto}` };
}

function cartao(titulo: string, texto: string): Json {
  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            { type: 'TextBlock', text: titulo, weight: 'Bolder', size: 'Medium', wrap: true },
            { type: 'TextBlock', text: texto, wrap: true },
          ],
        },
      },
    ],
  };
}

// ----------------------------------------------------------------- chamadas ao Supabase

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

interface Quem {
  uid: string;
  codigo: string;
  /** Nome completo do operador (o que se mostra nas mensagens); sem nome, o código. */
  nome: string;
  administrador: boolean;
}

/** Valida o token no GoTrue e devolve o operador ativo ligado a essa conta. */
async function identificar(req: Request, amb: Ambiente, f: FetchFn): Promise<Quem> {
  const auth = req.headers.get('authorization') ?? '';
  if (!/^Bearer\s+\S+/i.test(auth)) throw new ErroPedido(401, 'Sem sessão.');
  const base = amb.supabaseUrl.replace(/\/+$/, '');
  const r = await f(`${base}/auth/v1/user`, { headers: { apikey: amb.serviceKey, Authorization: auth } });
  if (!r.ok) throw new ErroPedido(401, 'Sessão inválida ou expirada.');
  const u = await r.json();
  const uid = u?.id as string | undefined;
  if (!uid) throw new ErroPedido(401, 'Sessão inválida.');

  const q = await cliente(amb, f).pedir(
    `/rest/v1/operators?select=value,nome,papel&user_id=eq.${encodeURIComponent(uid)}&ativo=eq.true&limit=1`,
  );
  if (q.estado !== 200 || !Array.isArray(q.corpo) || q.corpo.length === 0) {
    throw new ErroPedido(403, 'A conta não está ligada a um operador ativo.');
  }
  const op = q.corpo[0];
  const codigo = String(op.value ?? '');
  return { uid, codigo, nome: String(op.nome ?? '').trim() || codigo, administrador: op.papel === 'administrador' };
}

function exigirAdmin(q: Quem) {
  if (!q.administrador) throw new ErroPedido(403, 'Só um administrador pode configurar as notificações.');
}

async function lerWebhook(amb: Ambiente, f: FetchFn): Promise<string | null> {
  const q = await cliente(amb, f).pedir('/rest/v1/notificacoes_config?select=valor&chave=eq.teams_webhook&limit=1');
  if (q.estado !== 200) throw new ErroPedido(502, 'Não consegui ler a configuração.');
  return Array.isArray(q.corpo) && q.corpo[0]?.valor ? String(q.corpo[0].valor) : null;
}

interface Aviso {
  titulo: string;
  texto: string;
}

async function postar(url: string, corpo: Json, f: FetchFn): Promise<{ ok: boolean; estado: number; detalhe: string }> {
  try {
    const r = await f(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(10_000),
    });
    if (r.ok) return { ok: true, estado: r.status, detalhe: '' };
    return { ok: false, estado: r.status, detalhe: `O Teams respondeu ${r.status}.` };
  } catch (e) {
    return { ok: false, estado: 0, detalhe: e instanceof Error ? `Sem ligação ao Teams (${e.name}).` : 'Sem ligação ao Teams.' };
  }
}

/**
 * Envia o aviso como cartão (Workflows) e, se o destino recusar o formato (erro 4xx), repete em texto simples
 * (bots/webhooks de terceiros). Diz qual dos formatos funcionou.
 */
async function enviar(url: string, aviso: Aviso, f: FetchFn): Promise<{ ok: boolean; detalhe: string; formato?: 'cartao' | 'texto' }> {
  const c = await postar(url, cartao(aviso.titulo, aviso.texto), f);
  if (c.ok) return { ok: true, detalhe: '', formato: 'cartao' };
  if (c.estado >= 400 && c.estado < 500) {
    const t = await postar(url, textoSimples(aviso.titulo, aviso.texto), f);
    if (t.ok) return { ok: true, detalhe: '', formato: 'texto' };
    return { ok: false, detalhe: `${c.detalhe} (também recusou texto simples: ${t.estado})` };
  }
  return { ok: false, detalhe: c.detalhe };
}

// ----------------------------------------------------------------- acoes

async function evento(quem: Quem, amb: Ambiente, f: FetchFn, corpo: Json): Promise<Json> {
  const tipo = validarTipo(corpo.tipo);
  const data = validarData(corpo.data);
  const hora = validarHora(corpo.hora);

  const url = await lerWebhook(amb, f);
  if (!url) return { enviada: false, motivo: 'sem-webhook' };

  const c = cliente(amb, f);
  // "Reserva" o evento: o segundo pedido (outro posto, ou desmarcar e marcar) dá conflito e não reenvia.
  const reserva = await c.pedir('/rest/v1/notificacoes_fecho', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ data, tipo, hora: hora || null, operador: quem.codigo }),
  });
  if (reserva.estado === 409) return { enviada: false, motivo: 'ja-enviada' };
  if (reserva.estado !== 201 && reserva.estado !== 204) throw new ErroPedido(502, 'Não consegui registar o envio.');

  const r = await enviar(url, montarMensagem(tipo, data, hora, quem.nome), f);
  if (!r.ok) {
    // Liberta a reserva para se poder tentar de novo.
    await c.pedir(`/rest/v1/notificacoes_fecho?data=eq.${data}&tipo=eq.${tipo}`, { method: 'DELETE' });
    return { enviada: false, motivo: 'falha', detalhe: r.detalhe };
  }
  return { enviada: true, formato: r.formato };
}

async function estado(amb: Ambiente, f: FetchFn): Promise<Json> {
  const url = await lerWebhook(amb, f);
  if (!url) return { configurado: false };
  return { configurado: true, anfitriao: new URL(url).hostname };
}

async function configurar(quem: Quem, amb: Ambiente, f: FetchFn, corpo: Json): Promise<Json> {
  const c = cliente(amb, f);
  if (String(corpo.url ?? '').trim() === '') {
    const d = await c.pedir('/rest/v1/notificacoes_config?chave=eq.teams_webhook', { method: 'DELETE' });
    if (d.estado >= 300) throw new ErroPedido(502, 'Não consegui remover a configuração.');
    return { configurado: false };
  }
  const url = validarWebhook(corpo.url, amb.hostsExtra);
  const g = await c.pedir('/rest/v1/notificacoes_config?on_conflict=chave', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ chave: 'teams_webhook', valor: url, atualizado_em: new Date().toISOString(), atualizado_por: quem.codigo }),
  });
  if (g.estado >= 300) throw new ErroPedido(502, 'Não consegui guardar a configuração.');
  return { configurado: true, anfitriao: new URL(url).hostname };
}

async function testar(quem: Quem, amb: Ambiente, f: FetchFn): Promise<Json> {
  const url = await lerWebhook(amb, f);
  if (!url) throw new ErroPedido(400, 'Ainda não há webhook configurado.');
  const r = await enviar(url, { titulo: '✅ Teste do SCI', texto: `Mensagem de teste enviada por ${quem.nome}.` }, f);
  if (!r.ok) throw new ErroPedido(502, r.detalhe);
  return { enviada: true, formato: r.formato };
}

// ----------------------------------------------------------------- entrada

export async function manipular(req: Request, amb: Ambiente, f: FetchFn = fetch): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return resposta({ erro: 'Método não permitido.' }, 405);

  try {
    if (!amb.supabaseUrl || !amb.serviceKey) throw new ErroPedido(500, 'Função sem configuração do servidor.');
    const quem = await identificar(req, amb, f);

    let corpo: Json;
    try {
      corpo = (await req.json()) as Json;
    } catch {
      throw new ErroPedido(400, 'Pedido inválido.');
    }

    switch (corpo.acao) {
      case 'evento':
        return resposta(await evento(quem, amb, f, corpo));
      case 'estado':
        exigirAdmin(quem);
        return resposta(await estado(amb, f));
      case 'configurar':
        exigirAdmin(quem);
        return resposta(await configurar(quem, amb, f, corpo));
      case 'testar':
        exigirAdmin(quem);
        return resposta(await testar(quem, amb, f));
      default:
        throw new ErroPedido(400, 'Ação desconhecida.');
    }
  } catch (e) {
    if (e instanceof ErroPedido) return resposta({ erro: e.message }, e.estado);
    console.error('notificar-fecho:', e instanceof Error ? e.message : e);
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
      hostsExtra: (Deno.env.get('TEAMS_HOSTS_EXTRA') ?? '').split(',').map((x: string) => x.trim()).filter(Boolean),
    }),
  );
}
