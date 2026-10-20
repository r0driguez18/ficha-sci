import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, PlusCircle } from 'lucide-react';
import type { TaskTableRow } from '@/types/taskTableRow';

type NovaLinha = Omit<TaskTableRow, 'id'>;

interface AdicionarProcessamentoProps {
  operatorsList: { value: string; label: string }[];
  /** Operador autenticado: vem pré-selecionado em "Executado". */
  executadoPorOmissao: string;
  /** Linhas já preenchidas (mostrado no botão). */
  total: number;
  onAdd: (linha: NovaLinha) => void;
}

const horaAgora = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * Painel flutuante (canto do ecrã) para registar um processamento sem sair do
 * sítio da ficha onde se está: a lista de tarefas continua visível e clicável
 * por trás, e não há scroll até ao fim da tabela. "Adicionar" mantém o painel
 * aberto para registar vários ficheiros seguidos (tipo e executado ficam).
 */
export const AdicionarProcessamento: React.FC<AdicionarProcessamentoProps> = ({
  operatorsList,
  executadoPorOmissao,
  total,
  onAdd,
}) => {
  const [aberto, setAberto] = useState(false);
  const [hora, setHora] = useState('');
  const [tarefa, setTarefa] = useState('');
  const [nomeAs, setNomeAs] = useState('');
  const [operacao, setOperacao] = useState('');
  const [tipo, setTipo] = useState('');
  const [executado, setExecutado] = useState('');
  const [erro, setErro] = useState('');
  const tarefaRef = useRef<HTMLInputElement>(null);

  const abrir = () => {
    setHora(horaAgora());
    setExecutado((e) => e || executadoPorOmissao);
    setErro('');
    setAberto(true);
    setTimeout(() => tarefaRef.current?.focus(), 50);
  };

  const adicionar = () => {
    if (!tarefa.trim() && !nomeAs.trim() && !operacao.trim()) {
      setErro('Indica pelo menos a tarefa, o nome AS400 ou o nº de operação.');
      return;
    }
    onAdd({ hora, tarefa: tarefa.trim(), nomeAs: nomeAs.trim(), operacao: operacao.trim(), tipo, executado });
    setTarefa('');
    setNomeAs('');
    setOperacao('');
    setHora(horaAgora());
    setErro('');
    tarefaRef.current?.focus();
  };

  const teclas = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault();
      adicionar();
    } else if (e.key === 'Escape') {
      setAberto(false);
    }
  };

  if (!aberto) {
    return (
      <Button
        type="button"
        onClick={abrir}
        className="fixed bottom-4 right-4 z-40 h-11 gap-2 rounded-full px-5 shadow-lg"
        title="Registar um processamento sem sair do sítio onde estás"
      >
        <PlusCircle className="h-5 w-5" />
        Processamento{total > 0 ? ` (${total})` : ''}
      </Button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Adicionar processamento"
      className="fixed bottom-4 right-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-lg border bg-card p-4 shadow-xl"
      onKeyDown={teclas}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Adicionar processamento</h3>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAberto(false)} title="Minimizar (Esc)">
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label htmlFor="pa-hora" className="text-xs">Hora</Label>
          <Input id="pa-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="h-9" />
        </div>
        <div className="col-span-2">
          <Label htmlFor="pa-tarefa" className="text-xs">Tarefa</Label>
          <Input id="pa-tarefa" ref={tarefaRef} value={tarefa} onChange={(e) => setTarefa(e.target.value)} className="h-9" />
        </div>
        <div className="col-span-2">
          <Label htmlFor="pa-nome" className="text-xs">Nome AS400</Label>
          <Input id="pa-nome" value={nomeAs} onChange={(e) => setNomeAs(e.target.value)} className="h-9" />
        </div>
        <div>
          <Label htmlFor="pa-op" className="text-xs">Nº Operação</Label>
          <Input
            id="pa-op"
            inputMode="numeric"
            maxLength={9}
            value={operacao}
            onChange={(e) => setOperacao(e.target.value.replace(/\D/g, '').slice(0, 9))}
            className="h-9"
          />
        </div>
        <div className="col-span-3 grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salario">Salário</SelectItem>
                <SelectItem value="cobrancas">Cobranças</SelectItem>
                <SelectItem value="compensacao">Compensação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Executado</Label>
            <Select value={executado} onValueChange={setExecutado}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                {operatorsList.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {erro && <p className="mt-2 text-xs text-destructive">{erro}</p>}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">Enter adiciona · Esc minimiza</span>
        <Button type="button" size="sm" onClick={adicionar} className="gap-1.5">
          <PlusCircle className="h-4 w-4" />
          Adicionar
        </Button>
      </div>
    </div>
  );
};
