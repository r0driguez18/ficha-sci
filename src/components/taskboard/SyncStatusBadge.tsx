import React from 'react';
import { Check, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SyncStatus } from '@/services/taskboardService';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  lastSavedAt: Date | null;
}

/**
 * Indicador do estado da gravação automática do rascunho da ficha (RF-03.3):
 * a guardar / guardado (com hora) / erro. Substitui o antigo selo "Sincronizado"
 * que estava sempre verde independentemente do que se passava.
 */
export function SyncStatusBadge({ status, lastSavedAt }: SyncStatusBadgeProps) {
  const time = lastSavedAt
    ? lastSavedAt.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    : null;

  const config: Record<SyncStatus, { label: string; icon: React.ReactNode; className: string }> = {
    idle: {
      label: 'Por guardar',
      icon: <Cloud className="h-3.5 w-3.5" />,
      className: 'bg-muted text-muted-foreground',
    },
    saving: {
      label: 'A guardar…',
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
      className: 'bg-primary/10 text-primary',
    },
    saved: {
      label: time ? `Guardado ${time}` : 'Guardado',
      icon: <Check className="h-3.5 w-3.5" />,
      className: 'bg-success/10 text-success',
    },
    error: {
      label: 'Erro ao guardar — só no dispositivo',
      icon: <CloudOff className="h-3.5 w-3.5" />,
      className: 'bg-destructive/10 text-destructive',
    },
  };

  const { label, icon, className } = config[status];

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        className,
      )}
    >
      {icon}
      {label}
    </span>
  );
}
