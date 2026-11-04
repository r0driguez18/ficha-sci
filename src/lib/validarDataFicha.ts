/**
 * Validação da data de uma ficha: apanha datas trocadas (ex.: escrever dia 2 em vez de 1).
 *
 *  • futura                          → erro (bloqueia a exportação)
 *  • dia que não bate com o tipo     → aviso (ficha de "dia útil" num fim de semana/feriado, ou "dia não útil"
 *                                      num dia útil)
 *  • muito atrasada face a hoje      → aviso
 *
 * Os avisos pedem confirmação em vez de bloquear: há feriados locais que o calendário pode não conhecer.
 */
import { ehFeriadoCaboVerde } from './feriadosCaboVerde';

export interface ProblemaData {
  gravidade: 'erro' | 'aviso';
  mensagem: string;
}

/** Dias de atraso a partir dos quais a data da ficha merece confirmação. */
export const ATRASO_AVISO_DIAS = 3;

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

function paraData(iso: string): Date | null {
  const m = ISO.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getFullYear() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]) ? d : null;
}

const NAO_UTIL = new Set(['dia-nao-util', 'final-mes-nao-util']);

/** O calendário diz que este dia é não útil (fim de semana ou feriado)? */
export function diaNaoUtil(iso: string): boolean {
  const d = paraData(iso);
  if (!d) return false;
  return d.getDay() === 0 || d.getDay() === 6 || ehFeriadoCaboVerde(d);
}

const NOMES_DIA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

export function validarDataFicha(formType: string, date: string, hoje: string): ProblemaData[] {
  const d = paraData(date);
  const h = paraData(hoje);
  if (!d) return [{ gravidade: 'erro', mensagem: 'A data da ficha não é válida.' }];
  if (!h) return [];

  const problemas: ProblemaData[] = [];
  const dias = Math.round((h.getTime() - d.getTime()) / 86_400_000);

  if (dias < 0) {
    problemas.push({ gravidade: 'erro', mensagem: `A data da ficha (${date}) ainda não chegou — não se pode exportar uma ficha no futuro.` });
  }

  const esperadaNaoUtil = diaNaoUtil(date);
  const ehNaoUtil = NAO_UTIL.has(formType);
  const nome = NOMES_DIA[d.getDay()];
  if (ehNaoUtil && !esperadaNaoUtil) {
    problemas.push({ gravidade: 'aviso', mensagem: `A ficha é de "dia não útil", mas ${date} é ${nome}, um dia útil.` });
  } else if (!ehNaoUtil && esperadaNaoUtil) {
    problemas.push({ gravidade: 'aviso', mensagem: `A ficha é de "dia útil", mas ${date} é ${nome} (fim de semana ou feriado).` });
  }

  if (dias > ATRASO_AVISO_DIAS) {
    problemas.push({ gravidade: 'aviso', mensagem: `A data da ficha (${date}) é de há ${dias} dias.` });
  }
  return problemas;
}

/**
 * Para fichas já exportadas (Histórico): a data da ficha não bate com o tipo, ou foi exportada muito depois
 * (ou antes) do dia a que diz respeito.
 */
export function dataSuspeitaExportada(formType: string, date: string, exportadaEm: string | null): string | null {
  const d = paraData(date);
  if (!d) return 'Data inválida.';
  const ehNaoUtil = NAO_UTIL.has(formType);
  if (ehNaoUtil !== diaNaoUtil(date)) {
    return ehNaoUtil
      ? `Ficha de dia não útil num dia útil (${NOMES_DIA[d.getDay()]}).`
      : `Ficha de dia útil num dia não útil (${NOMES_DIA[d.getDay()]}).`;
  }
  if (exportadaEm) {
    const e = new Date(exportadaEm);
    if (!Number.isNaN(e.getTime())) {
      const dias = Math.floor((new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime() - d.getTime()) / 86_400_000);
      if (dias < 0) return `Exportada ${-dias} dia(s) antes da data da ficha.`;
      if (dias > ATRASO_AVISO_DIAS) return `Exportada ${dias} dias depois da data da ficha.`;
    }
  }
  return null;
}
