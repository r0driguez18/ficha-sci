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

import { toast } from 'sonner';

export interface OpcoesGuardar {
  /** Nome sugerido (pré-preenchido no diálogo "Guardar como" e usado tal qual no download clássico). */
  sugestaoNome: string;
  /** Tipo mime do Blob, quando `dados` não é já um Blob. */
  tipoMime?: string;
  /** Extensão e descrição para o filtro do diálogo "Guardar como" (ex.: ".txt"). */
  extensao?: string;
  descricaoTipo?: string;
  /**
   * Identifica o «tipo» de ficheiro (ex.: 'ps2', 'oic'): o browser lembra a última pasta usada POR identificador, por isso
   * cada gerador abre sempre na sua pasta, sem se misturar com os outros.
   */
  idPasta?: string;
}

interface JanelaComSaveFilePicker {
  showSaveFilePicker?: (opcoes: {
    suggestedName?: string;
    id?: string;
    types?: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<{
    createWritable: () => Promise<{
      write: (dados: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
}

const CHAVE_BLOQUEADO = 'guardar-ficheiro:gravacao-bloqueada';

/** O browser deste computador já recusou gravar na pasta escolhida (política, permissões…): vai-se direto ao download. */
function gravacaoBloqueada(): boolean {
  try {
    return sessionStorage.getItem(CHAVE_BLOQUEADO) === '1';
  } catch {
    return false;
  }
}

function marcarGravacaoBloqueada() {
  try {
    sessionStorage.setItem(CHAVE_BLOQUEADO, '1');
  } catch {
    /* sem armazenamento: tenta-se de novo da próxima vez */
  }
}

export async function guardarFicheiro(
  dados: Blob | Uint8Array | string,
  opcoes: OpcoesGuardar,
): Promise<boolean> {
  const blob = dados instanceof Blob ? dados : new Blob([dados], opcoes.tipoMime ? { type: opcoes.tipoMime } : undefined);

  const picker = (window as unknown as JanelaComSaveFilePicker).showSaveFilePicker;
  if (typeof picker === 'function' && !gravacaoBloqueada()) {
    try {
      const handle = await picker({
        suggestedName: opcoes.sugestaoNome,
        id: opcoes.idPasta?.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) || undefined,
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
      if (e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) {
        // O browser (ou uma política do computador) não deixa a página gravar em pastas: é assim neste posto, não é um
        // erro do ficheiro. Lembra-se disso nesta sessão e passa a descarregar logo, sem abrir um «Guardar como» que não grava.
        marcarGravacaoBloqueada();
        descarregarClassico(blob, opcoes.sugestaoNome);
        toast.info(`Ficheiro descarregado para a pasta de Descarregamentos do browser (${opcoes.sugestaoNome}).`, { duration: 8000 });
        return true;
      }
      // Outros erros (ficheiro aberto noutro programa, disco…): cai no download, mas avisa.
      const motivo = e instanceof DOMException && e.name === 'NoModificationAllowedError'
        ? 'o ficheiro está aberto noutro programa (fecha-o) ou a pasta não deixa gravar'
        : e instanceof Error ? `${e.name}: ${e.message}` : 'erro desconhecido';
      toast.warning(`Não foi possível gravar na pasta escolhida (${motivo}). O ficheiro foi descarregado para a pasta de Descarregamentos do browser.`, { duration: 10000 });
    }
  }

  descarregarClassico(blob, opcoes.sugestaoNome);
  return true;
}

/**
 * Download clássico. A ligação vai para o documento (o Firefox ignora cliques em ligações soltas) e o endereço do
 * ficheiro só é libertado passado um tempo: libertá-lo logo a seguir ao clique cancela o descarregamento em alguns
 * browsers, sobretudo com o Edge/Chrome com o antivírus a analisar.
 */
function descarregarClassico(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 60_000);
}
