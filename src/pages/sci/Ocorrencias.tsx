import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle2, Pencil, Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentOperator, useIsAdmin } from '@/hooks/useOperators';
import { OcorrenciaDialog } from '@/components/ocorrencias/OcorrenciaDialog';
import {
  CATEGORIAS,
  GRAVIDADES,
  nomeCategoria,
  nomeGravidade,
  nomeTurno,
  resumirOcorrencias,
  type FormOcorrencia,
  type Gravidade,
  type Ocorrencia,
} from '@/lib/ocorrencias';
import { todayIso } from '@/lib/taskboardDefaults';
import {
  atualizarOcorrencia,
  listarOcorrencias,
  reabrirOcorrencia,
  registarOcorrencia,
  resolverOcorrencia,
} from '@/services/ocorrenciasService';

const TODAS = '__todas__';

const COR_GRAVIDADE: Record<Gravidade, 'secondary' | 'default' | 'destructive'> = {
  baixa: 'secondary',
  media: 'default',
  alta: 'destructive',
};

const dataHora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '';

export default function Ocorrencias() {
  const queryClient = useQueryClient();
  const operador = useCurrentOperator();
  const isAdmin = useIsAdmin();

  const [estado, setEstado] = useState<'aberta' | 'resolvida' | typeof TODAS>('aberta');
  const [categoria, setCategoria] = useState<string>(TODAS);
  const [gravidade, setGravidade] = useState<string>(TODAS);
  const [pesquisa, setPesquisa] = useState('');
  const [dialogo, setDialogo] = useState<{ aberto: boolean; ocorrencia: Ocorrencia | null }>({ aberto: false, ocorrencia: null });
  const [aResolver, setAResolver] = useState<Ocorrencia | null>(null);
  const [resolucao, setResolucao] = useState('');
  const [aGravar, setAGravar] = useState(false);

  const q = useQuery({
    queryKey: ['ocorrencias'],
    queryFn: async () => {
      const r = await listarOcorrencias();
      if (r.erro) throw new Error(r.erro);
      return r.ocorrencias;
    },
    refetchInterval: 60_000,
  });

  const todas = q.data ?? [];
  const resumo = useMemo(() => resumirOcorrencias(todas, todayIso()), [todas]);
  const sistemas = useMemo(
    () => [...new Set(todas.map((o) => o.sistema?.trim()).filter((s): s is string => !!s))].sort(),
    [todas],
  );

  const lista = useMemo(() => {
    const t = pesquisa.trim().toLowerCase();
    return todas.filter(
      (o) =>
        (estado === TODAS || o.estado === estado) &&
        (categoria === TODAS || o.categoria === categoria) &&
        (gravidade === TODAS || o.gravidade === gravidade) &&
        (!t ||
          o.titulo.toLowerCase().includes(t) ||
          (o.descricao ?? '').toLowerCase().includes(t) ||
          (o.sistema ?? '').toLowerCase().includes(t) ||
          (o.resolucao ?? '').toLowerCase().includes(t)),
    );
  }, [todas, estado, categoria, gravidade, pesquisa]);

  const recarregar = async () => {
    await queryClient.invalidateQueries({ queryKey: ['ocorrencias'] });
    window.dispatchEvent(new Event('update-ocorrencias-badge'));
  };

  const guardar = async (f: FormOcorrencia): Promise<string | null> => {
    const alvo = dialogo.ocorrencia;
    const r = alvo ? await atualizarOcorrencia(alvo.id, f) : await registarOcorrencia(f);
    if (r.erro) return r.erro;
    toast.success(alvo ? 'Ocorrência atualizada.' : 'Ocorrência registada.');
    setDialogo({ aberto: false, ocorrencia: null });
    await recarregar();
    return null;
  };

  const confirmarResolucao = async () => {
    if (!aResolver) return;
    if (!resolucao.trim()) {
      toast.error('Indica como foi resolvida.');
      return;
    }
    setAGravar(true);
    const r = await resolverOcorrencia(aResolver.id, resolucao);
    setAGravar(false);
    if (r.erro) {
      toast.error(r.erro);
      return;
    }
    toast.success('Ocorrência resolvida.');
    setAResolver(null);
    setResolucao('');
    await recarregar();
  };

  const reabrir = async (o: Ocorrencia) => {
    const r = await reabrirOcorrencia(o.id);
    if (r.erro) toast.error(r.erro);
    else await recarregar();
  };

  const podeEditar = (o: Ocorrencia) => isAdmin || (!!operador && o.criada_por_codigo === operador.value);

  return (
    <PageContainer size="wide">
      <PageHeader
        title="Ocorrências"
        subtitle="Incidentes dos turnos, registados de forma estruturada para pesquisar e aprender com o que se repete"
      >
        <Button onClick={() => setDialogo({ aberto: true, ocorrencia: null })} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nova ocorrência
        </Button>
      </PageHeader>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">{resumo.abertas}</div>
            <p className="text-xs text-muted-foreground">
              {resumo.abertasAltas > 0 ? `${resumo.abertasAltas} de gravidade alta` : 'nenhuma de gravidade alta'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Últimos 90 dias, por categoria</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {resumo.porCategoria.length === 0 && <span className="text-sm text-muted-foreground">Sem ocorrências.</span>}
            {resumo.porCategoria.map((c) => (
              <Badge key={c.chave} variant="secondary">
                {nomeCategoria(c.chave)} · {c.total}
              </Badge>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">O que se repete (2 ou mais vezes)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {resumo.recorrentes.length === 0 && <span className="text-sm text-muted-foreground">Nada recorrente.</span>}
            {resumo.recorrentes.map((s) => (
              <Badge key={s.chave} variant="outline">
                {s.chave} · {s.total}×
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={estado} onValueChange={(v) => setEstado(v as typeof estado)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aberta">Abertas</SelectItem>
                <SelectItem value="resolvida">Resolvidas</SelectItem>
                <SelectItem value={TODAS}>Todas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODAS}>Todas</SelectItem>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c.valor} value={c.valor}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Gravidade</Label>
            <Select value={gravidade} onValueChange={setGravidade}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODAS}>Todas</SelectItem>
                {GRAVIDADES.map((g) => (
                  <SelectItem key={g.valor} value={g.valor}>
                    {g.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oc-pesquisa">Pesquisar</Label>
            <Input id="oc-pesquisa" placeholder="título, sistema, descrição…" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {q.isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{(q.error as Error).message}</AlertDescription>
        </Alert>
      )}

      {q.isLoading ? (
        <LoadingState label="A carregar as ocorrências…" />
      ) : lista.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title={todas.length === 0 ? 'Ainda não há ocorrências' : 'Nenhuma ocorrência com estes filtros'}
          hint="Regista aqui o que correr mal num turno: fica pesquisável e mostra o que se repete."
        />
      ) : (
        <div className="space-y-3">
          {lista.map((o) => (
            <Card key={o.id} className={o.estado === 'resolvida' ? 'bg-muted/30' : undefined}>
              <CardContent className="pt-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant={COR_GRAVIDADE[o.gravidade]}>{nomeGravidade(o.gravidade)}</Badge>
                      <Badge variant="outline">{nomeCategoria(o.categoria)}</Badge>
                      {o.sistema && <Badge variant="secondary">{o.sistema}</Badge>}
                      {o.estado === 'resolvida' && (
                        <Badge variant="outline" className="gap-1 text-green-700 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Resolvida
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium text-foreground">{o.titulo}</h3>
                    <p className="text-xs text-muted-foreground">
                      {o.data}
                      {o.hora ? ` às ${o.hora}` : ''}
                      {nomeTurno(o.turno) ? ` · ${nomeTurno(o.turno)}` : ''} · registada por {o.criada_por_codigo ?? '—'}
                    </p>
                    {o.descricao && <p className="mt-2 whitespace-pre-wrap text-sm">{o.descricao}</p>}
                    {o.estado === 'resolvida' && (
                      <div className="mt-2 rounded-md border bg-background p-2 text-sm">
                        <span className="font-medium">Resolução:</span> {o.resolucao}
                        <div className="text-xs text-muted-foreground">
                          por {o.resolvida_por_codigo ?? '—'} · {dataHora(o.resolvida_em)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {podeEditar(o) && (
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setDialogo({ aberto: true, ocorrencia: o })}>
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                    )}
                    {o.estado === 'aberta' ? (
                      <Button size="sm" className="gap-1.5" onClick={() => setAResolver(o)}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Resolver
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => reabrir(o)}>
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reabrir
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <OcorrenciaDialog
        aberto={dialogo.aberto}
        ocorrencia={dialogo.ocorrencia}
        sistemasConhecidos={sistemas}
        onFechar={() => setDialogo({ aberto: false, ocorrencia: null })}
        onGuardar={guardar}
      />

      <Dialog open={!!aResolver} onOpenChange={(o) => !o && !aGravar && setAResolver(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver ocorrência</DialogTitle>
            <DialogDescription>{aResolver?.titulo}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="oc-resolucao">Como foi resolvida?</Label>
            <Textarea id="oc-resolucao" rows={4} maxLength={2000} value={resolucao} onChange={(e) => setResolucao(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAResolver(null)} disabled={aGravar}>
              Cancelar
            </Button>
            <Button onClick={confirmarResolucao} disabled={aGravar}>
              Marcar como resolvida
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
