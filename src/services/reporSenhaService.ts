import { supabase } from '@/integrations/supabase/client';

/**
 * "Esqueceu a senha?": a pessoa prova quem é com o utilizador + o PIN de assinatura e escolhe a senha
 * nova. Sem sessão (quem esqueceu a senha não a tem). A verificação e os limites estão no servidor
 * (função repor-senha).
 */
export async function reporSenhaPorPin(
  utilizador: string,
  pin: string,
  novaSenha: string,
): Promise<{ erro: string | null }> {
  const { data, error } = await supabase.functions.invoke('repor-senha', {
    body: { utilizador, pin, novaSenha },
  });

  if (error) {
    const ctx = (error as { context?: unknown }).context;
    if (ctx instanceof Response) {
      try {
        const j = (await ctx.clone().json()) as { erro?: string };
        if (j?.erro) return { erro: j.erro };
      } catch {
        /* sem corpo JSON */
      }
      return { erro: 'Não foi possível repor a senha agora. Pede ao administrador um link novo.' };
    }
    return { erro: 'Sem ligação ao servidor. Tenta de novo ou pede ao administrador um link novo.' };
  }

  const d = data as { erro?: string; ok?: boolean } | null;
  if (d?.erro) return { erro: d.erro };
  return d?.ok ? { erro: null } : { erro: 'Resposta inesperada do servidor.' };
}
