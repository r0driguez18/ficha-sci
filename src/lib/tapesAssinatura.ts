/**
 * Nas fichas com folha de verificação de tapes, "Verificado por" (quem fez o display) é obrigatório:
 * sem isso a ficha não se exporta. Há fichas antigas arquivadas sem esse nome — o Histórico assinala-as.
 */

export const NOME_TAPES_MIN = 2;

/** O nome de quem verificou as tapes está preenchido (ignora espaços e traços soltos)? */
export function tapesAssinadas(verificadoPor: unknown): boolean {
  const s = String(verificadoPor ?? '').replace(/[\s\-–—_.]+/g, '');
  return s.length >= NOME_TAPES_MIN;
}

/** Ficha já exportada com folha de tapes mas sem o nome de quem fez o display. */
export function fichaSemAssinaturaTapes(
  tapesStatus: string | null | undefined,
  turnData: unknown,
): boolean {
  if (!tapesStatus || tapesStatus === 'nao_aplicavel') return false;
  const vt = (turnData as { verificacaoTapes?: { verificadoPor?: unknown } } | null | undefined)?.verificacaoTapes;
  return !tapesAssinadas(vt?.verificadoPor);
}
