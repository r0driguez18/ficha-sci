import { useCallback, useEffect, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ficheirosDe, filtrarFicheiros, mensagemTipoErrado } from '@/lib/largarFicheiros';

interface Props {
  /** Extensões aceites, com ponto (ex.: ['.xlsx', '.xls']). */
  extensoes: string[];
  /** Chamado com os ficheiros aceites (um só, a não ser que `varios`). */
  onFicheiros: (ficheiros: File[]) => void;
  varios?: boolean;
  disabled?: boolean;
  /** Texto por cima da zona enquanto se arrasta. */
  texto?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Envolve uma área da página: dá para largar lá um ficheiro (arrastado do Explorador ou, se o cliente de email deixar,
 * diretamente de um anexo) ou colá-lo com Ctrl+V. Não substitui o botão de escolher ficheiro — acrescenta-se a ele.
 */
export function ZonaLargarFicheiro({ extensoes, onFicheiros, varios = false, disabled, texto, className, children }: Props) {
  const [aArrastar, setAArrastar] = useState(false);
  const profundidade = useRef(0); // dragenter/leave disparam nos filhos
  const ref = useRef<HTMLDivElement>(null);

  const entregar = useCallback(
    (todos: File[]) => {
      if (todos.length === 0) return;
      const { aceites, recusados } = filtrarFicheiros(todos, extensoes, varios);
      if (recusados.length > 0) toast.error(mensagemTipoErrado(recusados, extensoes));
      if (aceites.length > 0) onFicheiros(aceites);
    },
    [extensoes, varios, onFicheiros],
  );

  const temFicheiros = (e: React.DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');

  // Ctrl+V com um ficheiro copiado (ex.: anexo do Outlook). Só se o foco estiver dentro desta zona e o que se cola forem
  // ficheiros: colar texto numa caixa de texto continua a funcionar como sempre.
  useEffect(() => {
    if (disabled) return;
    const aColar = (e: ClipboardEvent) => {
      const alvo = e.target as Node | null;
      // Foco dentro da zona, ou na página sem nenhum campo em foco (o normal depois de copiar um anexo).
      if (!alvo || (alvo !== document.body && !ref.current?.contains(alvo))) return;
      const ficheiros = ficheirosDe(e.clipboardData);
      if (ficheiros.length === 0) return;
      e.preventDefault();
      entregar(ficheiros);
    };
    document.addEventListener('paste', aColar);
    return () => document.removeEventListener('paste', aColar);
  }, [disabled, entregar]);

  return (
    <div
      ref={ref}
      className={cn('relative rounded-lg', aArrastar && 'ring-2 ring-primary ring-offset-2', className)}
      onDragEnter={(e) => {
        if (disabled || !temFicheiros(e)) return;
        e.preventDefault();
        profundidade.current += 1;
        setAArrastar(true);
      }}
      onDragOver={(e) => {
        if (disabled || !temFicheiros(e)) return;
        e.preventDefault(); // sem isto o browser não deixa largar
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeave={(e) => {
        if (disabled || !temFicheiros(e)) return;
        profundidade.current = Math.max(0, profundidade.current - 1);
        if (profundidade.current === 0) setAArrastar(false);
      }}
      onDrop={(e) => {
        if (disabled || !temFicheiros(e)) return;
        e.preventDefault();
        profundidade.current = 0;
        setAArrastar(false);
        entregar(ficheirosDe(e.dataTransfer));
      }}
    >
      {children}
      {aArrastar && (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary bg-background/80 text-sm font-medium text-primary"
          role="status"
        >
          <UploadCloud className="h-5 w-5" />
          {texto ?? 'Larga aqui o ficheiro'}
        </div>
      )}
    </div>
  );
}
