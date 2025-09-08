
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { FileProcess } from '@/services/fileProcessService';

interface ProcessesTableProps {
  processes: FileProcess[];
  title?: string;
}

const ProcessesTable: React.FC<ProcessesTableProps> = ({ processes, title = "Últimos Processamentos" }) => {
const getProcessType = (process: FileProcess) => {
    if (process.tipo) {
      switch (process.tipo) {
        case 'salario':
          return { label: 'Salário', classes: 'bg-warning/10 text-warning-foreground border-warning/20' };
        case 'cobrancas':
          return { label: 'Cobranças', classes: 'bg-info/10 text-info-foreground border-info/20' };
        case 'compensacao':
          return { label: 'Compensação', classes: 'bg-success/10 text-success-foreground border-success/20' };
        default:
          return { label: 'Outros', classes: 'bg-muted text-muted-foreground border-border' };
      }
    }
    return { label: 'Sem Categoria', classes: 'bg-muted text-muted-foreground border-border' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Tarefa</TableHead>
                <TableHead>Nome AS/400</TableHead>
                <TableHead>Operação</TableHead>
                <TableHead>Executado Por</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processes.length > 0 ? (
                processes.map((process) => {
                  const processType = getProcessType(process);
                  return (
                    <TableRow key={process.id}>
                      <TableCell>
                        {process.date_registered ? format(new Date(process.date_registered), 'dd/MM/yyyy') : ''}
                      </TableCell>
                      <TableCell>{process.time_registered}</TableCell>
                      <TableCell>{process.task}</TableCell>
                      <TableCell>{process.as400_name}</TableCell>
                      <TableCell>{process.operation_number}</TableCell>
                      <TableCell>{process.executed_by}</TableCell>
                      <TableCell>
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${processType.classes}`}
                        >
                          {processType.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                    Nenhum processo encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessesTable;
