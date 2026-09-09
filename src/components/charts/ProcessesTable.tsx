import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { FileProcess } from '@/services/fileProcessService';
import { useOperators } from '@/hooks/useOperators';

interface ProcessesTableProps {
  processes: FileProcess[];
  title?: string;
}

const PAGE_SIZE = 25;

const TIPO: Record<string, { label: string; classes: string }> = {
  salario: { label: 'Salário', classes: 'bg-warning/15 text-warning' },
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
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(processes.length / PAGE_SIZE));

  // Se a lista encolher (mudança de filtro), não ficar numa página inexistente.
  useEffect(() => {
    setPage(0);
  }, [processes]);

  const rows = useMemo(
    () => processes.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [processes, page],
  );

  const from = processes.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(processes.length, (page + 1) * PAGE_SIZE);

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

        {processes.length > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-4 text-sm">
            <span className="text-muted-foreground tabular-nums">
              {from}–{to} de {processes.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Anterior
              </Button>
              <span className="tabular-nums text-muted-foreground">
                {page + 1} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
              >
                Seguinte
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessesTable;
