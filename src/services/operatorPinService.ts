import { supabase } from '@/integrations/supabase/client';

/**
 * PIN de assinatura do operador (F2). Toda a lógica de hash vive no servidor
 * (funções SECURITY DEFINER + pgcrypto); estes wrappers só chamam os RPC.
 */

/** `true` / `false` = tem ou não PIN; `null` = não foi possível verificar (erro). */
export async function operatorHasPin(): Promise<boolean | null> {
  const { data, error } = await supabase.rpc('operator_has_pin');
  if (error) {
    console.error('Erro ao verificar PIN do operador:', error);
    return null;
  }
  return data === true;
}

export async function setOperatorPin(newPin: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('set_operator_pin', { new_pin: newPin });
  return { error: error ? error.message : null };
}

export async function changeOperatorPin(
  currentPin: string,
  newPin: string,
): Promise<{ ok: boolean; error: string | null }> {
  const { data, error } = await supabase.rpc('change_operator_pin', {
    current_pin: currentPin,
    new_pin: newPin,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: data === true, error: data === true ? null : 'PIN atual incorreto' };
}

/**
 * Verifica o PIN. Em caso de sucesso o servidor devolve um token de
 * assinatura de uso único (válido 10 min) — é o que prova, mais tarde,
 * que esta verificação aconteceu mesmo; a própria devolução de um token
 * não pode ser forjada no cliente. `error` só vem preenchido em casos
 * excecionais (ex. bloqueio temporário por demasiadas tentativas); um
 * PIN simplesmente errado só devolve `token: null`.
 */
export async function verifyOperatorPin(
  pin: string,
): Promise<{ token: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('verify_operator_pin', { pin });
  if (error) {
    console.error('Erro ao verificar PIN:', error);
    return { token: null, error: error.message };
  }
  return { token: data ?? null, error: null };
}

/** Gasta o token de assinatura — obrigatório antes de gravar a ficha assinada. */
export async function consumirTokenAssinatura(token: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('consumir_token_assinatura', { p_token: token });
  return { error: error ? error.message : null };
}
