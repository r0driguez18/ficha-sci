
import React, { useEffect, useRef, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { HoraInput } from '@/components/ui/hora-input';
import { ChevronDown, ChevronRight, PlusCircle, Trash2 } from 'lucide-react';
import { TaskTableRow } from '@/types/taskTableRow';

interface TableRowsSectionProps {
  tableRows: TaskTableRow[];
  operatorsList: { value: string; label: string }[];
  onAddRow: () => void;
  onRemoveRow: (id: number) => void;
  onInputChange: (id: number, field: keyof TaskTableRow, value: string) => void;
}

export const TableRowsSection: React.FC<TableRowsSectionProps> = ({
  tableRows,
  operatorsList,
  onAddRow,
  onRemoveRow,
  onInputChange,
}) => {
  const focarNova = useRef(false);
  const preenchidas = tableRows.filter((r) => r.tarefa || r.nomeAs || r.operacao || r.tipo).length;
  // Com muitos processamentos a tabela começa recolhida: a lista de tarefas fica à vista
  // e os processamentos regista-se pelo painel flutuante.
  const [aberta, setAberta] = useState(preenchidas <= 3);

  /** Adiciona uma linha e, quando ela aparece, leva o cursor ao primeiro campo dela. */
  const adicionar = () => {
    focarNova.current = true;
    setAberta(true);
    onAddRow();
  };

  useEffect(() => {
    if (!focarNova.current) return;
    focarNova.current = false;
    const ultima = tableRows[tableRows.length - 1];
    const linha = document.querySelector<HTMLElement>(`[data-linha="${ultima.id}"]`);
    if (!linha) return;
    linha.scrollIntoView({ block: 'center', behavior: 'smooth' });
    linha.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
  }, [tableRows]);

  return (
    <div className="mt-8 pt-6 border-t">
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={() => setAberta((a) => !a)}
          aria-expanded={aberta}
          className="flex items-center gap-1.5 text-base font-semibold text-foreground hover:text-primary"
        >
          {aberta ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Processamentos
          <span className="text-sm font-normal text-muted-foreground">({preenchidas})</span>
        </button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={adicionar}
            title="Adicionar linha"
            className="gap-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>
      
      {aberta && (
      <>
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
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.map((row) => (
              <TableRow key={row.id} data-linha={row.id}>
                <TableCell>
                  <HoraInput
                    value={row.hora}
                    onChange={(v) => onInputChange(row.id, 'hora', v)}
                    aria-label="Hora"
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
                    onKeyDown={(e) => {
                      // Enter no Nº Operação da última linha preenchida abre a linha seguinte.
                      if (e.key === 'Enter' && row.id === tableRows[tableRows.length - 1].id && row.operacao.trim()) {
                        e.preventDefault();
                        adicionar();
                      }
                    }}
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
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveRow(row.id)}
                    disabled={tableRows.length <= 1}
                    title="Remover esta linha"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Ao fim da lista: com muitas linhas, não é preciso voltar ao topo para adicionar a seguinte. */}
      <Button variant="outline" onClick={adicionar} className="mt-3 w-full gap-1.5 border-dashed">
        <PlusCircle className="h-4 w-4" />
        Adicionar linha
      </Button>
      </>
      )}
    </div>
  );
};
