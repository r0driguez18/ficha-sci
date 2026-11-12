/** Ajuda para as zonas «larga aqui o ficheiro»: filtra o que foi largado/colado pelas extensões aceites. */

export interface FicheirosFiltrados {
  aceites: File[];
  recusados: File[];
}

/** Extensões aceites, em minúsculas e com ponto (ex.: ['.xlsx', '.xls']). */
export function extensaoDe(nome: string): string {
  const i = nome.lastIndexOf('.');
  return i < 0 ? '' : nome.slice(i).toLowerCase();
}

export function filtrarFicheiros(ficheiros: File[], extensoes: string[], varios: boolean): FicheirosFiltrados {
  const ok = new Set(extensoes.map((e) => e.toLowerCase()));
  const aceites = ficheiros.filter((f) => ok.has(extensaoDe(f.name)));
  const recusados = ficheiros.filter((f) => !ok.has(extensaoDe(f.name)));
  return { aceites: varios ? aceites : aceites.slice(0, 1), recusados };
}

/** Texto para o aviso quando se larga um ficheiro de tipo errado. */
export function mensagemTipoErrado(recusados: File[], extensoes: string[]): string {
  const nomes = recusados.map((f) => f.name).join(', ');
  return `«${nomes}» não é um tipo aceite aqui. Aceita: ${extensoes.join(', ')}.`;
}

/** Os itens de um DataTransfer que são ficheiros (um anexo do Outlook chega como ficheiro, não como texto). */
export function ficheirosDe(dt: DataTransfer | null | undefined): File[] {
  if (!dt) return [];
  if (dt.files && dt.files.length > 0) return Array.from(dt.files);
  const out: File[] = [];
  for (const item of Array.from(dt.items ?? [])) {
    if (item.kind === 'file') {
      const f = item.getAsFile();
      if (f) out.push(f);
    }
  }
  return out;
}
