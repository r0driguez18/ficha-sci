import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, Square, Loader2, CheckCircle, AlertTriangle, RefreshCw, LogIn, RotateCw, Power } from 'lucide-react';
import { toast } from 'sonner';
import {
  crcHealth,
  crcStartRun,
  crcLoginDone,
  crcRepeatRun,
  crcRunState,
  crcStopRun,
  crcTerminateRun,
  type CrcRunState,
  type CrcRunParams,
} from '@/services/crcLocalService';
import {
  criarCrcTratamento,
  atualizarCrcTratamento,
  listarCrcTratamentos,
  type CrcTratamento,
} from '@/services/crcTratamentoService';

const DEFAULTS: CrcRunParams = {
  motivo: 'Validado',
  pageSize: 100,
  maxThreads: 20,
  paginaInicial: 1,
  inconsistencyCode: 51269,
  inconsistencyState: 225,
};

const ESTADO_LABEL: Record<string, string> = {
  aguarda_login: 'A aguardar login',
  a_processar: 'A processar',
  a_correr: 'A processar',
  concluido: 'Concluído',
  parado: 'Parado',
  erro: 'Erro',
};

const fmtDateTime = (iso?: string | null) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('pt-PT');
  } catch {
    return iso;
  }
};

export default function CrcTratamento() {
  const [serviceOnline, setServiceOnline] = useState<boolean | null>(null);
  const [showServiceHelp, setShowServiceHelp] = useState(false);
  const [params, setParams] = useState<CrcRunParams>(DEFAULTS);
  const [run, setRun] = useState<CrcRunState | null>(null);
  const [dbId, setDbId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<CrcTratamento[]>([]);
  const pollRef = useRef<number | null>(null);
  const dbIdRef = useRef<string | null>(null);
  useEffect(() => {
    dbIdRef.current = dbId;
  }, [dbId]);

  const running = run?.estado === 'aguarda_login' || run?.estado === 'a_processar';
  /** Sessão aberta mas parada (Concluído/Parado/Erro) — dá para Repetir/Terminar. */
  const terminalRun = !!run && !running;
  /**
   * Só se bloqueiam os parâmetros durante o processamento. Fora disso — antes
   * de Iniciar e enquanto se faz login — o código de inconsistência é
   * editável, tal como no script (o código escolhe-se depois do login).
   */
  const paramsLocked = run?.estado === 'a_processar';

  const loadHistory = useCallback(async () => {
    const { data } = await listarCrcTratamentos(20);
    setHistory(data ?? []);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  /**
   * Verifica se o serviço local responde. É só um GET a /health — não abre o
   * Chrome nem toca no CRC. Não corre sozinha: só quando o utilizador pede ou
   * ao carregar em "Iniciar".
   */
  const verificarServico = useCallback(async () => {
    const h = await crcHealth();
    setServiceOnline(!!h);
    return !!h;
  }, []);

  const registarFimDaPassagem = useCallback(
    async (id: string | null, state: CrcRunState) => {
      if (!id) return;
      await atualizarCrcTratamento(id, {
        estado: state.estado === 'a_processar' ? 'a_correr' : (state.estado as CrcTratamento['estado']),
        total_registos: state.totalRegistos,
        processados: state.processados,
        falhas: state.falhas,
        terminado_em: new Date().toISOString(),
        resumo:
          state.estado === 'erro'
            ? `Erro: ${state.erro ?? 'desconhecido'}`
            : `${state.processados} processados, ${state.falhas} falhas de ${state.totalRegistos}`,
      });
      await loadHistory();
    },
    [loadHistory],
  );

  // Polling do progresso (só enquanto está "a_processar")
  const runId = run?.id;
  const runEstado = run?.estado;
  useEffect(() => {
    if (!runId || runEstado !== 'a_processar') return;
    const tick = async () => {
      try {
        const next = await crcRunState(runId);
        setRun(next);
        if (next.estado !== 'a_processar') {
          await registarFimDaPassagem(dbIdRef.current, next);
          if (next.estado === 'concluido') toast.success('Passagem concluída.');
          else if (next.estado === 'parado') toast.info('Passagem parada.');
          else if (next.estado === 'erro') toast.error(`Erro: ${next.erro ?? 'desconhecido'}`);
        }
      } catch (e) {
        console.error('Erro ao consultar o serviço CRC:', e);
      }
    };
    pollRef.current = window.setInterval(tick, 1500);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [runId, runEstado, registarFimDaPassagem]);

  const setNum = (k: keyof CrcRunParams, v: string, min: number) =>
    setParams((p) => ({ ...p, [k]: Math.max(min, Number(v) || min) }));

  const relatarFalhaServico = (e: unknown) => {
    setServiceOnline(false);
    setShowServiceHelp(true);
    toast.error(
      e instanceof Error && e.message ? e.message : 'O serviço local do CRC não está a responder.',
    );
  };

  const iniciar = async () => {
    setBusy(true);
    try {
      // Só abre o Chrome. O código e o registo no histórico só entram
      // depois do login, em "continuar".
      const state = await crcStartRun(params);
      setServiceOnline(true);
      setRun(state);
      setDbId(null);
      toast.message('Chrome aberto', {
        description: 'Faça login no CRC, escolha o código de inconsistência e a pesquisa, depois clique em "Já fiz login".',
      });
    } catch (e) {
      relatarFalhaServico(e);
    } finally {
      setBusy(false);
    }
  };

  const continuar = async () => {
    if (!run) return;
    setBusy(true);
    try {
      // O código de inconsistência vai só agora — depois do login.
      const state = await crcLoginDone(run.id, params);
      setRun(state);
      const { data } = await criarCrcTratamento(params as unknown as Record<string, unknown>);
      setDbId(data?.id ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao arrancar o processamento.');
    } finally {
      setBusy(false);
    }
  };

  const repetir = async () => {
    if (!run) return;
    setBusy(true);
    try {
      const state = await crcRepeatRun(run.id, params);
      setRun(state);
      const { data } = await criarCrcTratamento(params as unknown as Record<string, unknown>);
      setDbId(data?.id ?? null);
      toast.message('Nova passagem', { description: `Código ${params.inconsistencyCode}.` });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao repetir.');
    } finally {
      setBusy(false);
    }
  };

  const parar = async () => {
    if (!run) return;
    setBusy(true);
    try {
      const next = await crcStopRun(run.id);
      setRun(next);
      if (next.estado !== 'a_processar') await registarFimDaPassagem(dbId, next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao parar.');
    } finally {
      setBusy(false);
    }
  };

  const terminar = async () => {
    if (!run) return;
    setBusy(true);
    try {
      await crcTerminateRun(run.id);
    } catch {
      /* fecha na mesma do lado da UI */
    } finally {
      setRun(null);
      setDbId(null);
      setBusy(false);
    }
  };

  const pct =
    run && run.totalRegistos > 0
      ? Math.min(100, Math.round(((run.processados + run.falhas) / run.totalRegistos) * 100))
      : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="CRC — Fecho de Inconsistências"
        subtitle="Confirmação em massa das inconsistências no CRC Front Office"
      />

      <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
        <Card className="shadow-md">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-primary">Execução</CardTitle>
              {run && (
                <Badge variant="outline">
                  {ESTADO_LABEL[run.estado] ?? run.estado}
                  {run.passagens && run.passagens > 1 ? ` · ${run.passagens}ª passagem` : ''}
                </Badge>
              )}
            </div>
            <CardDescription>
              Abre o Chrome para o login manual no CRC; a partir daí confirma as inconsistências
              em paralelo. No fim, dá para repetir (mesmo código ou outro) ou terminar.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {/* Estado do serviço local */}
            {serviceOnline !== null && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    serviceOnline ? 'bg-success' : 'bg-muted-foreground/40'
                  }`}
                />
                <span className="text-muted-foreground">
                  Serviço local {serviceOnline ? 'ligado' : 'desligado'}
                </span>
                <button
                  type="button"
                  onClick={() => verificarServico()}
                  className="text-primary hover:underline"
                >
                  verificar
                </button>
                {!serviceOnline && (
                  <button
                    type="button"
                    onClick={() => setShowServiceHelp((v) => !v)}
                    className="text-primary hover:underline"
                  >
                    como arrancar?
                  </button>
                )}
              </div>
            )}
            {showServiceHelp && serviceOnline === false && (
              <p className="text-xs text-muted-foreground rounded-md bg-muted/50 p-3 -mt-2">
                Na máquina onde se faz o tratamento do CRC, arranque o{' '}
                <code>crc-inconsistencias</code> (ver{' '}
                <code>crc-inconsistencias-service/README.md</code>) e mantenha a janela aberta.
                É só uma verificação — o processamento só arranca com o botão{' '}
                <strong>Iniciar</strong>.
              </p>
            )}

            {/* Parâmetros */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="inconsistencyCode">Código de inconsistência</Label>
                <Input
                  id="inconsistencyCode"
                  type="number"
                  min={0}
                  value={params.inconsistencyCode}
                  disabled={paramsLocked}
                  onChange={(e) => setNum('inconsistencyCode', e.target.value, 0)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inconsistencyState">Estado da inconsistência</Label>
                <Input
                  id="inconsistencyState"
                  type="number"
                  min={0}
                  value={params.inconsistencyState}
                  disabled={paramsLocked}
                  onChange={(e) => setNum('inconsistencyState', e.target.value, 0)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="motivo">Motivo da validação</Label>
                <Input
                  id="motivo"
                  value={params.motivo}
                  disabled={paramsLocked}
                  onChange={(e) => setParams((p) => ({ ...p, motivo: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="paginaInicial">Página inicial</Label>
                <Input
                  id="paginaInicial"
                  type="number"
                  min={1}
                  value={params.paginaInicial}
                  disabled={paramsLocked}
                  onChange={(e) => setNum('paginaInicial', e.target.value, 1)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pageSize">Registos por página</Label>
                <Input
                  id="pageSize"
                  type="number"
                  min={1}
                  value={params.pageSize}
                  disabled={paramsLocked}
                  onChange={(e) => setNum('pageSize', e.target.value, 1)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maxThreads">Ligações em paralelo</Label>
                <Input
                  id="maxThreads"
                  type="number"
                  min={1}
                  value={params.maxThreads}
                  disabled={paramsLocked}
                  onChange={(e) => setNum('maxThreads', e.target.value, 1)}
                />
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-wrap gap-2">
              {!run && (
                <Button onClick={iniciar} disabled={busy}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  Iniciar
                </Button>
              )}

              {run?.estado === 'aguarda_login' && (
                <>
                  <Button onClick={continuar} disabled={busy}>
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                    Já fiz login — continuar
                  </Button>
                  <Button variant="outline" onClick={terminar} disabled={busy}>
                    <Power className="mr-2 h-4 w-4" />
                    Terminar
                  </Button>
                </>
              )}

              {run?.estado === 'a_processar' && (
                <Button variant="destructive" onClick={parar} disabled={busy}>
                  <Square className="mr-2 h-4 w-4" />
                  Parar
                </Button>
              )}

              {terminalRun && (
                <>
                  <Button onClick={repetir} disabled={busy}>
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCw className="mr-2 h-4 w-4" />}
                    Repetir
                  </Button>
                  <Button variant="outline" onClick={terminar} disabled={busy}>
                    <Power className="mr-2 h-4 w-4" />
                    Terminar
                  </Button>
                </>
              )}
            </div>

            {/* Login pendente */}
            {run?.estado === 'aguarda_login' && (
              <Alert>
                <LogIn className="h-4 w-4" />
                <AlertTitle>Login no CRC</AlertTitle>
                <AlertDescription>
                  Na janela do Chrome que abriu, faça login no CRC, escolha o código de
                  inconsistência e abra a pesquisa. Depois clique em{' '}
                  <strong>Já fiz login — continuar</strong>.
                </AlertDescription>
              </Alert>
            )}

            {/* Progresso */}
            {run && run.estado !== 'aguarda_login' && (
              <div className="space-y-3">
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Página</p>
                    <p className="font-semibold">
                      {run.paginaAtual}/{run.totalPaginas || '?'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Registos</p>
                    <p className="font-semibold">{run.totalRegistos}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Processados</p>
                    <p className="font-semibold text-success">{run.processados}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Falhas</p>
                    <p className="font-semibold text-destructive">{run.falhas}</p>
                  </div>
                </div>

                {run.ficheiroLog && (
                  <p className="text-xs text-muted-foreground break-all">
                    Log: <code>{run.ficheiroLog}</code>
                  </p>
                )}

                {run.paginasSaltadas ? (
                  <p className="text-xs text-warning">
                    {run.paginasSaltadas} página(s) saltada(s) por falha de resposta do CRC.
                  </p>
                ) : null}

                {run.estado === 'concluido' && (
                  <div className="flex items-center gap-2 text-sm text-success">
                    <CheckCircle className="h-4 w-4" />
                    {run.totalRegistos === 0
                      ? `Sem registos para o código ${run.parametros.inconsistencyCode}.`
                      : 'Passagem concluída.'}
                  </div>
                )}
                {run.estado === 'erro' && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" /> {run.erro ?? 'Erro desconhecido'}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Histórico</CardTitle>
            <Button size="sm" variant="ghost" onClick={loadHistory}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sem execuções registadas.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Início</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Processados</TableHead>
                    <TableHead className="text-right">Falhas</TableHead>
                    <TableHead>Resumo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="whitespace-nowrap">{fmtDateTime(h.iniciado_em)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            h.estado === 'concluido'
                              ? 'secondary'
                              : h.estado === 'erro'
                                ? 'destructive'
                                : 'outline'
                          }
                        >
                          {ESTADO_LABEL[h.estado] ?? h.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{h.processados}</TableCell>
                      <TableCell className="text-right">{h.falhas}</TableCell>
                      <TableCell className="text-muted-foreground">{h.resumo ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
