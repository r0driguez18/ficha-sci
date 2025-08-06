import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = 'md', className, label = 'Carregando...' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-muted border-t-primary',
          sizeClasses[size]
        )}
        aria-hidden="true"
      />
      {label && (
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {label}
        </span>
      )}
    </div>
  );
}

export function PageLoadingSpinner() {
  return (
    <div className="flex h-64 w-full items-center justify-center">
      <LoadingSpinner size="lg" label="Carregando página..." />
    </div>
  );
}