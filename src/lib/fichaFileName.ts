/**
 * Nome do ficheiro PDF de uma ficha de procedimentos: `FD DD.MM.AA.pdf`.
 * `date` vem no formato ISO `YYYY-MM-DD`.
 */
export function fichaFileName(date: string): string {
  const [yyyy = '', mm = '', dd = ''] = (date || '').split('-');
  return `FD ${dd}.${mm}.${yyyy.slice(2)}.pdf`;
}
