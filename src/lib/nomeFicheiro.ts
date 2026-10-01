/**
 * Nome de ficheiro escrito à mão (campo "Nome do ficheiro") + extensão fixa.
 *
 * O campo só mostra o nome; a extensão aparece ao lado, fora do campo, e não
 * dá para editá-la na interface. Mesmo assim, para o caso de o valor chegar
 * aqui com algo parecido com uma extensão (colado, ou escrito por engano),
 * tira-se sempre essa parte antes de acrescentar a extensão certa — nunca
 * sai um ficheiro ".csv" ou ".txt.txt" onde devia ser ".txt".
 */
export function comExtensao(nomeBase: string, extensao: string): string {
  const semExtensao = nomeBase.trim().replace(/\.[A-Za-z0-9]{1,8}$/, '');
  return (semExtensao || 'ficheiro') + extensao;
}

/** Nome de um ficheiro (ex.: "PS2_20261001.txt") sem a extensão, para pré-preencher o campo. */
export function semExtensao(nomeFicheiro: string): string {
  return nomeFicheiro.replace(/\.[A-Za-z0-9]{1,8}$/, '');
}
