/**
 * Cliente do serviço local "CRC — Fecho de Inconsistências"
 * (crc-inconsistencias-service). Corre na máquina do operador em
 * `http://localhost:8765` por omissão.
 */

const CRC_SERVICE_URL = (
  import.meta.env.VITE_CRC_SERVICE_URL || 'http://localhost:8765'
).replace(/\/$/, '');

export type CrcRunEstado =
  | 'aguarda_login'
  | 'a_processar'
  | 'concluido'
  | 'parado'
  | 'erro';

export interface CrcRunParams {
  motivo: string;
  pageSize: number;
  maxThreads: number;
  paginaInicial: number;
}

export interface CrcRunState {
  id: string;
  estado: CrcRunEstado;
  parametros: CrcRunParams;
  totalRegistos: number;
  totalPaginas: number;
  paginaAtual: number;
  processados: number;
  falhas: number;
  erro: string | null;
  iniciadoEm: number;
  terminadoEm: number | null;
}

function withTimeout(ms: number): { signal: AbortSignal; done: () => void } {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(t) };
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    let msg = body;
    try {
      msg = JSON.parse(body).detail ?? body;
    } catch {
      /* body não é JSON */
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** `null` quando o serviço local não responde. */
export async function crcHealth(): Promise<{ ok: boolean; version: string } | null> {
  const { signal, done } = withTimeout(3000);
  try {
    const res = await fetch(`${CRC_SERVICE_URL}/health`, { signal });
    return res.ok ? ((await res.json()) as { ok: boolean; version: string }) : null;
  } catch {
    return null;
  } finally {
    done();
  }
}

export async function crcStartRun(params: CrcRunParams): Promise<CrcRunState> {
  return parse<CrcRunState>(
    await fetch(`${CRC_SERVICE_URL}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }),
  );
}

export async function crcLoginDone(runId: string): Promise<CrcRunState> {
  return parse<CrcRunState>(
    await fetch(`${CRC_SERVICE_URL}/runs/${runId}/login-feito`, { method: 'POST' }),
  );
}

export async function crcRunState(runId: string): Promise<CrcRunState> {
  return parse<CrcRunState>(await fetch(`${CRC_SERVICE_URL}/runs/${runId}`));
}

export async function crcStopRun(runId: string): Promise<CrcRunState> {
  return parse<CrcRunState>(
    await fetch(`${CRC_SERVICE_URL}/runs/${runId}/parar`, { method: 'POST' }),
  );
}
