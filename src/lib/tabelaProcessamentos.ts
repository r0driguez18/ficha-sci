/**
 * Das aplicações do dia (core) para a tabela de Processamentos da ficha.
 *
 * A tabela alimenta o PDF e a Estatística, e continua a poder ser preenchida à mão (se o worker falhar, por exemplo). Por
 * isso aqui só se juntam as operações que AINDA NÃO estão na tabela: uma linha escrita à mão para o mesmo ficheiro conta
 * como já feita (a da pessoa fica como está) e correr isto duas vezes não repete nada.
 */
import type { OperacaoAplicada } from './aplicacoesDia';
import { tipoDaOperacao } from './cobrancasDc';
import type { TaskTableRow } from '@/types/taskTableRow';

/** O texto da coluna «Tarefa» para uma operação vinda do core (a pessoa pode editá-lo na tabela). */
export function tarefaDaOperacao(o: OperacaoAplicada): string {
  const nome = o.ficheiro.trim() || o.referencia.trim() || (o.empresa ?? '').trim() || 'ficheiro';
  return `Aplicação ${nome}`;
}

const norm = (s: string | null | undefined) => (s ?? '').trim().toUpperCase();

export interface LinhasParaTabela {
  /** As linhas a acrescentar (sem `id`), por ordem de hora. */
  novas: Omit<TaskTableRow, 'id'>[];
  /** Operações que já tinham linha na tabela (à mão ou de um preenchimento anterior). */
  jaExistiam: number;
}

/**
 * @param operacoes   as operações a registar (já filtradas: janela da ficha, operadores, só aplicações)
 * @param existentes  as linhas que a tabela já tem
 * @param operadores  os códigos dos operadores da app (ex.: «nalves»), para a coluna «Executado por»
 */
export function linhasParaTabela(operacoes: OperacaoAplicada[], existentes: TaskTableRow[], operadores: string[]): LinhasParaTabela {
  const codigos = new Map(operadores.map((o) => [norm(o), o]));
  const usadas = new Set<number>();
  const novas: Omit<TaskTableRow, 'id'>[] = [];
  let jaExistiam = 0;

  for (const o of operacoes) {
    const tarefa = tarefaDaOperacao(o);
    const executado = codigos.get(norm(o.utilizador)) ?? o.utilizador.trim().toLowerCase();
    // Uma linha existente "é esta operação" se tem o mesmo ficheiro (e, quando ambas têm, o mesmo nº de operação); sem
    // nome de ficheiro, se tem a mesma tarefa, hora e executante. Cada linha existente só serve uma operação (o mesmo
    // ficheiro aplicado duas vezes conta duas).
    const i = existentes.findIndex(
      (r, idx) =>
        !usadas.has(idx) &&
        (o.ficheiro
          ? norm(r.nomeAs) === norm(o.ficheiro) && (!r.operacao.trim() || !o.nOperacao || r.operacao.trim() === o.nOperacao)
          : r.tarefa.trim() === tarefa && r.hora === o.hora && norm(r.executado) === norm(executado)),
    );
    if (i >= 0) {
      usadas.add(i);
      jaExistiam++;
      continue;
    }
    novas.push({ hora: o.hora, tarefa, nomeAs: o.ficheiro, operacao: o.nOperacao ?? '', executado, tipo: tipoDaOperacao(o) });
  }
  novas.sort((a, b) => a.hora.localeCompare(b.hora));
  return { novas, jaExistiam };
}
