import { supabase } from '@/integrations/supabase/client';

export type TipoFecho = 'inicio' | 'termino';

export type ResultadoEvento =
  | { estado: 'enviada' }
  | { estado: 'ja-enviada' }
  | { estado: 'sem-webhook' }
  | { estado: 'falha'; detalhe: string };

type Resposta<T> = { dados: T; erro: null } | { dados: null; erro: string };

async function chamar<T>(corpo: Record<string, unknown>): Promise<Resposta<T>> {
  const { data, error } = await supabase.functions.invoke('notificar-fecho', { body: corpo });
  if (error) {
    const ctx = (error as { context?: unknown }).context;
    if (ctx instanceof Response) {
      try {
        const j = (await ctx.clone().json()) as { erro?: string };
        if (j?.erro) return { dados: null, erro: j.erro };
      } catch {
        /* sem corpo JSON */
      }
      if (ctx.status === 404) {
        return { dados: null, erro: 'O serviço de notificações não está instalado no servidor (função notificar-fecho).' };
      }
      return { dados: null, erro: `O serviço de notificações respondeu com erro ${ctx.status}.` };
    }
    return { dados: null, erro: 'Sem ligação ao serviço de notificações.' };
  }
  const d = data as { erro?: string } & Record<string, unknown>;
  if (d?.erro) return { dados: null, erro: d.erro };
  return { dados: data as T, erro: null };
}

/** Pede ao servidor a mensagem de início/término do fecho (uma por dia e tipo). Nunca lança. */
export async function enviarEventoFecho(tipo: TipoFecho, data: string, hora: string): Promise<ResultadoEvento> {
  const r = await chamar<{ enviada?: boolean; motivo?: string; detalhe?: string }>({ acao: 'evento', tipo, data, hora });
  if (r.erro) return { estado: 'falha', detalhe: r.erro };
  if (r.dados.enviada) return { estado: 'enviada' };
  if (r.dados.motivo === 'ja-enviada') return { estado: 'ja-enviada' };
  if (r.dados.motivo === 'sem-webhook') return { estado: 'sem-webhook' };
  return { estado: 'falha', detalhe: r.dados.detalhe ?? 'Falha desconhecida.' };
}

export function estadoTeams() {
  return chamar<{ configurado: boolean; anfitriao?: string }>({ acao: 'estado' });
}

export function configurarTeams(url: string) {
  return chamar<{ configurado: boolean; anfitriao?: string }>({ acao: 'configurar', url });
}

export function testarTeams() {
  return chamar<{ enviada: boolean; formato?: 'cartao' | 'texto' }>({ acao: 'testar' });
}
