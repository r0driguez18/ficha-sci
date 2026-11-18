/**
 * Cobranças dentro dos DC (débitos/créditos por lotes): as empresas (ACEMP da GBAPL) que são cobranças. TODAS têm retorno
 * (prazo/SLA). Os outros DC (ex.: salários) não. A comparação ignora espaços nas pontas e maiúsculas.
 */
import type { OperacaoAplicada } from './aplicacoesDia';

export const EMPRESAS_COBRANCAS = [
  'IMPAR', 'GARANTIA', 'P_COM_SISP', 'CHIPOWER', 'ELECTRA', 'ELECTRA1', 'DIRECTEL',
  'CVT_CIRCUI', 'CVT_FIXO', 'CVT_INTERN', 'CVT_MOVEL', 'CVT_PACOTE', 'CVT_PESSOL', 'CVT_RESI', 'CVT_ZAPTV',
  'QUOTAS2', 'QUOTAS1', 'SINDICATO',
] as const;

/** Os três tipos de processamento da ficha. */
export type TipoProcessamento = 'compensacao' | 'cobrancas' | 'salario';

export const ROTULO_TIPO: Record<TipoProcessamento, string> = {
  compensacao: 'Compensação',
  cobrancas: 'Cobranças',
  salario: 'Salário',
};

const normaliza = (s: string) => s.trim().toUpperCase();
const CONJUNTO = new Set<string>(EMPRESAS_COBRANCAS.map(normaliza));

export function ehEmpresaDeCobranca(empresa: string | null | undefined): boolean {
  return !!empresa && CONJUNTO.has(normaliza(empresa));
}

/**
 * Os ficheiros de cobrança que precisam de retorno: DC de empresa de cobrança que foram APLICADOS (uma validação, sem
 * movimentos aplicados, não tem retorno). Um nome por ficheiro: o mesmo ficheiro aplicado duas vezes no dia é um só retorno
 * (a base de dados também o garante: único por ficheiro e data). Sem nome de ficheiro usa-se «empresa nº-operação».
 */
export function cobrancasParaRetorno(operacoes: OperacaoAplicada[]): string[] {
  const nomes: string[] = [];
  for (const o of operacoes) {
    if (o.modulo !== 'DC' || !ehEmpresaDeCobranca(o.empresa) || o.tipo === 'V' || (o.aplicados ?? 0) <= 0) continue;
    const nome = o.ficheiro.trim() || `${(o.empresa ?? '').trim()} ${o.nOperacao ?? ''}`.trim();
    if (nome && !nomes.includes(nome)) nomes.push(nome);
  }
  return nomes;
}

/**
 * Em que tipo cai uma operação:
 *  - fora do módulo DC (cheques, transferências, SISP…, vindos do registo de ficheiros processados): Compensação;
 *  - DC de uma empresa de cobrança (lista acima): Cobranças;
 *  - qualquer outro DC (débitos/créditos por lotes): Salário.
 */
export function tipoDaOperacao(o: Pick<OperacaoAplicada, 'modulo' | 'empresa'>): TipoProcessamento {
  if (o.modulo !== 'DC') return 'compensacao';
  return ehEmpresaDeCobranca(o.empresa) ? 'cobrancas' : 'salario';
}
