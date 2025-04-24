
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Turno3Tasks } from '@/types/taskboard';

interface Turno3TasksProps {
  tasks: Turno3Tasks;
  onTaskChange: (task: keyof Turno3Tasks, checked: boolean) => void;
}

export const Turno3TasksComponent: React.FC<Turno3TasksProps> = ({ tasks, onTaskChange }) => {
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
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="fecharServidores"
          checked={tasks.fecharServidores}
          onCheckedChange={(checked) => onTaskChange('fecharServidores', !!checked)}
        />
        <Label htmlFor="fecharServidores" className="cursor-pointer">Fechar Servidores Teste e Produção</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="fecharImpressoras"
          checked={tasks.fecharImpressoras}
          onCheckedChange={(checked) => onTaskChange('fecharImpressoras', !!checked)}
        />
        <Label htmlFor="fecharImpressoras" className="cursor-pointer">Fechar Impressoras e balcões centrais abertos exceto 14 - DSI</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="userFecho"
          checked={tasks.userFecho}
          onCheckedChange={(checked) => onTaskChange('userFecho', !!checked)}
        />
        <Label htmlFor="userFecho" className="cursor-pointer">User Fecho Executar o percurso 7624 Save SYS1OB</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="validarFicheiro"
          checked={tasks.validarFicheiro}
          onCheckedChange={(checked) => onTaskChange('validarFicheiro', !!checked)}
        />
        <Label htmlFor="validarFicheiro" className="cursor-pointer">Validar ficheiro CCLN - 76853</Label>
      </div>
      
      <h4 className="font-medium mt-6 mb-4">Backups Diferidos</h4>
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="bmjrn"
          checked={tasks.bmjrn}
          onCheckedChange={(checked) => onTaskChange('bmjrn', !!checked)}
        />
        <Label htmlFor="bmjrn" className="cursor-pointer">BMJRN (2 tapes/alterar 1 por mês/inicializar no início do mês)</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="grjrcv"
          checked={tasks.grjrcv}
          onCheckedChange={(checked) => onTaskChange('grjrcv', !!checked)}
        />
        <Label htmlFor="grjrcv" className="cursor-pointer">GRJRCV (1 tape)</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="aujrn"
          checked={tasks.aujrn}
          onCheckedChange={(checked) => onTaskChange('aujrn', !!checked)}
        />
        <Label htmlFor="aujrn" className="cursor-pointer">AUJRN (1 tape)</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="mvdia1"
          checked={tasks.mvdia1}
          onCheckedChange={(checked) => onTaskChange('mvdia1', !!checked)}
        />
        <Label htmlFor="mvdia1" className="cursor-pointer">MVDIA1 (eliminar obj. após save N)</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="mvdia2"
          checked={tasks.mvdia2}
          onCheckedChange={(checked) => onTaskChange('mvdia2', !!checked)}
        />
        <Label htmlFor="mvdia2" className="cursor-pointer">MVDIA2 (eliminar obj. após save S)</Label>
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="brjrn"
          checked={tasks.brjrn}
          onCheckedChange={(checked) => onTaskChange('brjrn', !!checked)}
        />
        <Label htmlFor="brjrn" className="cursor-pointer">BRJRN (1 tape)</Label>
      </div>
    </div>
  );
};
