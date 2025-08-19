import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
          <Label htmlFor="signerName">Validado por</Label>
          <Select value={signerName} onValueChange={onSignerNameChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Nelson Alves">Nelson Alves</SelectItem>
              <SelectItem value="Evandro Tavares">Evandro Tavares</SelectItem>
              <SelectItem value="Emanuel Delgado">Emanuel Delgado</SelectItem>
              <SelectItem value="Louis Spencer">Louis Spencer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label>Assinatura</Label>
        <SignaturePad value={signatureDataUrl} onChange={onSignatureChange} height={100} />
        <p className="text-xs text-muted-foreground">Desenhe a sua assinatura no quadro acima.</p>
      </div>
    </section>
  );
};

export default SignatureSection;
