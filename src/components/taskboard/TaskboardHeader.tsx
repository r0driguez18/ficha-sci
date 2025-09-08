import React, { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, AlertCircle } from 'lucide-react';

interface TaskboardHeaderProps {
  date: string;
  onDateChange: (date: string) => void;
  completedTasksCount: number;
  validTableRowsCount: number;
  isEndOfMonth: boolean;
}

export const TaskboardHeader = memo<TaskboardHeaderProps>(({
  date,
  onDateChange,
  completedTasksCount,
  validTableRowsCount,
  isEndOfMonth
}) => {
  return (
    <Card className="hover-card-effect">
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              <Calendar className="h-6 w-6 text-primary" />
              Ficha de Tarefas Diárias
            </CardTitle>
            <CardDescription className="mt-2 text-base">
              Controle operacional das atividades por turno
            </CardDescription>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Badge 
              variant={completedTasksCount > 0 ? "default" : "secondary"}
              className="flex items-center gap-1 px-3 py-1"
            >
              <CheckCircle className="h-4 w-4" />
              {completedTasksCount} tarefas
            </Badge>
            
            <Badge 
              variant={validTableRowsCount > 0 ? "default" : "secondary"}
              className="flex items-center gap-1 px-3 py-1"
            >
              <AlertCircle className="h-4 w-4" />
              {validTableRowsCount} registros
            </Badge>
            
            {isEndOfMonth && (
              <Badge variant="destructive" className="animate-pulse">
                Final do Mês
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="date" className="text-sm font-medium">
              Data da Operação
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TaskboardHeader.displayName = 'TaskboardHeader';