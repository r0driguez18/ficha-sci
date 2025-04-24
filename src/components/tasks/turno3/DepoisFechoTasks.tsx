
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Turno3Tasks } from '@/types/taskboard';

interface DepoisFechoTasksProps {
  tasks: Turno3Tasks;
  onTaskChange: (task: keyof Turno3Tasks, checked: boolean) => void;
  onTimeChange?: (field: string, value: string) => void;
  aberturaRealTime?: string;
  terminoFecho?: string;
}

export const DepoisFechoTasks: React.FC<DepoisFechoTasksProps> = ({ 
  tasks, 
  onTaskChange,
  onTimeChange,
  aberturaRealTime,
  terminoFecho
}) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium mb-4">Depois do Fecho</h4>
      
      <div className="space-y-2">
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="validarFicheiroCcln" 
            checked={tasks.validarFicheiroCcln}
            onCheckedChange={(checked) => onTaskChange('validarFicheiroCcln', !!checked)}
          />
          <Label htmlFor="validarFicheiroCcln" className="cursor-pointer">
            Validar ficheiro CCLN - 76853
          </Label>
        </div>

        <div className="flex items-center gap-4 my-4">
          <Checkbox 
            id="abrirRealTime"
            checked={tasks.abrirRealTime}
            onCheckedChange={(checked) => onTaskChange('abrirRealTime', !!checked)}
          />
          <Label htmlFor="abrirRealTime" className="cursor-pointer min-w-[200px]">
            Abrir o Real-Time com a SISP
          </Label>
          <div className="flex items-center gap-2">
            <Label htmlFor="aberturaRealTime">Abertura Real-Time:</Label>
            <Input
              id="aberturaRealTime"
              type="time"
              value={aberturaRealTime}
              onChange={(e) => onTimeChange?.('aberturaRealTime', e.target.value)}
              className="w-32"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 my-4">
          <Checkbox 
            id="terminoFecho"
            checked={tasks.terminoFecho}
            onCheckedChange={(checked) => onTaskChange('terminoFecho', !!checked)}
          />
          <Label htmlFor="terminoFecho" className="cursor-pointer min-w-[200px]">
            Término do Fecho
          </Label>
          <div className="flex items-center gap-2">
            <Label htmlFor="terminoFechoTime">Hora:</Label>
            <Input
              id="terminoFechoTime"
              type="time"
              value={terminoFecho}
              onChange={(e) => onTimeChange?.('terminoFecho', e.target.value)}
              className="w-32"
            />
          </div>
        </div>

        <h4 className="font-medium mt-6 mb-4">Impressões</h4>
        
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="impressaoCheques"
            checked={tasks.impressaoCheques}
            onCheckedChange={(checked) => onTaskChange('impressaoCheques', !!checked)}
          />
          <Label htmlFor="impressaoCheques" className="cursor-pointer">
            Impressão Cheques e respectivos Diários (verificação dos mesmos)
          </Label>
        </div>
        
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="arquivarCheques"
            checked={tasks.arquivarCheques}
            onCheckedChange={(checked) => onTaskChange('arquivarCheques', !!checked)}
          />
          <Label htmlFor="arquivarCheques" className="cursor-pointer">
            Arquivar Cheques e respectivos Diários
          </Label>
        </div>
      </div>
    </div>
  );
};
