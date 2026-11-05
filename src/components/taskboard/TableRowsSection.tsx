
import React, { useEffect, useRef, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronRight, PlusCircle, Trash2 } from 'lucide-react';
import { TaskTableRow } from '@/types/taskTableRow';
import { blocosDaTabela } from '@/lib/blocosTabela';

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
  // Blocos de 20 linhas (uma folha A4): os já cheios minimizam-se sozinhos; qualquer folha se abre ou minimiza à mão.
  const blocos = blocosDaTabela(tableRows);
  const [abertos, setAbertos] = useState<Set<number>>(new Set());
  const [fechados, setFechados] = useState<Set<number>>(new Set());
  const estaMinimizado = (i: number, atual: boolean) => fechados.has(i) || (!atual && !abertos.has(i));
  const alternarBloco = (i: number, atual: boolean) => {
    const abrir = estaMinimizado(i, atual);
    const com = (s: Set<number>, add: boolean) => {
      const n = new Set(s);
      if (add) n.add(i);
      else n.delete(i);
      return n;
    };
    setAbertos((a) => com(a, abrir));
    setFechados((f) => com(f, !abrir));
  };
  const preenchidas = tableRows.filter((r) => r.tarefa || r.nomeAs || r.operacao || r.tipo).length;
  // Com muitos processamentos a tabela começa recolhida: a lista de tarefas fica à vista
  // e os processamentos regista-se pelo painel flutuante.
  const [aberta, setAberta] = useState(preenchidas <= 3);

  /** Adiciona uma linha e, quando ela aparece, leva o cursor ao primeiro campo dela. */
  const adicionar = () => {
    focarNova.current = true;
    setAberta(true);
    // Ao adicionar, a folha onde a linha vai cair abre-se.
    const ultimo = blocosDaTabela([...tableRows, null]).length - 1;
    setFechados((f) => {
      if (!f.has(ultimo)) return f;
      const n = new Set(f);
      n.delete(ultimo);
      return n;
    });
    onAddRow();
  };

  useEffect(() => {
    if (!focarNova.current) return;
    focarNova.current = false;
    const ultima = tableRows[tableRows.length - 1];
    const linha = document.querySelector<HTMLElement>(`[data-linha="${ultima.id}"]`);
    if (!linha) return;
    linha.scrollIntoView({ block: 'center', behavior: 'smooth' });
    // Brilho que se apaga: mostra onde a linha nova caiu. Tira-se a classe no fim para voltar a poder repetir.
    linha.classList.remove('linha-nova');
    void linha.offsetWidth;
    linha.classList.add('linha-nova');
    window.setTimeout(() => linha.classList.remove('linha-nova'), 800);
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
          <ChevronRight className="rodar-seta h-4 w-4" data-aberto={aberta} />
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
            {blocos.map((bloco) => {
              const minimizado = estaMinimizado(bloco.indice, bloco.atual);
              return (
                <React.Fragment key={bloco.indice}>
                  {blocos.length > 1 && (
                    <TableRow className="bg-muted/30 hover:bg-muted/50">
                      <TableCell colSpan={7} className="py-1.5">
                        <button
                          type="button"
                          onClick={() => alternarBloco(bloco.indice, bloco.atual)}
                          aria-expanded={!minimizado}
                          className="flex w-full items-center gap-1.5 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          <ChevronRight className="rodar-seta h-3.5 w-3.5" data-aberto={!minimizado} />
                          Folha {bloco.indice + 1} · linhas {bloco.de}–{bloco.ate}
                          <span className="ml-auto font-normal">{minimizado ? 'mostrar' : 'minimizar'}</span>
                        </button>
                      </TableCell>
                    </TableRow>
                  )}
                  {!minimizado && bloco.linhas.map((row) => (
              <TableRow key={row.id} data-linha={row.id}>
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
                </React.Fragment>
              );
            })}
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
