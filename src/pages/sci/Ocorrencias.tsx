import React, { useEffect, useMemo, useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, FileDown, Pencil, Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentOperator, useIsAdmin } from '@/hooks/useOperators';
import { OcorrenciaDialog } from '@/components/ocorrencias/OcorrenciaDialog';
import {
  CATEGORIAS,
  duracaoMinutos,
  emCurso,
  formatarDuracao,
  horaAtual,
  nomeCategoria,
  nomeTurno,
  resumirOcorrencias,
  somarDias,
  type FormOcorrencia,
  type Ocorrencia,
} from '@/lib/ocorrencias';
import { todayIso } from '@/lib/taskboardDefaults';
import {
  atualizarOcorrencia,
  guardarObservacoesDia,
  listarEmCurso,
  listarOcorrencias,
  listarOcorrenciasDoDia,
  obterObservacoesDia,
  reabrirOcorrencia,
  registarOcorrencia,
  terminarOcorrencia,
} from '@/services/ocorrenciasService';
import { generateOcorrenciasPDF } from '@/utils/pdf/pdfOcorrencias';

const TODAS = '__todas__';
const dataCurta = (iso: string) => iso.split('-').reverse().join('/');

export default function Ocorrencias() {
  const queryClient = useQueryClient();
  const operador = useCurrentOperator();
  const isAdmin = useIsAdmin();

  const [aba, setAba] = useState('dia');
  const [data, setData] = useState(todayIso());
  const [dialogo, setDialogo] = useState<{ aberto: boolean; ocorrencia: Ocorrencia | null }>({ aberto: false, ocorrencia: null });
  const [observacoes, setObservacoes] = useState('');
  const [observacoesGuardadas, setObservacoesGuardadas] = useState('');
  const [aGravarObs, setAGravarObs] = useState(false);

  // Histórico
  const [categoria, setCategoria] = useState<string>(TODAS);
  const [estado, setEstado] = useState<'curso' | 'terminadas' | typeof TODAS>(TODAS);
  const [pesquisa, setPesquisa] = useState('');

  const doDia = useQuery({
    queryKey: ['ocorrencias', 'dia', data],
    queryFn: () => listarOcorrenciasDoDia(data),
    refetchInterval: 60_000,
  });
  const obs = useQuery({
    queryKey: ['ocorrencias', 'obs', data],
    queryFn: () => obterObservacoesDia(data),
  });
  const abertas = useQuery({ queryKey: ['ocorrencias', 'curso'], queryFn: listarEmCurso, refetchInterval: 60_000 });
  const historico = useQuery({ queryKey: ['ocorrencias', 'historico'], queryFn: () => listarOcorrencias() });

  // As observações do dia vêm do servidor sempre que se muda de dia.
  useEffect(() => {
    if (obs.data !== undefined) {
      setObservacoes(obs.data);
      setObservacoesGuardadas(obs.data);
    }
  }, [obs.data, data]);

  const linhas = doDia.data ?? [];
  const emCursoDeOutrosDias = (abertas.data ?? []).filter((o) => o.data !== data);
  const todas = historico.data ?? [];
  const resumo = useMemo(() => resumirOcorrencias(todas, todayIso()), [todas]);
  const sistemas = useMemo(
    () => [...new Set(todas.map((o) => o.sistema?.trim()).filter((s): s is string => !!s))].sort(),
    [todas],
  );

  const listaHistorico = useMemo(() => {
    const t = pesquisa.trim().toLowerCase();
    return todas.filter(
      (o) =>
        (estado === TODAS || (estado === 'curso' ? emCurso(o) : !emCurso(o))) &&
        (categoria === TODAS || o.categoria === categoria) &&
        (!t ||
          o.descricao.toLowerCase().includes(t) ||
          (o.n_avaria ?? '').toLowerCase().includes(t) ||
          (o.encaminhamento ?? '').toLowerCase().includes(t) ||
          (o.sistema ?? '').toLowerCase().includes(t)),
    );
  }, [todas, estado, categoria, pesquisa]);

  const recarregar = async () => {
    await queryClient.invalidateQueries({ queryKey: ['ocorrencias'] });
    window.dispatchEvent(new Event('update-ocorrencias-badge'));
  };

  const guardar = async (f: FormOcorrencia): Promise<string | null> => {
    const alvo = dialogo.ocorrencia;
    const r = alvo ? await atualizarOcorrencia(alvo.id, f) : await registarOcorrencia(f);
    if (r.erro) return r.erro;
    toast.success(alvo ? 'Avaria atualizada.' : 'Avaria registada.');
    setDialogo({ aberto: false, ocorrencia: null });
    if (!alvo && f.data !== data) setData(f.data);
    await recarregar();
    return null;
  };

  const terminar = async (o: Ocorrencia) => {
    const r = await terminarOcorrencia(o.id, horaAtual());
    if (r.erro) toast.error(r.erro);
    else await recarregar();
  };

  const reabrir = async (o: Ocorrencia) => {
    const r = await reabrirOcorrencia(o.id);
    if (r.erro) toast.error(r.erro);
    else await recarregar();
  };

  const guardarObs = async () => {
    setAGravarObs(true);
    const r = await guardarObservacoesDia(data, observacoes);
    setAGravarObs(false);
    if (r.erro) {
      toast.error(r.erro);
      return;
    }
    setObservacoesGuardadas(observacoes);
    toast.success('Observações guardadas.');
    await queryClient.invalidateQueries({ queryKey: ['ocorrencias', 'obs'] });
  };

  const descarregarPdf = () => {
    const doc = generateOcorrenciasPDF({ data, linhas, observacoes: observacoesGuardadas });
    doc.save(`Ocorrencias_${data}.pdf`);
  };

  const podeEditar = (o: Ocorrencia) => isAdmin || (!!operador && o.criada_por_codigo === operador.value);
  const obsAlteradas = observacoes !== observacoesGuardadas;

  return (
    <PageContainer size="wide">
      <PageHeader
        title="Ocorrências"
        subtitle="Ficha de Comunicação/Ocorrências: as avarias do dia, como na ficha em papel"
      >
        <Button variant="outline" onClick={descarregarPdf} className="gap-1.5" disabled={linhas.length === 0 && !observacoesGuardadas.trim()}>
          <FileDown className="h-4 w-4" />
          Descarregar PDF
        </Button>
        <Button onClick={() => setDialogo({ aberto: true, ocorrencia: null })} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nova avaria
        </Button>
      </PageHeader>

      <Tabs value={aba} onValueChange={setAba}>
        <TabsList className="mb-4">
          <TabsTrigger value="dia">Ficha do dia</TabsTrigger>
          <TabsTrigger value="historico">Histórico e pesquisa</TabsTrigger>
        </TabsList>

        <TabsContent value="dia" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setData(somarDias(data, -1))} aria-label="Dia anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input type="date" value={data} onChange={(e) => e.target.value && setData(e.target.value)} className="w-44" aria-label="Data da ficha" />
            <Button variant="outline" size="icon" onClick={() => setData(somarDias(data, 1))} aria-label="Dia seguinte">
              <ChevronRight className="h-4 w-4" />
            </Button>
            {data !== todayIso() && (
              <Button variant="ghost" size="sm" onClick={() => setData(todayIso())}>
                Hoje
              </Button>
            )}
          </div>

          {emCursoDeOutrosDias.length > 0 && (
            <div role="status" className="rounded-lg border border-amber-500/50 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                {emCursoDeOutrosDias.length === 1 ? 'Há uma avaria em curso de outro dia' : `Há ${emCursoDeOutrosDias.length} avarias em curso de outros dias`}
              </div>
              <ul className="mt-1 space-y-1">
                {emCursoDeOutrosDias.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <strong>{dataCurta(o.data)}</strong> · {o.n_avaria ? `${o.n_avaria} · ` : ''}
                      {o.descricao.length > 80 ? `${o.descricao.slice(0, 80)}…` : o.descricao}
                    </span>
                    <span className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setData(o.data)}>
                        Ver o dia
                      </Button>
                      <Button size="sm" onClick={() => terminar(o)}>
                        Terminar agora
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {doDia.isError && (
            <Alert variant="destructive">
              <AlertDescription>{(doDia.error as Error).message}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Avarias de {dataCurta(data)}
                {linhas.length > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({linhas.length})</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {doDia.isLoading ? (
                <div className="p-6">
                  <LoadingState label="A carregar as avarias…" />
                </div>
              ) : linhas.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={CheckCircle2}
                    title="Sem avarias neste dia"
                    hint="Quando houver uma, regista-a em «Nova avaria»: fica na ficha e segue em anexo ao PDF da ficha de procedimentos."
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">N.º Avaria</TableHead>
                      <TableHead>Descrição da Avaria</TableHead>
                      <TableHead className="w-24">Hora início</TableHead>
                      <TableHead className="w-40">Hora término</TableHead>
                      <TableHead className="w-48">Encaminhamento</TableHead>
                      <TableHead className="w-28" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linhas.map((o) => (
                      <TableRow key={o.id} className={emCurso(o) ? 'bg-amber-50/60 dark:bg-amber-950/20' : undefined}>
                        <TableCell className="font-mono text-sm">{o.n_avaria ?? ''}</TableCell>
                        <TableCell>
                          <div className="whitespace-pre-wrap text-sm">{o.descricao}</div>
                          {(o.categoria || o.sistema || o.turno) && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {o.turno && <Badge variant="outline">{nomeTurno(o.turno)}</Badge>}
                              {o.categoria && <Badge variant="secondary">{nomeCategoria(o.categoria)}</Badge>}
                              {o.sistema && <Badge variant="secondary">{o.sistema}</Badge>}
                            </div>
                          )}
                          <div className="mt-1 text-[11px] text-muted-foreground">registada por {o.criada_por_codigo ?? '—'}</div>
                        </TableCell>
                        <TableCell className="tabular-nums">{o.hora_inicio ?? ''}</TableCell>
                        <TableCell>
                          {emCurso(o) ? (
                            <div className="flex flex-col items-start gap-1">
                              <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-300">
                                Em curso
                              </Badge>
                              <Button size="sm" className="h-7 gap-1 px-2" onClick={() => terminar(o)}>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Terminar
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <span className="tabular-nums">{o.hora_termino}</span>
                              {formatarDuracao(duracaoMinutos(o.hora_inicio, o.hora_termino)) && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  ({formatarDuracao(duracaoMinutos(o.hora_inicio, o.hora_termino))})
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{o.encaminhamento ?? ''}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {!emCurso(o) && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Reabrir" onClick={() => reabrir(o)}>
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            {podeEditar(o) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Editar"
                                onClick={() => setDialogo({ aberto: true, ocorrencia: o })}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Outras Intervenções/Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                rows={5}
                maxLength={3000}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                aria-label="Outras intervenções e observações do dia"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {obsAlteradas ? 'Alterações por guardar.' : 'Segue no anexo do PDF da ficha deste dia.'}
                </span>
                <Button size="sm" onClick={guardarObs} disabled={!obsAlteradas || aGravarObs}>
                  Guardar observações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Em curso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold tabular-nums">{resumo.emCurso}</div>
                <p className="text-xs text-muted-foreground">sem hora de término</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Últimos 90 dias, por categoria</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {resumo.porCategoria.length === 0 && <span className="text-sm text-muted-foreground">Sem avarias classificadas.</span>}
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

          <Card>
            <CardContent className="grid gap-3 pt-6 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={estado} onValueChange={(v) => setEstado(v as typeof estado)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODAS}>Todas</SelectItem>
                    <SelectItem value="curso">Em curso</SelectItem>
                    <SelectItem value="terminadas">Terminadas</SelectItem>
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
                <Label htmlFor="oc-pesquisa">Pesquisar</Label>
                <Input id="oc-pesquisa" placeholder="n.º, descrição, encaminhamento, sistema…" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {historico.isLoading ? (
            <LoadingState label="A carregar o histórico…" />
          ) : listaHistorico.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="Nenhuma avaria com estes filtros" />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Data</TableHead>
                    <TableHead className="w-28">N.º Avaria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-36">Início – término</TableHead>
                    <TableHead className="w-48">Encaminhamento</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listaHistorico.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="whitespace-nowrap text-sm">{dataCurta(o.data)}</TableCell>
                      <TableCell className="font-mono text-sm">{o.n_avaria ?? ''}</TableCell>
                      <TableCell className="text-sm">
                        <div className="whitespace-pre-wrap">{o.descricao}</div>
                        {(o.categoria || o.sistema) && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {o.categoria && <Badge variant="secondary">{nomeCategoria(o.categoria)}</Badge>}
                            {o.sistema && <Badge variant="secondary">{o.sistema}</Badge>}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm tabular-nums">
                        {o.hora_inicio ?? '—'} – {o.hora_termino ?? <span className="text-amber-700 dark:text-amber-300">em curso</span>}
                      </TableCell>
                      <TableCell className="text-sm">{o.encaminhamento ?? ''}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setData(o.data);
                            setAba('dia');
                          }}
                        >
                          Ver o dia
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <OcorrenciaDialog
        aberto={dialogo.aberto}
        ocorrencia={dialogo.ocorrencia}
        data={data}
        sistemasConhecidos={sistemas}
        onFechar={() => setDialogo({ aberto: false, ocorrencia: null })}
        onGuardar={guardar}
      />
    </PageContainer>
  );
}
