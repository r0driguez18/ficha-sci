import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Estado global de ligação ao servidor (F16).
 *
 * Faz um "ping" periódico a uma consulta minúscula do Supabase. Quando o
 * servidor não responde, a app mostra um banner "sem ligação ao servidor —
 * a reconectar…" em vez de uma cascata de erros, e recupera sozinha quando
 * o servidor volta (a ficha já tem fallback para localStorage).
 */
interface ServerStatusValue {
  online: boolean;
  checking: boolean;
  /** Verifica agora (usado pelo botão "tentar agora"). */
  check: () => Promise<boolean>;
}

const ServerStatusContext = createContext<ServerStatusValue>({
  online: true,
  checking: false,
  check: async () => true,
});

const INTERVALO_ONLINE = 30_000;
const INTERVALO_OFFLINE = 5_000;
const TIMEOUT = 6_000;

async function pingServidor(): Promise<boolean> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const { error } = await supabase
      .from('operators')
      .select('value', { head: true, count: 'exact' })
      .limit(1)
      .abortSignal(ctrl.signal);
    // Um erro do PostgREST (ex.: RLS) ainda significa que o servidor está vivo.
    // Só uma falha de rede é que conta como "offline".
    if (error) {
      const msg = (error.message || '').toLowerCase();
      const rede = msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('aborted');
      return !rede;
    }
    return true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(t);
  }
}

export function ServerStatusProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [checking, setChecking] = useState(false);
  const timer = useRef<number | null>(null);
  const onlineRef = useRef(online);
  onlineRef.current = online;

  const check = useCallback(async () => {
    setChecking(true);
    const ok = await pingServidor();
    setChecking(false);
    setOnline((prev) => {
      if (!prev && ok) {
        // Voltou: refrescar contadores que dependem do servidor.
        window.dispatchEvent(new Event('update-returns-badge'));
        window.dispatchEvent(new Event('update-tapes-badge'));
      }
      return ok;
    });
    return ok;
  }, []);

  useEffect(() => {
    let parado = false;
    const loop = async () => {
      if (parado) return;
      const ok = await check();
      if (parado) return;
      timer.current = window.setTimeout(loop, ok ? INTERVALO_ONLINE : INTERVALO_OFFLINE);
    };
    loop();

    const revalidar = () => {
      if (!onlineRef.current) check();
    };
    window.addEventListener('focus', revalidar);
    window.addEventListener('online', revalidar);
    return () => {
      parado = true;
      if (timer.current) window.clearTimeout(timer.current);
      window.removeEventListener('focus', revalidar);
      window.removeEventListener('online', revalidar);
    };
  }, [check]);

  return (
    <ServerStatusContext.Provider value={{ online, checking, check }}>
      {children}
    </ServerStatusContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useServerStatus = () => useContext(ServerStatusContext);
