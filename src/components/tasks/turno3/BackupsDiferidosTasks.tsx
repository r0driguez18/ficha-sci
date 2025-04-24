
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Turno3Tasks } from '@/types/taskboard';

interface BackupsDiferidosTasksProps {
  tasks: Turno3Tasks;
  onTaskChange: (task: keyof Turno3Tasks, checked: boolean) => void;
}

export const BackupsDiferidosTasks: React.FC<BackupsDiferidosTasksProps> = ({ tasks, onTaskChange }) => {
  return (
    <div className="space-y-2">
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
