
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';

export interface TaskTableRow {
  id: number;
  hora: string;
  tarefa: string;
  nomeAs: string;
  operacao: string;
  executado: string;
}

interface TableRowsProps {
  tableRows: TaskTableRow[];
  operatorsList: { value: string; label: string }[];
  onAddRow: () => void;
  onRemoveRow: () => void;
  onInputChange: (id: number, field: keyof TaskTableRow, value: string) => void;
}

export const TaskboardTableRows: React.FC<TableRowsProps> = ({
  tableRows,
  operatorsList,
  onAddRow,
  onRemoveRow,
  onInputChange
}) => {
  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead>Tarefa</TableHead>
              <TableHead>Nome AS400</TableHead>
              <TableHead>Nº Operação</TableHead>
              <TableHead>Executado Por</TableHead>
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
                    maxLength={9}
                  />
                </TableCell>
                <TableCell>
                  <Select 
                    value={row.executado}
                    onValueChange={(value) => onInputChange(row.id, 'executado', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorsList.map((op) => (
                        <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex justify-end mt-4 space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAddRow}
          className="flex items-center"
        >
          <PlusCircle className="w-4 h-4 mr-1" /> Adicionar Linha
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRemoveRow}
          disabled={tableRows.length <= 1}
          className="flex items-center"
        >
          <Trash2 className="w-4 h-4 mr-1" /> Remover Linha
        </Button>
      </div>
    </>
  );
};
