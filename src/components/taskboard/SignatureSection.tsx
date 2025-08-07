import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SignaturePad } from "@/components/ui/signature-pad";

interface SignatureSectionProps {
  signerName: string;
  onSignerNameChange: (v: string) => void;
  signatureDataUrl: string | null;
  onSignatureChange: (dataUrl: string | null) => void;
}

export const SignatureSection: React.FC<SignatureSectionProps> = ({
  signerName,
  onSignerNameChange,
  signatureDataUrl,
  onSignatureChange,
}) => {
  return (
    <section className="mt-8">
      <div className="mb-3">
        <h3 className="text-base font-medium">Validação e Assinatura</h3>
        <p className="text-sm text-muted-foreground">Assinatura digital do responsável pela validação da ficha.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="signerName">Nome do responsável</Label>
          <Input
            id="signerName"
            placeholder="Ex: João Silva"
            value={signerName}
            onChange={(e) => onSignerNameChange(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label>Assinatura</Label>
        <SignaturePad value={signatureDataUrl} onChange={onSignatureChange} />
        <p className="text-xs text-muted-foreground">Desenhe a sua assinatura no quadro acima.</p>
      </div>
    </section>
  );
};

export default SignatureSection;
