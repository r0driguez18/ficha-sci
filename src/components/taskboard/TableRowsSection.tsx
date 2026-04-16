
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { TaskTableRow } from '@/types/taskTableRow';

interface TableRowsSectionProps {
  tableRows: TaskTableRow[];
  operatorsList: { value: string; label: string }[];
  onAddRow: () => void;
  onRemoveRow: () => void;
  onInputChange: (id: number, field: keyof TaskTableRow, value: string) => void;
}

export const TableRowsSection: React.FC<TableRowsSectionProps> = ({
  tableRows,
  operatorsList,
  onAddRow,
  onRemoveRow,
  onInputChange,
}) => {
  return (
    <div className="mt-8 pt-6 border-t">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold text-foreground">Processamentos</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onAddRow}
            title="Adicionar linha"
            className="gap-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            Adicionar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRemoveRow}
            title="Remover linha"
            disabled={tableRows.length <= 1}
            className="gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            Remover
          </Button>
        </div>
      </div>
      
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-20 font-semibold text-xs uppercase">Hora</TableHead>
              <TableHead className="w-1/4 font-semibold text-xs uppercase">Tarefa</TableHead>
              <TableHead className="w-1/5 font-semibold text-xs uppercase">Nome AS400</TableHead>
              <TableHead className="w-32 font-semibold text-xs uppercase">Nº Operação</TableHead>
              <TableHead className="w-28 font-semibold text-xs uppercase">Tipo</TableHead>
              <TableHead className="w-28 font-semibold text-xs uppercase">Executado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Input 
                    type="time" 
                    value={row.hora} 
                    onChange={(e) => onInputChange(row.id, 'hora', e.target.value)}
                    className="h-9"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="text" 
                    value={row.tarefa} 
                    onChange={(e) => onInputChange(row.id, 'tarefa', e.target.value)}
                    className="h-9"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="text" 
                    value={row.nomeAs} 
                    onChange={(e) => onInputChange(row.id, 'nomeAs', e.target.value)}
                    className="h-9"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="text" 
                    value={row.operacao} 
                    onChange={(e) => onInputChange(row.id, 'operacao', e.target.value)}
                    pattern="[0-9]*"
                    maxLength={9}
                    className="min-w-[110px] h-9"
                  />
                </TableCell>
                <TableCell>
                  <Select 
                    value={row.tipo} 
                    onValueChange={(value) => onInputChange(row.id, 'tipo', value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salario">Salário</SelectItem>
                      <SelectItem value="cobrancas">Cobranças</SelectItem>
                      <SelectItem value="compensacao">Compensação</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select 
                    value={row.executado} 
                    onValueChange={(value) => onInputChange(row.id, 'executado', value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorsList.map(op => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
