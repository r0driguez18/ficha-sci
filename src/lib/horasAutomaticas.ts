/**
 * Os procedimentos do Turno 3 que levam hora (fecho e abertura do Real-Time, início e término do fecho): ao marcá-los
 * a hora de agora entra sozinha no campo, que continua editável.
 */

/** Procedimento → campo da hora. */
export const CAMPO_HORA: Record<string, string> = {
  interromperRealTime: 'interromperRealTimeHora',
  inicioFecho: 'inicioFechoHora',
  abrirRealTime: 'abrirRealTimeHora',
  terminoFecho: 'terminoFechoHora',
};

export const horaValida = (h: unknown): h is string => typeof h === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(h);

export const horaAgora = (d: Date = new Date()) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export interface MudancaHora {
  campo: string;
  /** Vazio = apagar a hora. */
  valor: string;
}

/**
 * O que fazer à hora quando um procedimento é marcado ou desmarcado.
 *  • Marcar: se o campo não tem hora válida, entra a de agora; se já tem (escrita à mão, ou de antes), fica como está.
 *  • Desmarcar: só se apaga a hora que a própria app pôs e ninguém mexeu (`auto` guarda essas); uma hora escrita à
 *    mão nunca se apaga sozinha.
 * Devolve null quando não há nada a mudar.
 */
export function decidirHora(
  procedimento: string,
  marcado: boolean,
  turno3: Record<string, unknown>,
  auto: Readonly<Record<string, string>>,
  agora: string,
): MudancaHora | null {
  const campo = CAMPO_HORA[procedimento];
  if (!campo) return null;
  const atual = turno3[campo];
  if (marcado) return horaValida(atual) ? null : { campo, valor: agora };
  return typeof atual === 'string' && atual !== '' && atual === auto[campo] ? { campo, valor: '' } : null;
}
