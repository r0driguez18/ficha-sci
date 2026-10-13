import { supabase } from '@/integrations/supabase/client';

export interface UtilizadorAdmin {
  /** Identificador da conta no Supabase (é o que "novo link" recebe). */
  conta: string;
  /** O que a pessoa escreve no login. Null nas contas antigas, que entram com o email. */
  utilizador: string | null;
  /** Email verdadeiro da pessoa (contacto). */
  email: string | null;
  nome: string;
  codigo: string | null;
  papel: string | null;
  /** Ainda não definiu a palavra-passe (conta criada por um administrador). */
  pendente: boolean;
  ultimoAcesso: string | null;
  criadaEm: string;
}

export interface OperadorSemConta {
  codigo: string;
  nome: string;
}

export interface ListaAdmin {
  utilizadores: UtilizadorAdmin[];
  operadoresSemConta: OperadorSemConta[];
}

export interface CriarUtilizadorResultado {
  utilizador: string;
  email: string;
  nome: string;
  codigo: string;
  conta: string;
  link: string;
  /** A conta já existia sem palavra-passe definida (criação interrompida): foi retomada. */
  retomada: boolean;
}

type Resposta<T> = { dados: T; erro: null } | { dados: null; erro: string };

async function chamar<T>(corpo: Record<string, unknown>): Promise<Resposta<T>> {
  const { data, error } = await supabase.functions.invoke('admin-utilizadores', { body: corpo });

  if (error) {
    // Respostas de erro da função trazem { erro: "..." } — lê-se para mostrar a mensagem certa.
    const ctx = (error as { context?: unknown }).context;
    if (ctx instanceof Response) {
      try {
        const j = (await ctx.clone().json()) as { erro?: string };
        if (j?.erro) return { dados: null, erro: j.erro };
      } catch {
        /* sem corpo JSON */
      }
      if (ctx.status === 404) {
        return {
          dados: null,
          erro: 'O serviço de administração não está instalado no servidor (função admin-utilizadores) ou o nginx não encaminha /functions/v1/.',
        };
      }
      return {
        dados: null,
        erro: `O serviço de administração respondeu com erro ${ctx.status}. Confirma que a função admin-utilizadores está instalada no servidor.`,
      };
    }
    return {
      dados: null,
      erro: 'Sem ligação ao serviço de administração (rede, certificado ou /functions/v1/ sem encaminhamento no nginx).',
    };
  }
  const d = data as { erro?: string } & Record<string, unknown>;
  if (d?.erro) return { dados: null, erro: d.erro };
  return { dados: data as T, erro: null };
}

export function listarUtilizadores() {
  return chamar<ListaAdmin & { ok: boolean }>({ acao: 'listar' });
}

export function criarUtilizador(dados: { email: string; nome: string; utilizador: string }) {
  return chamar<CriarUtilizadorResultado & { ok: boolean }>({ acao: 'criar', ...dados });
}

export function novoLinkUtilizador(conta: string) {
  return chamar<{ ok: boolean; conta: string; link: string }>({ acao: 'novo-link', conta });
}
