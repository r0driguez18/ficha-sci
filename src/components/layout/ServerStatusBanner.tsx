import React from 'react';
import { Loader2, WifiOff, RefreshCw } from 'lucide-react';
import { useServerStatus } from '@/hooks/useServerStatus';

/**
 * Banner de "sem ligação ao servidor" (F16). Só aparece quando o Supabase
 * não responde; a app continua utilizável (a ficha grava em localStorage) e
 * o banner desaparece sozinho quando o servidor volta.
 */
export function ServerStatusBanner() {
  const { online, checking, check } = useServerStatus();
  if (online) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-3 border-b border-warning/40 bg-warning/10 px-4 py-2 text-sm text-foreground"
    >
      {checking ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : (
        <WifiOff className="h-4 w-4 shrink-0" />
      )}
      <span className="flex-1">
        Sem ligação ao servidor — a app continua a funcionar e o trabalho é guardado localmente.
        A tentar reconectar…
      </span>
      <button
        type="button"
        onClick={() => check()}
        disabled={checking}
        className="inline-flex items-center gap-1 rounded-md border border-warning/50 px-2 py-1 text-xs font-medium hover:bg-warning/15 disabled:opacity-50"
      >
        <RefreshCw className="h-3 w-3" />
        Tentar agora
      </button>
    </div>
  );
}
