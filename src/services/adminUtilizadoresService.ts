import { supabase } from '@/integrations/supabase/client';

export interface UtilizadorAdmin {
  email: string;
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
  email: string;
  nome: string;
  codigo: string;
  link: string;
  jaExistia: boolean;
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
          erro: 'O serviço de administração não está instalado no servidor (função admin-utilizadores).',
        };
      }
    }
    return { dados: null, erro: 'Não consegui contactar o serviço de administração de utilizadores.' };
  }
  const d = data as { erro?: string } & Record<string, unknown>;
  if (d?.erro) return { dados: null, erro: d.erro };
  return { dados: data as T, erro: null };
}

export function listarUtilizadores() {
  return chamar<ListaAdmin & { ok: boolean }>({ acao: 'listar' });
}

export function criarUtilizador(dados: { email: string; nome: string; codigo: string }) {
  return chamar<CriarUtilizadorResultado & { ok: boolean }>({ acao: 'criar', ...dados });
}

export function novoLinkUtilizador(email: string) {
  return chamar<{ ok: boolean; email: string; link: string }>({ acao: 'novo-link', email });
}

/** "Nelson Alves" → "nalves" (inicial do 1.º nome + último apelido, sem acentos). */
export function sugerirCodigo(nome: string): string {
  const partes = nome
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length === 0) return '';
  if (partes.length === 1) return partes[0].slice(0, 20);
  return (partes[0][0] + partes[partes.length - 1]).slice(0, 20);
}
