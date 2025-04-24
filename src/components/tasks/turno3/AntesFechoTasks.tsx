
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Turno3Tasks } from '@/types/taskboard';

interface AntesFechoTasksProps {
  tasks: Turno3Tasks;
  onTaskChange: (task: keyof Turno3Tasks, checked: boolean) => void;
}

export const AntesFechoTasks: React.FC<AntesFechoTasksProps> = ({ tasks, onTaskChange }) => {
  return (
    <div className="space-y-2">
      <h4 className="font-medium mb-4">Antes do Fecho</h4>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="verificarDebitos3" 
          checked={tasks.verificarDebitos}
          onCheckedChange={(checked) => onTaskChange('verificarDebitos', !!checked)}
        />
        <Label htmlFor="verificarDebitos3" className="cursor-pointer">Verificar Débitos/Créditos Aplicados no Turno Anterior</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="tratarTapes"
          checked={tasks.tratarTapes}
          onCheckedChange={(checked) => onTaskChange('tratarTapes', !!checked)}
        />
        <Label htmlFor="tratarTapes" className="cursor-pointer">Tratar e trocar Tapes BM, BMBCK – percurso 7622</Label>
      </div>

      {/* Add all other "Antes do Fecho" tasks */}
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="backupBm"
          checked={tasks.backupBm}
          onCheckedChange={(checked) => onTaskChange('backupBm', !!checked)}
        />
        <Label htmlFor="backupBm" className="cursor-pointer">Backup BM – Automático</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="validarFicheiroCcln"
          checked={tasks.validarFicheiroCcln}
          onCheckedChange={(checked) => onTaskChange('validarFicheiroCcln', !!checked)}
        />
        <Label htmlFor="validarFicheiroCcln" className="cursor-pointer">Validar ficheiro CCLN - 76853</Label>
      </div>
    </div>
  );
};
