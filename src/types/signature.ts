/**
 * Assinatura eletrónica de uma ficha de procedimentos.
 *
 * Registos antigos (anteriores ao F2) só têm `signerName`, `signedAt` e
 * `imageDataUrl`. Registos novos são assinados por PIN: `method === 'pin'`,
 * `imageDataUrl` fica a null e passa a haver `signerUserId` (identidade
 * autenticada) e `contentHash` (impressão digital SHA-256 do conteúdo da
 * ficha, para deteção de adulteração).
 */
export interface FichaSignature {
  signerName: string;
  signedAt: string;
  imageDataUrl: string | null;
  signerUserId?: string | null;
  contentHash?: string;
  method?: 'pin' | 'legacy';
}

/** Verdadeiro se a ficha está assinada, seja pelo método antigo ou por PIN. */
export function isSigned(sig: Partial<FichaSignature> | null | undefined): boolean {
  if (!sig || !sig.signerName) return false;
  return sig.method === 'pin' || !!sig.signerUserId || !!sig.imageDataUrl;
}
