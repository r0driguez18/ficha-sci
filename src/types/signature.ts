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
  /** Presente quando um administrador retificou a ficha depois de exportada (ver `editar_ficha_exportada`). */
  /** Quem exportou apesar de a data não bater com o tipo da ficha (ou estar atrasada), e porquê. Fora do selo. */
  confirmacaoData?: { motivo: string; avisos: string[]; por: string; em: string };
  retificacao?: { versao: number; por: string; porUserId: string; em: string; motivo: string };
}

/** Verdadeiro se a ficha está assinada, seja pelo método antigo ou por PIN. */
export function isSigned(sig: Partial<FichaSignature> | null | undefined): boolean {
  if (!sig || !sig.signerName) return false;
  return sig.method === 'pin' || !!sig.signerUserId || !!sig.imageDataUrl;
}
