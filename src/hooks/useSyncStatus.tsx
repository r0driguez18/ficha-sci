import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { SyncStatus } from '@/services/taskboardService';

interface SyncStatusState {
  status: SyncStatus;
  lastSavedAt: Date | null;
}

interface SyncStatusContextValue extends SyncStatusState {
  /** Chamado pelo `useTaskboardSync` para publicar o estado da gravação para o cabeçalho. */
  report: (status: SyncStatus, lastSavedAt: Date | null) => void;
  /** Limpa o estado (ao sair da ficha). */
  clear: () => void;
}

const SyncStatusContext = createContext<SyncStatusContextValue>({
  status: 'idle',
  lastSavedAt: null,
  report: () => {},
  clear: () => {},
});

export function SyncStatusProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SyncStatusState>({ status: 'idle', lastSavedAt: null });

  const report = useCallback((status: SyncStatus, lastSavedAt: Date | null) => {
    setState({ status, lastSavedAt });
  }, []);

  const clear = useCallback(() => {
    setState({ status: 'idle', lastSavedAt: null });
  }, []);

  const value = useMemo(
    () => ({ ...state, report, clear }),
    [state, report, clear],
  );

  return <SyncStatusContext.Provider value={value}>{children}</SyncStatusContext.Provider>;
}

export const useSyncStatus = () => useContext(SyncStatusContext);
