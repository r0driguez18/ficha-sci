import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  /** Texto por baixo do spinner. */
  label?: string;
  className?: string;
}

/**
 * Estado de "a carregar" único da aplicação: spinner + label centrados.
 * Usar sempre este em vez de montar um spinner à mão em cada página.
 */
export function LoadingState({ label = 'A carregar…', className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
