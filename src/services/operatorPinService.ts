import { supabase } from '@/integrations/supabase/client';

/**
 * PIN de assinatura do operador (F2). Toda a lógica de hash vive no servidor
 * (funções SECURITY DEFINER + pgcrypto); estes wrappers só chamam os RPC.
 */

export async function operatorHasPin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('operator_has_pin');
  if (error) {
    console.error('Erro ao verificar PIN do operador:', error);
    return false;
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

export async function verifyOperatorPin(pin: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('verify_operator_pin', { pin });
  if (error) {
    console.error('Erro ao verificar PIN:', error);
    return false;
  }
  return data === true;
}
