/**
 * Utilizador de login = o nome sem o email (ex.: "nalves"), como no Windows.
 *
 * O Supabase identifica as contas por email, por isso uma conta criada por um
 * administrador usa internamente "<utilizador>@sci.local" (um endereço que não existe
 * nem recebe nada — o email verdadeiro da pessoa fica guardado à parte). No login,
 * o que não tem "@" completa-se com esse domínio. Contas antigas, com email verdadeiro,
 * continuam a entrar com o email completo.
 *
 * O mesmo valor está em supabase/functions/admin-utilizadores/index.ts (DOMINIO_INTERNO).
 */
export const DOMINIO_INTERNO = 'sci.local';

/** O que se escreveu no login → o email com que o Supabase conhece a conta. */
export function emailDeLogin(entrada: string): string {
  const v = entrada.trim().toLowerCase();
  return v.includes('@') ? v : `${v}@${DOMINIO_INTERNO}`;
}

/** Devolve a mensagem de erro, ou null se o nome de utilizador serve. */
export function validarUtilizador(v: string): string | null {
  if (!/^[a-z][a-z0-9_]{2,19}$/.test(v.trim().toLowerCase())) {
    return 'O utilizador deve ter 3 a 20 caracteres (letras minúsculas, números ou _), sem @, e começar por uma letra.';
  }
  return null;
}

/** "Nelson Alves" → "nalves" (inicial do 1.º nome + último apelido, sem acentos). */
export function sugerirUtilizador(nome: string): string {
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
