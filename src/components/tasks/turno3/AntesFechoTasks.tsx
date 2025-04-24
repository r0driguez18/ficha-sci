
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Turno3Tasks } from '@/types/taskboard';

interface AntesFechoTasksProps {
  tasks: Turno3Tasks;
  onTaskChange: (task: keyof Turno3Tasks, checked: boolean) => void;
  onTimeChange?: (field: string, value: string) => void;
  fechoRealTime?: string;
  inicioFecho?: string;
}

export const AntesFechoTasks: React.FC<AntesFechoTasksProps> = ({ 
  tasks, 
  onTaskChange,
  onTimeChange,
  fechoRealTime,
  inicioFecho
}) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium mb-4">Antes do Fecho</h4>
      
      <div className="space-y-2">
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="verificarDebitos3" 
            checked={tasks.verificarDebitos}
            onCheckedChange={(checked) => onTaskChange('verificarDebitos', !!checked)}
          />
          <Label htmlFor="verificarDebitos3" className="cursor-pointer">
            Verificar Débitos/Créditos Aplicados no Turno Anterior
          </Label>
        </div>
        
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="tratarTapes"
            checked={tasks.tratarTapes}
            onCheckedChange={(checked) => onTaskChange('tratarTapes', !!checked)}
          />
          <Label htmlFor="tratarTapes" className="cursor-pointer">
            Tratar e trocar Tapes BM, BMBCK – percurso 7622
          </Label>
        </div>

        {/* ... Continue with other checks before Fecho Real-Time */}

        <div className="flex items-center gap-4 my-4">
          <Checkbox 
            id="fecharRealTime"
            checked={tasks.fecharRealTime}
            onCheckedChange={(checked) => onTaskChange('fecharRealTime', !!checked)}
          />
          <Label htmlFor="fecharRealTime" className="cursor-pointer min-w-[200px]">
            Interromper o Real-Time com a SISP
          </Label>
          <div className="flex items-center gap-2">
            <Label htmlFor="fechoRealTime">Fecho Real-Time:</Label>
            <Input
              id="fechoRealTime"
              type="time"
              value={fechoRealTime}
              onChange={(e) => onTimeChange?.('fechoRealTime', e.target.value)}
              className="w-32"
            />
          </div>
        </div>

        {/* ... Continue with checks between Real-Time and Inicio Fecho */}

        <div className="flex items-center gap-4 my-4">
          <Checkbox 
            id="inicioFecho"
            checked={tasks.inicioFecho}
            onCheckedChange={(checked) => onTaskChange('inicioFecho', !!checked)}
          />
          <Label htmlFor="inicioFecho" className="cursor-pointer min-w-[200px]">
            Início do Fecho
          </Label>
          <div className="flex items-center gap-2">
            <Label htmlFor="inicioFechoTime">Hora:</Label>
            <Input
              id="inicioFechoTime"
              type="time"
              value={inicioFecho}
              onChange={(e) => onTimeChange?.('inicioFecho', e.target.value)}
              className="w-32"
            />
          </div>
        </div>

        {/* ... Continue with remaining checks */}
      </div>
    </div>
  );
};
