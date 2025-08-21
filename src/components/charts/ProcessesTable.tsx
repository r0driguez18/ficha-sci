
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
    if (process.as400_name) {
      // Check for Salary processes (starting with SA)
      if (process.as400_name.toUpperCase().startsWith("SA")) {
        return { label: 'Salários', classes: 'bg-orange-100 text-orange-800' };
      }
      
      // Check for Company processes (GA, IM, ENA, INP, BN, FCVT)
      const companyPrefixes = ['GA', 'IM', 'ENA', 'INP', 'BN', 'FCVT'];
      const prefix = process.as400_name.substring(0, 2).toUpperCase();
      const longPrefix = process.as400_name.substring(0, 3).toUpperCase();
      const longLongPrefix = process.as400_name.substring(0, 4).toUpperCase();
      
      if (companyPrefixes.includes(prefix) || companyPrefixes.includes(longPrefix) || companyPrefixes.includes(longLongPrefix)) {
        return { label: 'Processamentos de Empresas', classes: 'bg-blue-100 text-blue-800' };
      }
      
      // Default for other AS400 processes
      return { label: 'Processamentos de Empresas', classes: 'bg-blue-100 text-blue-800' };
    } else if (process.task) {
      return { label: 'Outros Processamentos', classes: 'bg-green-100 text-green-800' };
    }
    return { label: 'Desconhecido', classes: 'bg-gray-100 text-gray-800' };
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
                          className={`px-2 py-1 rounded-full text-xs font-medium ${processType.classes}`}
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
