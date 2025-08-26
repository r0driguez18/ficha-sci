
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
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Processamentos</h3>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onAddRow}
            title="Adicionar linha"
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onRemoveRow}
            title="Remover linha"
            disabled={tableRows.length <= 1}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Hora</TableHead>
            <TableHead className="w-1/5">Tarefa</TableHead>
            <TableHead className="w-1/5">Nome AS400</TableHead>
            <TableHead className="w-24">Nº Operação</TableHead>
            <TableHead className="w-1/5">Tipo de Processamento</TableHead>
            <TableHead className="w-1/5">Executado Por</TableHead>
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
                />
              </TableCell>
              <TableCell>
                <Input 
                  type="text" 
                  value={row.tarefa} 
                  onChange={(e) => onInputChange(row.id, 'tarefa', e.target.value)}
                />
              </TableCell>
              <TableCell>
                <Input 
                  type="text" 
                  value={row.nomeAs} 
                  onChange={(e) => onInputChange(row.id, 'nomeAs', e.target.value)}
                />
              </TableCell>
              <TableCell>
                <Input 
                  type="text" 
                  value={row.operacao} 
                  onChange={(e) => onInputChange(row.id, 'operacao', e.target.value)}
                  pattern="[0-9]*"
                  maxLength={9}
                />
              </TableCell>
              <TableCell>
                <Select 
                  value={row.tipo} 
                  onValueChange={(value) => onInputChange(row.id, 'tipo', value)}
                >
                  <SelectTrigger>
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
                  <SelectTrigger>
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
  );
};
