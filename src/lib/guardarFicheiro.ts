/**
 * Grava um ficheiro deixando a pessoa escolher a pasta e mudar o nome antes
 * de gravar — "Guardar como" nativo do browser (API File System Access,
 * suportada em Chrome/Edge). O Chromium lembra-se da última pasta usada
 * nesta app entre gravações, por isso ao fim da 1.ª vez passa a abrir
 * sempre na mesma pasta.
 *
 * Em browsers sem suporte (Firefox, Safari) cai no download clássico: vai
 * para a pasta de downloads do browser, com o nome sugerido.
 *
 * Devolve true se gravou, false se a pessoa cancelou o diálogo (não é erro).
 */

export interface OpcoesGuardar {
  /** Nome sugerido (pré-preenchido no diálogo "Guardar como" e usado tal qual no download clássico). */
  sugestaoNome: string;
  /** Tipo mime do Blob, quando `dados` não é já um Blob. */
  tipoMime?: string;
  /** Extensão e descrição para o filtro do diálogo "Guardar como" (ex.: ".txt"). */
  extensao?: string;
  descricaoTipo?: string;
}

interface JanelaComSaveFilePicker {
  showSaveFilePicker?: (opcoes: {
    suggestedName?: string;
    types?: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<{
    createWritable: () => Promise<{
      write: (dados: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
}

export async function guardarFicheiro(
  dados: Blob | Uint8Array | string,
  opcoes: OpcoesGuardar,
): Promise<boolean> {
  const blob = dados instanceof Blob ? dados : new Blob([dados], opcoes.tipoMime ? { type: opcoes.tipoMime } : undefined);

  const picker = (window as unknown as JanelaComSaveFilePicker).showSaveFilePicker;
  if (typeof picker === 'function') {
    try {
      const handle = await picker({
        suggestedName: opcoes.sugestaoNome,
        types: opcoes.extensao
          ? [{ description: opcoes.descricaoTipo ?? 'Ficheiro', accept: { [opcoes.tipoMime ?? 'text/plain']: [opcoes.extensao] } }]
          : undefined,
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return false; // cancelou o diálogo
      // Qualquer outro erro (ex.: permissão): cai no download clássico em baixo.
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = opcoes.sugestaoNome;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
