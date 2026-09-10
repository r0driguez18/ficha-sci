import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FileDown, RotateCcw, Loader2 } from 'lucide-react';

interface FormActionsProps {
  /** Exporta o PDF, regista os processamentos e arquiva a ficha no histórico. */
  onExportPDF: () => void;
  onReset: () => void;
  isValidated: boolean;
  /** Operação em curso — bloqueia os botões. */
  busy?: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({
  onExportPDF,
  onReset,
  isValidated,
  busy = false,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="flex flex-wrap justify-end gap-3 mt-8 pt-6 border-t">
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
        onClick={onExportPDF}
        disabled={busy}
        className="flex items-center gap-2 px-6"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        Exportar e guardar
      </Button>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Limpar a ficha?"
        description="Apaga tudo o que está preenchido — todos os turnos, a tabela de processamentos e a assinatura — no ecrã e no servidor. As fichas já exportadas ficam guardadas no Histórico. Esta ação não pode ser anulada."
        confirmLabel="Limpar ficha"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={onReset}
      />
    </div>
  );
};
