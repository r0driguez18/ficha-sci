
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Save, FileDown, RotateCcw, Loader2 } from 'lucide-react';

interface FormActionsProps {
  onSave: () => void;
  onExportPDF: () => void;
  onReset: () => void;
  isValidated: boolean;
  /** Operação em curso (guardar / exportar) — bloqueia os botões. */
  busy?: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({
  onSave,
  onExportPDF,
  onReset,
  isValidated,
  busy = false,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
      <Button
        variant="outline"
        onClick={() => setConfirmReset(true)}
        disabled={!isValidated || busy}
        className="flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Limpar
      </Button>

      <Button
        variant="outline"
        onClick={onExportPDF}
        disabled={busy}
        className="flex items-center gap-2"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        Exportar PDF
      </Button>

      <Button
        onClick={onSave}
        disabled={busy}
        className="flex items-center gap-2 px-6"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
