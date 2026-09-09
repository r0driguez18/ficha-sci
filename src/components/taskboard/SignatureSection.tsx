import React, { useEffect, useState } from 'react';
import { CheckCircle2, PenLine, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { PinDialog } from '@/components/taskboard/PinDialog';
import {
  operatorHasPin,
  setOperatorPin,
  verifyOperatorPin,
} from '@/services/operatorPinService';

/** Sentinela guardada em `signatureDataUrl` do pai — mantém `isValidated` verdadeiro. */
const PIN_SENTINEL = 'pin';

interface SignatureSectionProps {
  /** Nome do signatário (definido aqui a partir da sessão autenticada). */
  signerName: string;
  onSignerNameChange: (v: string) => void;
  signatureDataUrl?: string | null;
  onSignatureChange?: (dataUrl: string | null) => void;
}

function operatorDisplayName(
  user: ReturnType<typeof useAuth>['user'],
): string {
  const meta = user?.user_metadata as { name?: string } | undefined;
  return meta?.name || user?.email || 'Operador';
}

export const SignatureSection: React.FC<SignatureSectionProps> = ({
  signerName,
  onSignerNameChange,
  signatureDataUrl,
  onSignatureChange,
}) => {
  const { user } = useAuth();
  const operatorName = operatorDisplayName(user);
  const signed = signatureDataUrl === PIN_SENTINEL && !!signerName;

  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let active = true;
    operatorHasPin().then((v) => {
      if (active) setHasPin(v);
    });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const handleConfirm = async (pin: string) => {
    if (hasPin) {
      const ok = await verifyOperatorPin(pin);
      return { ok, error: ok ? null : 'PIN incorreto.' };
    }
    const { error } = await setOperatorPin(pin);
    if (error) return { ok: false, error };
    setHasPin(true);
    return { ok: true };
  };

  const handleSuccess = () => {
    onSignerNameChange(operatorName);
    onSignatureChange?.(PIN_SENTINEL);
  };

  const clearSignature = () => {
    onSignerNameChange('');
    onSignatureChange?.(null);
  };

  return (
    <section className="mt-8">
      <div className="mb-3">
        <h3 className="text-base font-medium">Validação e Assinatura Eletrónica</h3>
        <p className="text-sm text-muted-foreground">
          A ficha é assinada por si, com o seu PIN pessoal. A identidade e o carimbo temporal
          ficam registados e são impressos no PDF.
        </p>
      </div>

      <div className="rounded-md border p-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Operador:</span>
          <span className="font-medium">{operatorName}</span>
        </div>

        {signed ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-success/30 bg-success/10 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-success">
                  Assinada eletronicamente por {signerName}
                </span>
                <span className="text-xs text-success/80">
                  A hora e a impressão digital são geradas ao exportar o PDF.
                </span>
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={clearSignature}>
              Remover assinatura
            </Button>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-3">
            <Button
              type="button"
              onClick={() => setDialogOpen(true)}
              disabled={hasPin === null}
              className="gap-2"
            >
              {hasPin === false ? <ShieldCheck className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}
              {hasPin === false ? 'Definir PIN e assinar' : 'Assinar ficha'}
            </Button>
            {hasPin === false && (
              <span className="text-xs text-muted-foreground">
                É a primeira vez — vai definir o seu PIN de 4 dígitos.
              </span>
            )}
          </div>
        )}
      </div>

      <PinDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={hasPin ? 'enter' : 'set'}
        operatorName={operatorName}
        onConfirm={handleConfirm}
        onSuccess={handleSuccess}
      />
    </section>
  );
};

export default SignatureSection;
