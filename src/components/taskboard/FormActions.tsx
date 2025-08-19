
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, FileDown, RotateCcw } from 'lucide-react';

interface FormActionsProps {
  onSave: () => void;
  onExportPDF: () => void;
  onReset: () => void;
  isValidated: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({ onSave, onExportPDF, onReset, isValidated }) => {
  return (
    <div className="flex justify-end space-x-4 mt-8">
      <Button
        variant="outline"
        onClick={onReset}
        disabled={!isValidated}
        className="flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Limpar
      </Button>
      
      <Button
        variant="outline"
        onClick={onExportPDF}
        disabled={!isValidated}
        className="flex items-center gap-2"
      >
        <FileDown className="h-4 w-4" />
        Exportar PDF
      </Button>
      
      <Button
        onClick={onSave}
        className="flex items-center gap-2"
      >
        <Save className="h-4 w-4" />
        Guardar
      </Button>
    </div>
  );
};
