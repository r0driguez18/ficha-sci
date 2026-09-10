import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FileDown, RotateCcw, Loader2 } from 'lucide-react';

interface FormActionsProps {
  /** Exporta o PDF, regista os processamentos e arquiva a ficha no histórico. */
  onExportPDF: () => void;
  onReset: () => void;
  /** A ficha está assinada. Enquanto estiver, "Limpar" fica bloqueado — o passo
   *  seguinte é "Exportar e guardar" (ou "Remover assinatura" para desistir). */
  isSigned: boolean;
  /** Operação em curso — bloqueia os botões. */
  busy?: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({
  onExportPDF,
  onReset,
  isSigned,
  busy = false,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 mt-8 pt-6 border-t">
      {isSigned && (
        <span className="mr-auto text-xs text-muted-foreground">
          Ficha assinada — usa “Exportar e guardar”. Para desistir, remove primeiro a assinatura.
        </span>
      )}

      <Button
        variant="outline"
        onClick={() => setConfirmReset(true)}
        disabled={isSigned || busy}
        title={isSigned ? 'Remove a assinatura antes de limpar' : undefined}
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
        description="Apaga tudo o que está preenchido — todos os turnos e a tabela de processamentos — no ecrã e no servidor. As fichas já exportadas ficam guardadas no Histórico. Esta ação não pode ser anulada."
        confirmLabel="Limpar ficha"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={onReset}
      />
    </div>
  );
};
