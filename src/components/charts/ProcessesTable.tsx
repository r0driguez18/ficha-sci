import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePaginacao } from '@/hooks/usePaginacao';
import { Paginacao } from '@/components/ui/paginacao';
import { format } from 'date-fns';
import { FileProcess } from '@/services/fileProcessService';
import { useOperators } from '@/hooks/useOperators';

interface ProcessesTableProps {
  processes: FileProcess[];
  title?: string;
}

const TIPO: Record<string, { label: string; classes: string }> = {
  salario: { label: 'Salário', classes: 'bg-warning/20 text-foreground' },
  cobrancas: { label: 'Cobranças', classes: 'bg-primary/15 text-primary' },
  compensacao: { label: 'Compensação', classes: 'bg-success/15 text-success' },
};

function typeBadge(process: FileProcess) {
  return process.tipo && TIPO[process.tipo]
    ? TIPO[process.tipo]
    : { label: process.tipo ? process.tipo : 'Outros', classes: 'bg-muted text-muted-foreground' };
}

const ProcessesTable: React.FC<ProcessesTableProps> = ({ processes, title = 'Últimos Processamentos' }) => {
  const { labelOf } = useOperators();
  const pag = usePaginacao(processes);
  const rows = pag.itens;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>{title}</span>
          <span className="text-sm font-normal text-muted-foreground tabular-nums">
            {processes.length} registos
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Tarefa</TableHead>
                <TableHead>Nome AS/400</TableHead>
                <TableHead>Operação</TableHead>
                <TableHead>Executado por</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((process) => {
                  const badge = typeBadge(process);
                  return (
                    <TableRow key={process.id}>
                      <TableCell className="tabular-nums">
                        {process.date_registered ? format(new Date(process.date_registered), 'dd/MM/yyyy') : ''}
                      </TableCell>
                      <TableCell className="tabular-nums">{process.time_registered}</TableCell>
                      <TableCell>{process.task}</TableCell>
                      <TableCell>{process.as400_name}</TableCell>
                      <TableCell className="tabular-nums">{process.operation_number}</TableCell>
                      <TableCell>{labelOf(process.executed_by) || process.executed_by}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.classes}`}>
                          {badge.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    Nenhum processo encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Paginacao p={pag} />
      </CardContent>
    </Card>
  );
};

export default ProcessesTable;
