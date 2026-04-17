import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";

interface SignatureSectionProps {
  signerName: string;
  onSignerNameChange: (v: string) => void;
  // keep remaining props to avoid breaking Taskboard component interfaces immediately
  signatureDataUrl?: string | null;
  onSignatureChange?: (dataUrl: string | null) => void;
}

export const SignatureSection: React.FC<SignatureSectionProps> = ({
  signerName,
  onSignerNameChange,
  onSignatureChange
}) => {

  const handleSignerChange = (value: string) => {
    onSignerNameChange(value);
    // When a user is selected, automatically validate the signature step with a checkmark representation
    if (onSignatureChange) {
      onSignatureChange("signed_by_" + value); 
    }
  };

  return (
    <section className="mt-8">
      <div className="mb-3">
        <h3 className="text-base font-medium">Validação e Assinatura Eletrónica</h3>
        <p className="text-sm text-muted-foreground">Selecione o seu nome para assumir a validação desta ficha.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col space-y-2">
          <Label htmlFor="signerName">Validado por</Label>
          <Select value={signerName} onValueChange={handleSignerChange}>
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

      {signerName && (
        <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-md flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-green-800">
              Validado eletronicamente por {signerName}
            </span>
            <span className="text-xs text-green-600">
              Esta identidade será impressa no relatório final PDF.
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

export default SignatureSection;
