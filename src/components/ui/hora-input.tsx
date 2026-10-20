import * as React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export const horaAgora = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Texto escrito → "H:MM"/"HH:MM" parcial, ignorando teclas que dariam uma hora impossível. */
export function formatar(bruto: string): string {
  const d = bruto.replace(/\D/g, '').slice(0, 4);
  let h = '';
  let resto = '';
  if (d.length === 0) return '';
  if (d[0] > '2') {
    h = d[0]; // "9" → hora de um dígito
    resto = d.slice(1);
  } else {
    h = d.slice(0, 2);
    resto = d.slice(2);
    if (h.length === 2 && Number(h) > 23) return formatar(h[0]); // "25" → ignora o 5
  }
  resto = resto.slice(0, 2);
  if (resto.length > 0 && resto[0] > '5') resto = ''; // minutos 6x–9x não existem
  return resto ? `${h}:${resto}` : bruto.endsWith(':') && h ? `${h}:` : h;
}

/** Normaliza para "HH:MM" se estiver completo (ou só com horas); senão devolve null. */
export function normalizar(txt: string): string | null {
  const m = /^(\d{1,2})(?::(\d{0,2}))?$/.exec(txt);
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] ? Number(m[2].padEnd(2, '0')) : 0;
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

interface HoraInputProps {
  value: string;
  onChange: (valor: string) => void;
  id?: string;
  className?: string;
  /** Versão pequena para linhas de texto (campos inline das tarefas). */
  compact?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
}

/**
 * Campo de hora: escreve-se "1430" (ou "930") e fica "14:30"; o botão do relógio
 * preenche a hora atual com um toque. Substitui o `<input type="time">` do browser,
 * cujo seletor abria uma janela lenta e diferente em cada browser.
 */
export const HoraInput = React.forwardRef<HTMLInputElement, HoraInputProps>(
  ({ value, onChange, id, className, compact, disabled, ...rest }, ref) => {
    const [txt, setTxt] = React.useState(value);
    React.useEffect(() => setTxt(value), [value]);

    const mudou = (bruto: string) => {
      const f = formatar(bruto);
      setTxt(f);
      if (f === '') onChange('');
      else if (/^\d{1,2}:\d{2}$/.test(f)) {
        const n = normalizar(f);
        if (n) onChange(n);
      }
    };

    const aoSair = () => {
      const n = normalizar(txt);
      if (txt === '') return;
      if (n) {
        setTxt(n);
        if (n !== value) onChange(n);
      } else {
        setTxt(value); // incompleto/inválido: volta ao último valor bom
      }
    };

    const agora = () => {
      const h = horaAgora();
      setTxt(h);
      onChange(h);
    };

    return (
      <div className="relative inline-flex w-full items-center">
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="HH:MM"
          maxLength={5}
          value={txt}
          disabled={disabled}
          onChange={(e) => mudou(e.target.value)}
          onBlur={aoSair}
          onFocus={(e) => e.target.select()}
          className={cn(
            'flex w-full rounded-md border border-input bg-background pr-8 tabular-nums ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            compact ? 'h-7 px-2 text-sm' : 'h-9 px-3 text-sm',
            className,
          )}
          {...rest}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={agora}
          title="Preencher com a hora atual"
          aria-label="Preencher com a hora atual"
          className="absolute right-1 inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-primary disabled:opacity-50"
        >
          <Clock className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  },
);
HoraInput.displayName = 'HoraInput';
