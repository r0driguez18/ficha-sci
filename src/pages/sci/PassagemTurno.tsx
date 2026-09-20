import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { LoadingState } from '@/components/ui/loading-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Archive, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { useOperators } from '@/hooks/useOperators';
import { todayIso } from '@/lib/taskboardDefaults';
import type { TurnKey } from '@/types/taskboard';
import {
  HISTORICO_POR_PAGINA,
  adicionarEntradaHandover,
  arquivarEntradasHandover,
  confirmarLeituraEntradaHandover,
  getHandoverAtuais,
  getHandoverHistorico,
  type FiltrosHistorico,
  type HandoverEntrada,
} from '@/services/handoverService';

const TURNOS: { key: TurnKey; label: string }[] = [
  { key: 'turno1', label: 'Turno 1' },
  { key: 'turno2', label: 'Turno 2' },
  { key: 'turno3', label: 'Turno 3' },
];
const LABEL_TURNO: Record<string, string> = Object.fromEntries(TURNOS.map((t) => [t.key, t.label]));

/** Turno em curso pela hora local (Turno 3 entra às 23h, sai às 7h). */
function turnoAgora(d = new Date()): TurnKey {
  const h = d.getHours();
  if (h >= 7 && h < 15) return 'turno1';
  if (h >= 15 && h < 23) return 'turno2';
  return 'turno3';
}

const fmt = (iso?: string | null) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('pt-PT');
  } catch {
    return iso;
  }
};

const fmtDia = (iso: string) => {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-PT', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

interface EntradaCardProps {
  entrada: HandoverEntrada;
  userId?: string;
  labelOf: (id?: string | null) => string;
  busy: string | null;
  onConfirmar?: (e: HandoverEntrada) => void;
  onArquivar?: (e: HandoverEntrada) => void;
}

function EntradaCard({ entrada: e, userId, labelOf, busy, onConfirmar, onArquivar }: EntradaCardProps) {
  const jaLi = e.leituras.some((l) => l.user_id === userId);
  return (
    <li className={`rounded-md border p-3 space-y-2 ${e.arquivada_em ? 'bg-muted/40' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          <strong className="text-foreground">{LABEL_TURNO[e.turno]}</strong> · {fmtDia(e.date)} ·{' '}
          {e.autor_nome ?? labelOf(e.autor_user_id)} · {fmt(e.created_at)}
        </span>
        <span className="flex items-center gap-2">
          {e.leituras.length === 0 && <Badge variant="outline">Por ler</Badge>}
          {e.arquivada_em && (
            <Badge variant="secondary">
              Arquivada por {e.arquivada_por_nome ?? '—'} · {fmt(e.arquivada_em)}
            </Badge>
          )}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-sm">{e.texto}</p>
      <div className="flex flex-wrap items-center gap-2">
        {e.leituras.map((l) => (
          <Badge key={l.id} variant="secondary" className="bg-success/15 text-success">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Lida por {l.user_nome ?? labelOf(l.user_id)} · {fmt(l.lida_em)}
          </Badge>
        ))}
        {onConfirmar && !jaLi && (
          <Button size="sm" variant="outline" onClick={() => onConfirmar(e)} disabled={busy === `leitura-${e.id}`}>
            {busy === `leitura-${e.id}` ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
            )}
            Confirmar leitura
          </Button>
        )}
        {onArquivar && (
          <Button size="sm" variant="ghost" onClick={() => onArquivar(e)} disabled={busy === `arq-${e.id}`}>
            <Archive className="h-4 w-4 mr-1.5" />
            Arquivar
          </Button>
        )}
      </div>
    </li>
  );
}

export default function PassagemTurno() {
  const { user } = useAuth();
  const { labelOf } = useOperators();

  // ---------- Atual
  const [atuais, setAtuais] = useState<HandoverEntrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [turnoNota, setTurnoNota] = useState<TurnKey>(turnoAgora);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [aArquivar, setAArquivar] = useState<HandoverEntrada[] | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await getHandoverAtuais();
    if (error) toast.error('Erro ao carregar as notas de passagem de turno.');
    setAtuais(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deixarNota = async () => {
    const texto = draft.trim();
    if (!user?.id || texto === '') return;
    setBusy('nota');
    try {
      const { error } = await adicionarEntradaHandover(todayIso(), turnoNota, texto);
      if (error) {
        toast.error(error.message || 'Não foi possível guardar a nota.');
        return;
      }
      setDraft('');
      await load();
      toast.success('Nota deixada.');
    } finally {
      setBusy(null);
    }
  };

  const confirmarLeitura = async (entrada: HandoverEntrada) => {
    if (!user?.id) return;
    setBusy(`leitura-${entrada.id}`);
    try {
      const { error } = await confirmarLeituraEntradaHandover(entrada.id);
      if (error) {
        toast.error('Não foi possível registar a leitura.');
        return;
      }
      await load();
      toast.success('Leitura confirmada.');
    } finally {
      setBusy(null);
    }
  };

  const arquivar = async (lista: HandoverEntrada[]) => {
    setBusy(lista.length === 1 ? `arq-${lista[0].id}` : 'arq-todas');
    try {
      const { error } = await arquivarEntradasHandover(lista.map((e) => e.id));
      if (error) {
        toast.error('Não foi possível arquivar.');
        return;
      }
      await load();
      toast.success(lista.length === 1 ? 'Nota arquivada (fica no histórico).' : `${lista.length} notas arquivadas (ficam no histórico).`);
    } finally {
      setBusy(null);
      setAArquivar(null);
    }
  };

  /** Uma nota lida arquiva-se logo; uma por ler pede confirmação. */
  const pedirArquivo = (lista: HandoverEntrada[]) => {
    if (lista.length === 1 && lista[0].leituras.length > 0) void arquivar(lista);
    else setAArquivar(lista);
  };

  const porLer = useMemo(() => atuais.filter((e) => e.leituras.length === 0).length, [atuais]);
  const paraArquivarPorLer = (aArquivar ?? []).filter((e) => e.leituras.length === 0).length;

  // ---------- Histórico
  const [filtros, setFiltros] = useState<FiltrosHistorico>({ de: '', ate: '', turno: '', texto: '' });
  const [aplicados, setAplicados] = useState<FiltrosHistorico>({});
  const [pagina, setPagina] = useState(0);
  const [historico, setHistorico] = useState<HandoverEntrada[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingHist, setLoadingHist] = useState(false);
  const [separador, setSeparador] = useState('atual');

  useEffect(() => {
    if (separador !== 'historico') return;
    let cancelado = false;
    setLoadingHist(true);
    getHandoverHistorico(aplicados, pagina).then(({ data, total: t, error }) => {
      if (cancelado) return;
      if (error) toast.error('Erro ao carregar o histórico.');
      setHistorico(data ?? []);
      setTotal(t);
      setLoadingHist(false);
    });
    return () => {
      cancelado = true;
    };
  }, [separador, aplicados, pagina]);

  const paginas = Math.max(1, Math.ceil(total / HISTORICO_POR_PAGINA));
  const pesquisar = () => {
    setPagina(0);
    setAplicados({ ...filtros });
  };

  return (
    <PageContainer size="default">
      <PageHeader
        title="Passagem de Turno"
        subtitle="Quem sai deixa notas; quem entra confirma a leitura de cada uma. Tudo fica registado no histórico."
      />

      <Tabs value={separador} onValueChange={setSeparador} className="space-y-4">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="atual">Atual</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="atual" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deixar nota</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-w-[12rem] space-y-1">
                <Label>Turno que deixa a nota</Label>
                <Select value={turnoNota} onValueChange={(v) => setTurnoNota(v as TurnKey)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TURNOS.map((t) => (
                      <SelectItem key={t.key} value={t.key}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Nota para quem entra: ocorrências, pendências a acompanhar, avisos…"
                maxLength={4000}
                className="min-h-[90px]"
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" onClick={deixarNota} disabled={draft.trim() === '' || busy === 'nota'}>
                  {busy === 'nota' ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1.5" />
                  )}
                  Deixar nota
                </Button>
                <span className="text-xs text-muted-foreground">
                  As notas não se editam nem se apagam: para corrigir, deixa uma nova.
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">Notas ativas</CardTitle>
                {!loading && (
                  <Badge variant={porLer > 0 ? 'destructive' : 'secondary'}>
                    {porLer > 0 ? `${porLer} por ler` : 'todas lidas'}
                  </Badge>
                )}
              </div>
              {atuais.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => pedirArquivo(atuais)} disabled={busy === 'arq-todas'}>
                  <Archive className="h-4 w-4 mr-1.5" />
                  Arquivar tudo (limpar)
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState label="A carregar as notas…" />
              ) : atuais.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sem notas ativas. As já arquivadas estão no separador Histórico.
                </p>
              ) : (
                <ul className="space-y-3">
                  {atuais.map((e) => (
                    <EntradaCard
                      key={e.id}
                      entrada={e}
                      userId={user?.id}
                      labelOf={labelOf}
                      busy={busy}
                      onConfirmar={confirmarLeitura}
                      onArquivar={(x) => pedirArquivo([x])}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <div className="space-y-1">
                  <Label htmlFor="h-de">De</Label>
                  <Input
                    id="h-de"
                    type="date"
                    value={filtros.de ?? ''}
                    onChange={(e) => setFiltros((f) => ({ ...f, de: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="h-ate">Até</Label>
                  <Input
                    id="h-ate"
                    type="date"
                    value={filtros.ate ?? ''}
                    onChange={(e) => setFiltros((f) => ({ ...f, ate: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Turno</Label>
                  <Select
                    value={filtros.turno || 'todos'}
                    onValueChange={(v) => setFiltros((f) => ({ ...f, turno: v === 'todos' ? '' : (v as TurnKey) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {TURNOS.map((t) => (
                        <SelectItem key={t.key} value={t.key}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1 md:col-span-2">
                  <Label htmlFor="h-texto">Pesquisar no texto</Label>
                  <Input
                    id="h-texto"
                    value={filtros.texto ?? ''}
                    onChange={(e) => setFiltros((f) => ({ ...f, texto: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && pesquisar()}
                    placeholder="ex.: SISP, percurso…"
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={pesquisar}>
                  Pesquisar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFiltros({ de: '', ate: '', turno: '', texto: '' });
                    setPagina(0);
                    setAplicados({});
                  }}
                >
                  Limpar filtros
                </Button>
                <span className="text-xs text-muted-foreground">{total} nota(s)</span>
              </div>
            </CardContent>
          </Card>

          {loadingHist ? (
            <LoadingState label="A carregar o histórico…" />
          ) : historico.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem notas para estes filtros.</p>
          ) : (
            <ul className="space-y-3">
              {historico.map((e) => (
                <EntradaCard key={e.id} entrada={e} userId={user?.id} labelOf={labelOf} busy={busy} />
              ))}
            </ul>
          )}

          {total > HISTORICO_POR_PAGINA && (
            <div className="flex items-center justify-center gap-3">
              <Button size="sm" variant="outline" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {pagina + 1} de {paginas}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={pagina + 1 >= paginas}
                onClick={() => setPagina((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={aArquivar !== null}
        onOpenChange={(o) => !o && setAArquivar(null)}
        title={aArquivar && aArquivar.length > 1 ? 'Arquivar todas as notas ativas?' : 'Arquivar esta nota?'}
        description={
          <>
            {aArquivar?.length === 1 ? 'A nota' : `As ${aArquivar?.length ?? 0} notas`} sai(em) da lista atual mas
            fica(m) no histórico, com as leituras.
            {paraArquivarPorLer > 0 && (
              <>
                {' '}
                <strong>
                  {paraArquivarPorLer} ainda não {paraArquivarPorLer === 1 ? 'foi lida' : 'foram lidas'}.
                </strong>
              </>
            )}
          </>
        }
        confirmLabel="Arquivar"
        cancelLabel="Cancelar"
        onConfirm={() => aArquivar && void arquivar(aArquivar)}
      />
    </PageContainer>
  );
}
