/**
 * Das aplicações do dia (core) para a tabela de Processamentos da ficha.
 *
 * A tabela alimenta o PDF e a Estatística, e continua a poder ser preenchida à mão (se o worker falhar, por exemplo). A
 * «Tarefa» fica vazia nas linhas do core: o core não a traz. Por isso aqui só se juntam as operações que AINDA NÃO estão na tabela: uma linha escrita à mão para o mesmo ficheiro conta
 * como já feita (a da pessoa fica como está) e correr isto duas vezes não repete nada.
 */
import type { OperacaoAplicada } from './aplicacoesDia';
import { tipoDaOperacao } from './cobrancasDc';
import type { TaskTableRow } from '@/types/taskTableRow';

const norm = (s: string | null | undefined) => (s ?? '').trim().toUpperCase();

/**
 * Ordem das linhas na ficha: a ficha corre das 07:00 às 07:00 do dia seguinte, por isso a madrugada (antes das 07:00) vem
 * depois da noite. Sem hora válida, a linha vai para o fim.
 */
function minutosNaFicha(hora: string): number {
  const m = /^(\d{1,2}):(\d{2})/.exec((hora ?? '').trim());
  if (!m) return Number.MAX_SAFE_INTEGER;
  const h = Number(m[1]);
  return (h < 7 ? h + 24 : h) * 60 + Number(m[2]);
}

/** Ordena por hora (estável: à mesma hora, mantém a ordem em que estavam). */
export function ordenarPorHora<T extends { hora: string }>(linhas: T[]): T[] {
  return linhas
    .map((l, i) => ({ l, i, k: minutosNaFicha(l.hora) }))
    .sort((a, b) => a.k - b.k || a.i - b.i)
    .map((x) => x.l);
}

/** O texto fala deste ficheiro como uma palavra inteira (ex.: «ECI2611181», ou «Aplicação ECI2611181 ok»)? */
function mencionaFicheiro(texto: string | null | undefined, ficheiro: string): boolean {
  const t = norm(texto);
  const f = norm(ficheiro);
  if (!t || !f) return false;
  if (t === f) return true;
  const escapado = f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^A-Z0-9])${escapado}([^A-Z0-9]|$)`).test(t);
}

export interface LinhasParaTabela {
  /** As linhas a acrescentar (sem `id`), por ordem de hora. */
  novas: Omit<TaskTableRow, 'id'>[];
  /** Operações que já tinham linha na tabela (à mão ou de um preenchimento anterior). */
  jaExistiam: number;
  /** Linhas escritas à mão que não correspondem a nenhuma operação do core (podem estar repetidas, ou ser de outra coisa). */
  manuaisSemCorrespondencia: number;
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
    const tipo = tipoDaOperacao(o);
    const executado = codigos.get(norm(o.utilizador)) ?? o.utilizador.trim().toLowerCase();
    // Uma linha existente "é esta operação" se fala do mesmo ficheiro — no Nome AS400 ou na Tarefa, onde também se escreve
    // o nome (e, quando ambas têm, com o mesmo nº de operação); sem nome de ficheiro, se também veio do core à mesma
    // hora, com o mesmo tipo e executante. Cada linha existente só serve uma operação (o mesmo ficheiro aplicado duas
    // vezes conta duas).
    const i = existentes.findIndex(
      (r, idx) =>
        !usadas.has(idx) &&
        (o.ficheiro
          ? (norm(r.nomeAs) === norm(o.ficheiro) || mencionaFicheiro(r.tarefa, o.ficheiro)) &&
            (!r.operacao.trim() || !o.nOperacao || r.operacao.trim() === o.nOperacao)
          : r.origem === 'core' && !r.nomeAs.trim() && r.hora === o.hora && r.tipo === tipo && norm(r.executado) === norm(executado)),
    );
    if (i >= 0) {
      usadas.add(i);
      jaExistiam++;
      continue;
    }
    novas.push({ hora: o.hora, tarefa: '', nomeAs: o.ficheiro, operacao: o.nOperacao ?? '', executado, tipo, origem: 'core' });
  }
  const ordenadas = ordenarPorHora(novas);
  const comConteudo = (r: TaskTableRow) => !!(r.tarefa.trim() || r.nomeAs.trim() || r.operacao.trim() || r.tipo.trim());
  const manuaisSemCorrespondencia = existentes.filter((r, idx) => !usadas.has(idx) && r.origem !== 'core' && comConteudo(r)).length;
  return { novas: ordenadas, jaExistiam, manuaisSemCorrespondencia };
}
