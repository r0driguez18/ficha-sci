
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface SaldoContaFieldProps {
  checked: boolean;
  saldoValue: string;
  saldoNegativo: boolean;
  saldoPositivo: boolean;
  onCheckedChange: (checked: boolean | "indeterminate") => void;
  onSaldoValueChange: (value: string) => void;
  onSaldoNegativoChange: (checked: boolean | "indeterminate") => void;
  onSaldoPositivoChange: (checked: boolean | "indeterminate") => void;
}

export const SaldoContaField: React.FC<SaldoContaFieldProps> = ({
  checked,
  saldoValue,
  saldoNegativo,
  saldoPositivo,
  onCheckedChange,
  onSaldoValueChange,
  onSaldoNegativoChange,
  onSaldoPositivoChange
}) => {
  return (
    <>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="validarSaldoConta" 
          checked={checked}
          onCheckedChange={onCheckedChange}
        />
        <Label htmlFor="validarSaldoConta" className="cursor-pointer flex-grow ml-2">
          Validar saldo da conta 18/5488102:
        </Label>
        <Input
          type="text"
          value={saldoValue || ""}
          onChange={(e) => onSaldoValueChange(e.target.value)}
          className="w-32 ml-2"
          placeholder="0.00"
        />
      </div>
      
      <div className="ml-6 flex space-x-4 mb-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="saldoNegativo"
            checked={saldoNegativo}
            onCheckedChange={onSaldoNegativoChange}
          />
          <Label htmlFor="saldoNegativo" className="cursor-pointer">Negativo</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="saldoPositivo"
            checked={saldoPositivo}
            onCheckedChange={onSaldoPositivoChange}
          />
          <Label htmlFor="saldoPositivo" className="cursor-pointer">Positivo</Label>
        </div>
      </div>
    </>
  );
};
