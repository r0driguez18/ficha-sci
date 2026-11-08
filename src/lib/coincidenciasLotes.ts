/**
 * Coincidências entre ficheiros PS2 (para a «Verificação»): uma empresa que paga a mesma folha mês a mês tem o mesmo
 * total, mas com um mês de intervalo — isso é normal. Já o mesmo valor, na mesma conta, poucos dias depois, é suspeito
 * (ficheiro aplicado duas vezes). Por isso só conta como coincidência quando os ficheiros foram gerados com poucos dias
 * de diferença (a janela é escolhida pelo operador).
 */
import type { Ps2Lote } from '@/services/ps2LotesService';

/** Janelas (em dias) que se podem escolher. */
export const JANELAS_DIAS = [1, 3, 5, 7, 15] as const;
export const JANELA_PADRAO = 5;

export type MotivoCoincidencia = 'mesmo-conteudo' | 'mesmo-valor';

export interface Coincidencia {
  lote: Ps2Lote;
  motivo: MotivoCoincidencia;
  /** Dias entre as duas gerações (arredondado, sempre ≥ 0). */
  diasDeDiferenca: number;
  /** Também tem o mesmo número de registos (reforça a suspeita). */
  mesmosRegistos: boolean;
}

const MS_DIA = 24 * 60 * 60 * 1000;
const cents = (n: number) => Math.round(Number(n) * 100);

/**
 * Para cada ficheiro, os outros que coincidem: o mesmo conteúdo (sempre) ou a mesma conta, o mesmo sentido e o mesmo
 * total gerados com até `janelaDias` dias de diferença. Mapa: id do ficheiro → coincidências (só entram os que têm).
 */
export function coincidenciasDosLotes(lotes: readonly Ps2Lote[], janelaDias: number = JANELA_PADRAO): Map<string, Coincidencia[]> {
  const saida = new Map<string, Coincidencia[]>();
  // Agrupa pela chave (conta + sentido + total) para não comparar tudo com tudo.
  const grupos = new Map<string, Ps2Lote[]>();
  for (const l of lotes) {
    const k = `${l.conta_empresa}|${l.sentido}|${cents(l.total)}`;
    const g = grupos.get(k);
    if (g) g.push(l);
    else grupos.set(k, [l]);
  }
  const porHash = new Map<string, Ps2Lote[]>();
  for (const l of lotes) {
    const g = porHash.get(l.hash_ficheiro);
    if (g) g.push(l);
    else porHash.set(l.hash_ficheiro, [l]);
  }

  const juntar = (a: Ps2Lote, b: Ps2Lote, motivo: MotivoCoincidencia) => {
    const dias = Math.abs(new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) / MS_DIA;
    const lista = saida.get(a.id) ?? [];
    const existente = lista.find((c) => c.lote.id === b.id);
    if (existente) {
      if (motivo === 'mesmo-conteudo') existente.motivo = motivo;
      return;
    }
    lista.push({ lote: b, motivo, diasDeDiferenca: Math.round(dias), mesmosRegistos: a.n_registos === b.n_registos });
    saida.set(a.id, lista);
  };

  for (const g of porHash.values()) {
    if (g.length < 2) continue;
    for (const a of g) for (const b of g) if (a.id !== b.id) juntar(a, b, 'mesmo-conteudo');
  }
  for (const g of grupos.values()) {
    if (g.length < 2) continue;
    for (const a of g) {
      for (const b of g) {
        if (a.id === b.id) continue;
        const dias = Math.abs(new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) / MS_DIA;
        if (dias <= janelaDias) juntar(a, b, 'mesmo-valor');
      }
    }
  }
  for (const lista of saida.values()) lista.sort((x, y) => x.diasDeDiferenca - y.diasDeDiferenca);
  return saida;
}
