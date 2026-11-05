import { describe, expect, it } from 'vitest';
import { manipular, validarWebhook } from './index';

const amb = { supabaseUrl: 'http://kong:8000', serviceKey: 'SK' };
const URL_TEAMS = 'https://prod-01.westeurope.logic.azure.com/workflows/abc';
const URL_BOT = 'https://hooks.exemplo-bot.com/w/abc';

/** Supabase simulado: um administrador, um webhook configurado, e o destino do webhook com a resposta que se escolher. */
function montar(opts: { url?: string; respostas?: Array<number | 'erro'>; hostsExtra?: string[] } = {}) {
  const url = opts.url ?? URL_TEAMS;
  const destino: { corpos: any[] } = { corpos: [] };
  const respostas = [...(opts.respostas ?? [200])];
  const fake = async (u: string, init: RequestInit = {}) => {
    if (u.endsWith('/auth/v1/user')) return new Response(JSON.stringify({ id: 'u1' }), { status: 200 });
    if (u.includes('/rest/v1/operators')) return new Response(JSON.stringify([{ value: 'nalves', nome: 'Nelson Alves', papel: 'administrador' }]), { status: 200 });
    if (u.includes('/rest/v1/notificacoes_fecho')) return new Response(null, { status: 201 });
    if (u.includes('/rest/v1/notificacoes_config')) return new Response(JSON.stringify([{ valor: url }]), { status: 200 });
    if (u === url) {
      destino.corpos.push(JSON.parse(String(init.body)));
      const r = respostas.length > 1 ? respostas.shift()! : respostas[0];
      if (r === 'erro') throw new Error('rede');
      return new Response(null, { status: r });
    }
    throw new Error(`inesperado ${u}`);
  };
  const pedir = async (corpo: unknown) => {
    const r = await manipular(
      new Request('http://x/f', { method: 'POST', headers: { authorization: 'Bearer tk' }, body: JSON.stringify(corpo) }),
      { ...amb, hostsExtra: opts.hostsExtra },
      fake as never,
    );
    return { estado: r.status, corpo: (await r.json()) as any };
  };
  return { pedir, destino };
}

describe('validarWebhook', () => {
  it('aceita os anfitriões da Microsoft', () => {
    expect(validarWebhook(URL_TEAMS)).toBe(URL_TEAMS);
    expect(validarWebhook('https://x.webhook.office.com/webhookb2/a')).toContain('webhook.office.com');
  });

  it('recusa outros sítios, a não ser que o servidor os aprove pelo nome exato', () => {
    expect(() => validarWebhook(URL_BOT)).toThrow(/Teams/);
    expect(validarWebhook(URL_BOT, ['hooks.exemplo-bot.com'])).toBe(URL_BOT);
    expect(() => validarWebhook('https://outro.exemplo-bot.com/w/abc', ['hooks.exemplo-bot.com'])).toThrow();
  });

  it('nunca aceita http, utilizador/palavra-passe nem endereços inválidos', () => {
    expect(() => validarWebhook('http://hooks.exemplo-bot.com/x', ['hooks.exemplo-bot.com'])).toThrow();
    expect(() => validarWebhook('https://u:p@hooks.exemplo-bot.com/x', ['hooks.exemplo-bot.com'])).toThrow();
    expect(() => validarWebhook('isto não é um endereço')).toThrow();
  });
});

describe('enviar: cartão e, se o destino o recusar, texto simples', () => {
  it('o Workflows aceita o cartão: uma só chamada', async () => {
    const m = montar({ respostas: [202] });
    const r = await m.pedir({ acao: 'testar' });
    expect(r.estado).toBe(200);
    expect(r.corpo).toEqual({ enviada: true, formato: 'cartao' });
    expect(m.destino.corpos).toHaveLength(1);
    expect(m.destino.corpos[0].attachments[0].contentType).toMatch(/adaptive/);
  });

  it('um bot que recusa o cartão (400) recebe texto simples e diz qual formato funcionou', async () => {
    const m = montar({ url: URL_BOT, respostas: [400, 200] });
    const r = await m.pedir({ acao: 'testar' });
    expect(r.corpo).toEqual({ enviada: true, formato: 'texto' });
    expect(m.destino.corpos).toHaveLength(2);
    expect(m.destino.corpos[1].text).toContain('Teste do SCI');
    expect(m.destino.corpos[1].text).toContain('Nelson Alves');
    expect(m.destino.corpos[1].text).not.toContain('nalves');
  });

  it('se recusa os dois formatos, diz porquê', async () => {
    const m = montar({ respostas: [400, 400] });
    const r = await m.pedir({ acao: 'testar' });
    expect(r.estado).toBe(502);
    expect(r.corpo.erro).toMatch(/400.*texto simples/);
  });

  it('um erro do servidor (5xx) ou de rede não repete em texto: o formato não é o problema', async () => {
    const m = montar({ respostas: [500] });
    const r = await m.pedir({ acao: 'testar' });
    expect(r.estado).toBe(502);
    expect(m.destino.corpos).toHaveLength(1);
    const n = montar({ respostas: ['erro'] });
    expect((await n.pedir({ acao: 'testar' })).estado).toBe(502);
    expect(n.destino.corpos).toHaveLength(1);
  });
});

describe('o operador aparece com o nome, não com o código', () => {
  it('a mensagem do fecho diz "operador: Nelson Alves"', async () => {
    const m = montar();
    // o servidor de teste aceita a reserva do evento
    const r = await m.pedir({ acao: 'evento', tipo: 'inicio', data: '2026-11-05', hora: '22:40' });
    expect(r.corpo.enviada).toBe(true);
    const txt = JSON.stringify(m.destino.corpos[0]);
    expect(txt).toContain('operador: Nelson Alves');
    expect(txt).not.toContain('nalves');
  });
});
