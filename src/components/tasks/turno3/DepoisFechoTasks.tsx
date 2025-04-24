
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Turno3Tasks } from '@/types/taskboard';

interface DepoisFechoTasksProps {
  tasks: Turno3Tasks;
  onTaskChange: (task: keyof Turno3Tasks, checked: boolean) => void;
}

export const DepoisFechoTasks: React.FC<DepoisFechoTasksProps> = ({ tasks, onTaskChange }) => {
  return (
    <div className="space-y-2">
      <h4 className="font-medium mt-6 mb-4">Depois do Fecho</h4>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="validarFicheiroCcln"
          checked={tasks.validarFicheiroCcln}
          onCheckedChange={(checked) => onTaskChange('validarFicheiroCcln', !!checked)}
        />
        <Label htmlFor="validarFicheiroCcln" className="cursor-pointer">Validar ficheiro CCLN - 76853</Label>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox 
          id="aplicarFicheirosCompensacao"
          checked={tasks.aplicarFicheirosCompensacao}
          onCheckedChange={(checked) => onTaskChange('aplicarFicheirosCompensacao', !!checked)}
        />
        <Label htmlFor="aplicarFicheirosCompensacao" className="cursor-pointer">Aplicar ficheiros compensação SISP (CCLN, EDST, EORI, ERMB)</Label>
      </div>

      <div className="ml-6 flex space-x-4 mb-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="saldoNegativo"
            checked={tasks.saldoNegativo}
            onCheckedChange={(checked) => onTaskChange('saldoNegativo', !!checked)}
          />
          <Label htmlFor="saldoNegativo" className="cursor-pointer">Negativo</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="saldoPositivo"
            checked={tasks.saldoPositivo}
            onCheckedChange={(checked) => onTaskChange('saldoPositivo', !!checked)}
          />
          <Label htmlFor="saldoPositivo" className="cursor-pointer">Positivo</Label>
        </div>
      </div>

      {/* ... Continue with other "Depois do Fecho" tasks */}
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="transferirFicheirosDsi"
          checked={tasks.transferirFicheirosDsi}
          onCheckedChange={(checked) => onTaskChange('transferirFicheirosDsi', !!checked)}
        />
        <Label htmlFor="transferirFicheirosDsi" className="cursor-pointer">Transferência ficheiros SSM Liquidity ExercicesDSI-CI/2023</Label>
      </div>
    </div>
  );
};
