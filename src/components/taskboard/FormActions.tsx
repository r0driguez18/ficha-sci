
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Save, FileDown, RotateCcw } from 'lucide-react';

interface FormActionsProps {
  onSave: () => void;
  onExportPDF: () => void;
  onReset: () => void;
  isValidated: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({ onSave, onExportPDF, onReset, isValidated }) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
      <Button
        variant="outline"
        onClick={() => setConfirmReset(true)}
        disabled={!isValidated}
        className="flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Limpar
      </Button>

      <Button
        variant="outline"
        onClick={onExportPDF}
        className="flex items-center gap-2"
      >
        <FileDown className="h-4 w-4" />
        Exportar PDF
      </Button>

      <Button
        onClick={onSave}
        className="flex items-center gap-2 px-6"
      >
        <Save className="h-4 w-4" />
        Guardar
      </Button>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reiniciar a ficha?"
        description="Vai apagar tudo o que está preenchido nesta ficha — todos os turnos, a tabela de processamentos e a assinatura — no ecrã e no servidor. Esta ação não pode ser anulada."
        confirmLabel="Reiniciar ficha"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={onReset}
      />
    </div>
  );
};
