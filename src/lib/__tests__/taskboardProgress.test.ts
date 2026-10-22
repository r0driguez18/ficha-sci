import { describe, expect, it } from 'vitest';
import { countTaskProgress } from '../taskboardProgress';
import { emptyTasks } from '../taskboardDefaults';

/** Marca todas as caixas reais de um turno (como faria uma pessoa a marcar tudo no ecrã). */
function marcarTudo(turno: Record<string, unknown>) {
  const t = { ...turno };
  for (const k of Object.keys(t)) if (typeof t[k] === 'boolean') t[k] = true;
  // O ecrã não deixa ter os dois: marcar um desmarca o outro.
  if ('saldoNegativo' in t) t.saldoPositivo = false;
  return t;
}

describe('countTaskProgress: o total é o número de caixas que se vêem no ecrã', () => {
  const tasks = emptyTasks();

  it('os totais de cada turno batem com as caixas reais (medidas na app: 35, 20 e 54)', () => {
    expect(countTaskProgress(tasks.turno1).total).toBe(35);
    expect(countTaskProgress(tasks.turno2).total).toBe(20);
    expect(countTaskProgress(tasks.turno3).total).toBe(54);
  });

  it('começa a zero', () => {
    for (const t of [tasks.turno1, tasks.turno2, tasks.turno3]) expect(countTaskProgress(t).done).toBe(0);
  });

  it('marcar tudo chega ao total, em todos os turnos (já não fica 35/38, 20/22…)', () => {
    for (const t of [tasks.turno1, tasks.turno2, tasks.turno3]) {
      const p = countTaskProgress(marcarTudo(t as unknown as Record<string, unknown>));
      expect(p.done).toBe(p.total);
    }
  });

  it('os campos sem caixa no ecrã não contam, estejam ou não marcados', () => {
    const t1 = { ...tasks.turno1, bcta: true, backupsDiferidos: true, envioFicheirosVisa12h30: true };
    expect(countTaskProgress(t1)).toEqual({ done: 0, total: 35 });
    const t2 = { ...tasks.turno2, inpsProcessar: true, envioFicheirosVisaPafCaf: true };
    expect(countTaskProgress(t2)).toEqual({ done: 0, total: 20 });
  });

  it('um rascunho antigo com campos já removidos do modelo também não os conta', () => {
    expect(countTaskProgress({ ...tasks.turno2, enviarEnvIma: true, campoQueJaNaoExiste: true })).toEqual({ done: 0, total: 20 });
  });

  it('Saldo negativo/positivo conta como UMA tarefa: qualquer um dos dois a faz', () => {
    const base = tasks.turno3;
    expect(countTaskProgress({ ...base, saldoNegativo: true })).toEqual({ done: 1, total: 54 });
    expect(countTaskProgress({ ...base, saldoPositivo: true })).toEqual({ done: 1, total: 54 });
    expect(countTaskProgress({ ...base, saldoNegativo: false, saldoPositivo: false }).done).toBe(0);
  });

  it('texto e horas continuam a não contar', () => {
    const r = countTaskProgress({ datacenter: true, sistemas: false, hora: '10:00', saldoContaValor: '5' });
    expect(r).toEqual({ done: 1, total: 2 });
  });

  it('com a lista de chaves de uma secção só conta essas (blocos do Turno 3)', () => {
    expect(countTaskProgress({ datacenter: true, sistemas: false, servicos: true }, ['datacenter', 'sistemas'])).toEqual({ done: 1, total: 2 });
    expect(countTaskProgress({ datacenter: true }, ['datacenter', 'naoExiste'])).toEqual({ done: 1, total: 1 });
  });

  it('sem dados devolve zeros', () => {
    expect(countTaskProgress(null)).toEqual({ done: 0, total: 0 });
    expect(countTaskProgress(undefined)).toEqual({ done: 0, total: 0 });
  });
});
