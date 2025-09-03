import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExportedTaskboard } from '@/services/exportedTaskboardService';
import { CheckCircle, XCircle, Clock, User, Calendar, FileText } from 'lucide-react';

// Define form type labels locally since we're dealing with string values from DB
const formTypeLabels = {
  "dia-util": "Taskboard Normal",
  "dia-nao-util": "Taskboard Dia Não Útil", 
  "final-mes-util": "Taskboard Final do Mês Útil",
  "final-mes-nao-util": "Taskboard Final do Mês Não Útil"
};

interface TaskboardPreviewProps {
  taskboard: ExportedTaskboard;
}

export const TaskboardPreview: React.FC<TaskboardPreviewProps> = ({ taskboard }) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT');
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-PT');
  };

  const getTurnLabel = (turn: number) => {
    return `${turn}º Turno`;
  };

  const getTaskStatus = (completed: boolean) => {
    return completed ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Tipo</p>
              <Badge variant="outline">{formTypeLabels[taskboard.form_type as keyof typeof formTypeLabels]}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Data</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(taskboard.date)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Exportado em</p>
              <p className="text-sm">{formatDateTime(taskboard.exported_at)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Assinado por</p>
              <p className="font-medium flex items-center gap-1">
                <User className="h-4 w-4" />
                {taskboard.pdf_signature.signerName}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations Table */}
      {taskboard.table_rows && taskboard.table_rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Operações Executadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Hora</th>
                    <th className="text-left p-2">Nome AS/400</th>
                    <th className="text-left p-2">Operação</th>
                    <th className="text-left p-2">Executado Por</th>
                    <th className="text-left p-2">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {taskboard.table_rows.map((row, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{row.hora}</td>
                      <td className="p-2">{row.nomeAs}</td>
                      <td className="p-2">{row.operacao}</td>
                      <td className="p-2">{row.executado}</td>
                      <td className="p-2">{row.tipo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signature Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Assinatura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Assinado por: <span className="font-normal">{taskboard.pdf_signature.signerName}</span></p>
              <p className="text-sm font-medium">Data/Hora: <span className="font-normal">{taskboard.pdf_signature.signedAt}</span></p>
              <p className="text-sm font-medium">Nome do arquivo: <span className="font-normal">{taskboard.file_name}</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskboardPreview;