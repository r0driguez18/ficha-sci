import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: { warning: vi.fn(), success: vi.fn(), error: vi.fn() } }));
import { toast } from 'sonner';
import { guardarFicheiro } from '../guardarFicheiro';

/** Um "browser" mínimo: só o que o guardarFicheiro usa. */
function simularBrowser(picker?: unknown) {
  const ligacao = { href: '', download: '', rel: '', style: {} as Record<string, string>, click: vi.fn(), remove: vi.fn() };
  const noDocumento = vi.fn();
  vi.stubGlobal('window', { showSaveFilePicker: picker });
  vi.stubGlobal('document', { createElement: () => ligacao, body: { appendChild: noDocumento } });
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() });
  return { ligacao, noDocumento };
}

describe('guardarFicheiro', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it('sem "Guardar como": descarrega, com a ligação no documento e sem libertar logo o ficheiro', async () => {
    const { ligacao, noDocumento } = simularBrowser(undefined);
    expect(await guardarFicheiro('x', { sugestaoNome: 'a.txt' })).toBe(true);
    expect(noDocumento).toHaveBeenCalledWith(ligacao);
    expect(ligacao.download).toBe('a.txt');
    expect(ligacao.click).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('cancelar o diálogo não é erro nem descarrega', async () => {
    const { ligacao } = simularBrowser(vi.fn().mockRejectedValue(new DOMException('x', 'AbortError')));
    expect(await guardarFicheiro('x', { sugestaoNome: 'a.txt' })).toBe(false);
    expect(ligacao.click).not.toHaveBeenCalled();
  });

  it('se falhar a gravar (ficheiro aberto…), avisa e descarrega', async () => {
    const { ligacao } = simularBrowser(vi.fn().mockRejectedValue(new DOMException('x', 'NoModificationAllowedError')));
    expect(await guardarFicheiro('x', { sugestaoNome: 'a.txt' })).toBe(true);
    expect(toast.warning).toHaveBeenCalled();
    expect(ligacao.click).toHaveBeenCalledOnce();
  });

  it('com "Guardar como" a funcionar grava e não descarrega', async () => {
    const escrever = vi.fn();
    const fechar = vi.fn();
    const { ligacao } = simularBrowser(vi.fn().mockResolvedValue({ createWritable: async () => ({ write: escrever, close: fechar }) }));
    expect(await guardarFicheiro('x', { sugestaoNome: 'a.txt', extensao: '.txt' })).toBe(true);
    expect(escrever).toHaveBeenCalledOnce();
    expect(fechar).toHaveBeenCalledOnce();
    expect(ligacao.click).not.toHaveBeenCalled();
  });
});
