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
import { Archive, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Loader2, Pencil, Pin, PinOff, Save, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { useOperators } from '@/hooks/useOperators';
import { todayIso } from '@/lib/taskboardDefaults';
import { CONFIRMACOES_NECESSARIAS, ehNotaExtensa, estaFixada, estadoDaNota, paraTurnos, podeEditarNota, porLerPor } from '@/lib/passagemTurno';
import type { TurnKey } from '@/types/taskboard';
import {
  HISTORICO_POR_PAGINA,
  adicionarEntradaHandover,
  arquivarEntradasHandover,
  confirmarLeituraEntradaHandover,
  desafixarEntradaHandover,
  editarEntradaHandover,
  fixarEntradaHandover,
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

/** AAAA-MM-DD (data limite da fixação) como dd/mm/aaaa. */
const fmtData = (iso: string) => iso.split('-').reverse().join('/');

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
  onFixar?: (e: HandoverEntrada) => void;
  onDesafixar?: (e: HandoverEntrada) => void;
  /** Só passa quando a nota se pode editar (o autor, enquanto não está arquivada). Devolve true se gravou. */
  onEditar?: (e: HandoverEntrada, texto: string) => Promise<boolean>;
}

function EntradaCard({ entrada: e, userId, labelOf, busy, onConfirmar, onArquivar, onFixar, onDesafixar, onEditar }: EntradaCardProps) {
  const [expandida, setExpandida] = useState(false);
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState('');
  const extensa = ehNotaExtensa(e.texto);
  const guardarEdicao = async () => {
    if (onEditar && (await onEditar(e, rascunho))) setEditando(false);
  };
  const jaLi = e.leituras.some((l) => l.user_id === userId);
  const souAutor = !!userId && e.autor_user_id === userId;
  const estado = estadoDaNota(e);
  const destinos = paraTurnos(e.turno).map((t) => LABEL_TURNO[t]);
  const fixada = estado.tipo === 'fixada';
  return (
    <li className={`rounded-md border p-3 space-y-2 ${e.arquivada_em || estado.tipo === 'arquivada-sozinha' ? 'bg-muted/40' : ''} ${fixada ? 'border-primary/50 bg-primary/5' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          <strong className="text-foreground">{LABEL_TURNO[e.turno]}</strong> · {fmtDia(e.date)} ·{' '}
          {e.autor_nome ?? labelOf(e.autor_user_id)} · {fmt(e.created_at)}
        </span>
        <span className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" title="Os turnos que vêem esta nota">Para {destinos.join(' e ')}</Badge>
          {estado.tipo === 'fixada' && (
            <Badge
              variant="default"
              title={`Fixada${e.fixada_por_nome ? ` por ${e.fixada_por_nome}` : ''}: não sai das ativas nem se arquiva até ser desafixada${estado.ate ? ` (ou até ${fmtData(estado.ate)})` : ''}`}
            >
              <Pin className="h-3 w-3 mr-1" />
              {estado.ate ? `Fixada até ${fmtData(estado.ate)}` : 'Fixada'}
            </Badge>
          )}
          {e.editada_em && (
            <Badge variant="outline" title={`Editada pelo autor em ${fmt(e.editada_em)}. Texto original: ${e.texto_original ?? ''}`}>
              Editada · {fmt(e.editada_em)}
            </Badge>
          )}
          {estado.tipo === 'por-ler' && <Badge variant="outline">Por ler</Badge>}
          {estado.tipo === 'a-meio' && (
            <Badge variant="outline" title={`A nota sai das ativas 24 h depois da ${CONFIRMACOES_NECESSARIAS}.ª confirmação`}>
              {estado.confirmacoes} de {CONFIRMACOES_NECESSARIAS} confirmações
            </Badge>
          )}
          {estado.tipo === 'a-sair' && (
            <Badge variant="secondary" title="Duas pessoas confirmaram: a nota fica 24 h e depois vai para o histórico">
              Sai das ativas em {estado.horasRestantes} h
            </Badge>
          )}
          {estado.tipo === 'arquivada-sozinha' && (
            <Badge variant="secondary">Arquivada automaticamente · {fmt(e.arquivar_apos)}</Badge>
          )}
          {e.arquivada_em && (
            <Badge variant="secondary">
              Arquivada por {e.arquivada_por_nome ?? '—'} · {fmt(e.arquivada_em)}
            </Badge>
          )}
        </span>
      </div>
      {editando ? (
        <div className="space-y-2">
          <Textarea
            value={rascunho}
            onChange={(ev) => setRascunho(ev.target.value)}
            maxLength={4000}
            className="min-h-[110px]"
            autoFocus
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={guardarEdicao} disabled={rascunho.trim() === '' || rascunho.trim() === e.texto || busy === `edit-${e.id}`}>
              {busy === `edit-${e.id}` ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Guardar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
            <span className="text-xs text-muted-foreground">Fica marcada como «Editada», com o texto original guardado.</span>
          </div>
        </div>
      ) : (
        <div>
          <p
            className={`whitespace-pre-wrap break-words text-sm ${extensa && !expandida ? 'line-clamp-4' : ''}`}
          >
            {e.texto}
          </p>
          {extensa && (
            <Button
              size="sm"
              variant="link"
              className="h-auto px-0 pt-1"
              onClick={() => setExpandida((v) => !v)}
              aria-expanded={expandida}
            >
              {expandida ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Ver menos
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Ver a nota completa
                </>
              )}
            </Button>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {e.leituras.map((l) => (
          <Badge key={l.id} variant="secondary" className="bg-success/15 text-success">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Lida por {l.user_nome ?? labelOf(l.user_id)} · {fmt(l.lida_em)}
          </Badge>
        ))}
        {onConfirmar && !jaLi && !souAutor && (
          <Button size="sm" variant="outline" onClick={() => onConfirmar(e)} disabled={busy === `leitura-${e.id}`}>
            {busy === `leitura-${e.id}` ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
            )}
            Confirmar leitura
          </Button>
        )}
        {onConfirmar && souAutor && (
          <span className="text-xs text-muted-foreground">Deixaste tu esta nota: quem confirma são os outros turnos.</span>
        )}
        {onEditar && !editando && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setRascunho(e.texto);
              setEditando(true);
              setExpandida(true);
            }}
            title="Corrigir o texto da tua nota"
          >
            <Pencil className="h-4 w-4 mr-1.5" />
            Editar
          </Button>
        )}
        {onFixar && !fixada && (
          <Button size="sm" variant="ghost" onClick={() => onFixar(e)} title="A nota fica sempre visível, sem sair pelo prazo">
            <Pin className="h-4 w-4 mr-1.5" />
            Fixar
          </Button>
        )}
        {onDesafixar && fixada && (
          <Button size="sm" variant="ghost" onClick={() => onDesafixar(e)} disabled={busy === `fix-${e.id}`}>
            <PinOff className="h-4 w-4 mr-1.5" />
            Desafixar
          </Button>
        )}
        {onArquivar && !fixada && (
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
  const [aFixar, setAFixar] = useState<HandoverEntrada | null>(null);
  const [fixarAte, setFixarAte] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await getHandoverAtuais();
    if (error) toast.error('Erro ao carregar as notas de passagem de turno.');
    setAtuais(data ?? []);
    setLoading(false);
    // O número ao lado de «Passagem de Turno» no menu acompanha o que acabou de mudar aqui.
    window.dispatchEvent(new Event('update-passagem-badge'));
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

  const editar = async (entrada: HandoverEntrada, texto: string): Promise<boolean> => {
    setBusy(`edit-${entrada.id}`);
    try {
      const { error } = await editarEntradaHandover(entrada.id, texto);
      if (error) {
        toast.error(error.message || 'Não foi possível editar a nota.');
        return false;
      }
      await load();
      toast.success('Nota editada.');
      return true;
    } finally {
      setBusy(null);
    }
  };

  const fixar = async () => {
    if (!aFixar) return;
    setBusy(`fix-${aFixar.id}`);
    try {
      const { error } = await fixarEntradaHandover(aFixar.id, fixarAte || null);
      if (error) {
        toast.error(error.message || 'Não foi possível fixar a nota.');
        return;
      }
      setAFixar(null);
      await load();
      toast.success(fixarAte ? `Nota fixada até ${fmtData(fixarAte)}.` : 'Nota fixada.');
    } finally {
      setBusy(null);
    }
  };

  const desafixar = async (entrada: HandoverEntrada) => {
    setBusy(`fix-${entrada.id}`);
    try {
      const { error } = await desafixarEntradaHandover(entrada.id);
      if (error) {
        toast.error('Não foi possível desafixar a nota.');
        return;
      }
      await load();
      toast.success('Nota desafixada.');
    } finally {
      setBusy(null);
    }
  };

  /** Uma nota lida arquiva-se logo; uma por ler pede confirmação. As fixadas ficam de fora (desafixa-se primeiro). */
  const pedirArquivo = (todas: HandoverEntrada[]) => {
    const lista = todas.filter((e) => !estaFixada(e));
    if (lista.length === 0) {
      toast.info('As notas fixadas não se arquivam: desafixa-as primeiro.');
      return;
    }
    if (lista.length === 1 && lista[0].leituras.length > 0) void arquivar(lista);
    else setAArquivar(lista);
  };

  const porLer = useMemo(() => atuais.filter((e) => porLerPor(e, user?.id)).length, [atuais, user?.id]);
  const fixadas = useMemo(() => atuais.filter((e) => estaFixada(e)).length, [atuais]);
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
        subtitle="Quem sai deixa notas, vistas pelos dois turnos seguintes. Com duas confirmações de leitura a nota fica mais 24 h e vai para o histórico — a não ser que esteja fixada."
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
                  As notas não se apagam. Se escreveres algo errado, podes editar a tua nota (fica marcada como editada).
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
                    {porLer > 0 ? `${porLer} por ler` : 'tudo lido'}
                  </Badge>
                )}
                {!loading && fixadas > 0 && (
                  <Badge variant="outline">
                    <Pin className="h-3 w-3 mr-1" />
                    {fixadas} fixada{fixadas === 1 ? '' : 's'}
                  </Badge>
                )}
              </div>
              {atuais.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => pedirArquivo(atuais)} disabled={busy === 'arq-todas'}>
                  <Archive className="h-4 w-4 mr-1.5" />
                  Arquivar tudo (limpar){fixadas > 0 ? (fixadas === 1 ? ' — menos a fixada' : ` — menos as ${fixadas} fixadas`) : ''}
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
                      onFixar={(x) => {
                        setFixarAte('');
                        setAFixar(x);
                      }}
                      onDesafixar={desafixar}
                      onEditar={podeEditarNota(e, user?.id) ? editar : undefined}
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

      <Dialog open={aFixar !== null} onOpenChange={(o) => !o && setAFixar(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Fixar esta nota</DialogTitle>
            <DialogDescription>
              Uma nota fixada fica sempre no topo das ativas: não sai pelo prazo de 24 h depois das confirmações e não se
              arquiva enquanto estiver fixada. Cada pessoa continua a confirmar a leitura.
            </DialogDescription>
          </DialogHeader>
          {aFixar && <p className="whitespace-pre-wrap rounded-md border bg-muted/40 p-2 text-sm">{aFixar.texto}</p>}
          <div className="space-y-1">
            <Label htmlFor="fixar-ate">Fixar até (opcional)</Label>
            <Input id="fixar-ate" type="date" min={todayIso()} value={fixarAte} onChange={(e) => setFixarAte(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Sem data, fica fixada até alguém a desafixar. Com data, vale até ao fim desse dia e depois volta às regras normais.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAFixar(null)}>
              Cancelar
            </Button>
            <Button onClick={fixar} disabled={!aFixar || busy === `fix-${aFixar.id}`}>
              {aFixar && busy === `fix-${aFixar.id}` ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Pin className="h-4 w-4 mr-1.5" />
              )}
              Fixar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
