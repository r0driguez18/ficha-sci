import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  /** Frase principal (o que não há). */
  title: string;
  /** Linha de ajuda: o que fazer a seguir ou onde isto aparece. */
  hint?: string;
  /** Ação opcional (ex.: um botão). */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Estado vazio único da aplicação: ícone + título + ajuda, centrados.
 * Usar sempre este em vez de escrever "Nenhum…" à mão em cada lista.
 */
export function EmptyState({ icon: Icon, title, hint, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      {Icon && <Icon className="mb-3 h-10 w-10 text-muted-foreground/60" />}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
