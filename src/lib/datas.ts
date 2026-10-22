/** Soma `dias` a uma data AAAA-MM-DD (sem fusos horários). */
export function somarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** A primeira data a partir de `desde` (inclusive) que não está em `ocupadas`. Pára ao fim de `limite` dias. */
export function primeiraDataLivre(desde: string, ocupadas: ReadonlySet<string>, limite = 400): string {
  let d = desde;
  for (let i = 0; i < limite && ocupadas.has(d); i += 1) d = somarDias(d, 1);
  return d;
}
