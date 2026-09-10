import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Ações à direita do título (botões, etc.). */
  children?: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Cabeçalho de página: título + subtítulo à esquerda, ações à direita.
 * Os breadcrumbs vivem no cabeçalho da aplicação (DashboardLayout), não aqui.
 * Deixa `mb-6` por baixo para acompanhar o `space-y-6` / `gap-6` do conteúdo.
 */
export function PageHeader({ title, subtitle, children, className, id }: PageHeaderProps) {
  return (
    <div
      id={id}
      className={cn('mb-6 flex flex-wrap items-start justify-between gap-3', className)}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}
