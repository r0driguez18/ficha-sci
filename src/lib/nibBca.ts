/**
 * Tratamento de contas → NIB do BCA (para o Gerador PS2).
 *
 * As folhas de salário chegam em muitos formatos: NIB completo (às vezes com
 * um caractere de texto à frente), só a conta, conta + natureza curta
 * (`101`, `10001`, `1`, `10`…), contas de outros bancos, etc. Aqui
 * normaliza-se tudo para o NIB de 21 dígitos que o PS2 precisa:
 *
 *     0003 (banco) + 0000…0 (filler) + conta (preenchida a 8) + natureza (5)
 *
 * A conta é sempre preenchida à esquerda com zeros até 8 (como o
 * `AjustarNIBEstrutura` do VBA). A natureza recebida é convertida pela
 * tabela: índice N (1–9) → `10` + N + (76 − 3·(N−1)).
 *   1→10176 · 2→10273 · 3→10370 · 4→10467 · 5→10564 · 6→10661 · 7→10758 ·
 *   8→10855 · 9→10952
 *
 * Bancos que não são o BCA (`0002`, `0004`, `0005`, `0008`…) ficam de fora
 * do ficheiro. O que não der exatamente 21 dígitos fica em "alerta" para
 * correção manual.
 */

const BANCO_BCA = '0003';

export interface NaturezaRegra {
  /** Índice recebido (1–9) ou a natureza tal como chega. */
  recebida: string;
  /** Natureza final (5 dígitos). */
  final: string;
}

/** Regra por omissão para os índices 1–9. Editável na página. */
export const NATUREZA_PADRAO: NaturezaRegra[] = Array.from({ length: 9 }, (_, i) => {
  const n = i + 1;
  return { recebida: String(n), final: String(10000 + n * 100 + (76 - 3 * (n - 1))) };
});

/** Índice 1–9 de uma natureza recebida (`1`, `10`, `101`, `10001`, `102`…). null = não é sufixo de natureza. */
export function indiceNatureza(s: string): number | null {
  const m = (s || '').replace(/\D/g, '').match(/^1(0*)([1-9])?$/);
  if (!m) return null;
  return m[2] ? Number(m[2]) : 1;
}

/** Natureza final a partir da recebida. null quando não é um sufxo de natureza (já é final). */
export function naturezaFinal(
  recebida: string,
  tabela: NaturezaRegra[] = NATUREZA_PADRAO,
): string | null {
  const idx = indiceNatureza(recebida);
  if (idx == null) return null;
  const regra =
    tabela.find((r) => r.recebida === String(idx)) ??
    tabela.find((r) => r.recebida.replace(/\D/g, '') === String(idx));
  if (regra) return regra.final;
  return String(10000 + idx * 100 + (76 - 3 * (idx - 1)));
}

export type EstadoNib = 'ok' | 'nao-bca' | 'alerta';

export interface NibTratado {
  recebido: string;
  digitos: string;
  conta: string;
  naturezaRecebida: string;
  naturezaFinal: string;
  nib: string;
  estado: EstadoNib;
  motivo?: string;
}

/**
 * Como interpretar o que chega na coluna do "NIB":
 *   auto     — deteta se há natureza no fim e converte-a (heurística);
 *   so-conta — o que chega é SÓ o nº de conta, sem natureza; concatena
 *              `0003` + zeros + conta + `10176` (como a folha Excel);
 *   nib      — já é um NIB completo de 21 dígitos; só limpa e mapeia a
 *              natureza dos últimos 5.
 */
export type ModoConta = 'auto' | 'so-conta' | 'nib';

const NAT_POR_OMISSAO = '10176';

export function tratarNib(
  recebido: string,
  tabela: NaturezaRegra[] = NATUREZA_PADRAO,
  modo: ModoConta = 'auto',
): NibTratado {
  const digitos = (recebido ?? '').replace(/\D/g, '');
  const vazio: NibTratado = {
    recebido,
    digitos,
    conta: '',
    naturezaRecebida: '',
    naturezaFinal: '',
    nib: '',
    estado: 'alerta',
  };

  if (digitos === '') return { ...vazio, motivo: 'Sem dígitos' };

  // Outro banco (começa com 000x, x ≠ 3) → fora do ficheiro.
  if (/^000[124-9]/.test(digitos)) {
    return { ...vazio, estado: 'nao-bca', motivo: `Banco ${digitos.slice(0, 4)} — não BCA` };
  }

  let conta = '';
  let natRec = '';

  if (modo === 'so-conta') {
    // O que chega é o nº de conta e mais nada.
    conta = digitos.startsWith(BANCO_BCA) && digitos.length >= 17 ? digitos.slice(8) : digitos;
    natRec = '1';
  } else if (modo === 'nib') {
    if (!digitos.startsWith(BANCO_BCA) || digitos.length !== 21) {
      return { ...vazio, motivo: `Esperava um NIB de 21 dígitos (tem ${digitos.length})` };
    }
    natRec = digitos.slice(-5);
    conta = digitos.slice(8, 16);
  } else {
    // auto — tira "0003" + agência (4) do início quando há um NIB completo.
    let resto = digitos;
    if (digitos.startsWith(BANCO_BCA) && digitos.length >= 13) resto = digitos.slice(8);
    else if (digitos.startsWith(BANCO_BCA)) resto = digitos.slice(4);

    // Deteta a natureza no fim (5,4,3,2,1 dígitos; a conta tem de ficar 4–8).
    conta = resto;
    for (let n = Math.min(5, resto.length - 1); n >= 1; n--) {
      const cand = resto.slice(-n);
      const acc = resto.slice(0, -n);
      if (indiceNatureza(cand) != null && acc.length >= 4 && acc.length <= 8) {
        conta = acc;
        natRec = cand;
        break;
      }
    }
    if (natRec === '') {
      if (resto.length <= 8) {
        conta = resto;
        natRec = '1';
      } else {
        natRec = resto.slice(-5);
        conta = resto.slice(0, -5);
      }
    }
  }

  const natFin = naturezaFinal(natRec, tabela) ?? natRec ?? NAT_POR_OMISSAO;
  const contaPad = conta.padStart(8, '0');
  const filler = '0'.repeat(Math.max(0, 12 - contaPad.length));
  const nib = BANCO_BCA + filler + contaPad + natFin;

  if (!/^\d{21}$/.test(nib)) {
    return {
      recebido,
      digitos,
      conta: contaPad,
      naturezaRecebida: natRec,
      naturezaFinal: natFin,
      nib,
      estado: 'alerta',
      motivo: `Resultado com ${nib.length} dígitos — corrigir à mão`,
    };
  }

  return {
    recebido,
    digitos,
    conta: contaPad,
    naturezaRecebida: natRec,
    naturezaFinal: natFin,
    nib,
    estado: 'ok',
  };
}
