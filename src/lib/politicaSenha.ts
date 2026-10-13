/** Tamanho mínimo da palavra-passe que a pessoa escolhe (o servidor só exige 6). */
export const SENHA_MIN = 8;

/** Devolve a mensagem de erro, ou null se a palavra-passe serve. */
export function validarSenha(senha: string, confirmacao: string): string | null {
  if (senha.length < SENHA_MIN) return `A palavra-passe deve ter pelo menos ${SENHA_MIN} caracteres.`;
  if (senha !== confirmacao) return 'As palavras-passe não coincidem.';
  return null;
}

/** Marca em `user_metadata` que a conta ainda tem uma palavra-passe que a pessoa não escolheu. */
export const CHAVE_TROCA_OBRIGATORIA = 'must_change_password';

export function precisaTrocarSenha(userMetadata: Record<string, unknown> | undefined | null): boolean {
  return userMetadata?.[CHAVE_TROCA_OBRIGATORIA] === true;
}
