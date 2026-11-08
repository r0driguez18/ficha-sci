import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { coincidenciasDosLotes, JANELAS_DIAS, JANELA_PADRAO } from '@/lib/coincidenciasLotes';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { contaComNatureza } from '@/lib/nibBca';
import { usePaginacao } from '@/hooks/usePaginacao';
import { Paginacao } from '@/components/ui/paginacao';
import { listarLotes, marcarVerificado, renomearLote, type Ps2Lote } from '@/services/ps2LotesService';

const fmtValor = (n: number) =>
  Number(n).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Para colar no core: só dígitos (e vírgula se houver cêntimos). */
const valorParaCopiar = (n: number) => {
  const c = Math.round(Number(n) * 100);
  const inteiro = Math.trunc(c / 100);
  const dec = c % 100;
  return dec === 0 ? String(inteiro) : `${inteiro},${String(dec).padStart(2, '0')}`;
};

/** A conta da empresa como se cola no core: conta + natureza juntas, com a natureza como no ficheiro (10001, 10002…). */
const contaCurta = (nib: string) => contaComNatureza(nib);

const dataHora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '';

/** O nome do ficheiro já traz a empresa (SA + empresa + mês + letra): mostra-se sem a extensão. */
const nomeSemExtensao = (n: string) => n.replace(/\.[A-Za-z0-9]{1,8}$/, '');

async function copiar(texto: string, rotulo: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success(`${rotulo} copiado.`);
  } catch {
    toast.error('Não consegui copiar — seleciona e copia à mão.');
  }
}

export default function VerificacaoFicheiros() {
  const queryClient = useQueryClient();
  const [separador, setSeparador] = useState<'por-verificar' | 'historico'>('por-verificar');
  const [pesquisa, setPesquisa] = useState('');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [quem, setQuem] = useState('');
  const [geradoDe, setGeradoDe] = useState('');
  const [geradoAte, setGeradoAte] = useState('');
  const [quemGerou, setQuemGerou] = useState('');
  const [sentido, setSentido] = useState('');
  const [soCoincidem, setSoCoincidem] = useState(false);
  const [janela, setJanela] = useState<number>(JANELA_PADRAO);
  const [verCoincidencias, setVerCoincidencias] = useState<Ps2Lote | null>(null);
  const soPorVerificar = separador === 'por-verificar';
  /** Ficheiros marcados nesta sessão: ficam visíveis (esbatidos) até se recarregar a página. */
  const [marcadosAgora, setMarcadosAgora] = useState<Set<string>>(new Set());
  const [aGravar, setAGravar] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['ps2-lotes'],
    queryFn: async () => {
      const r = await listarLotes({ limite: 1000 });
      if (r.erro) throw new Error(r.erro);
      return r.lotes;
    },
    refetchInterval: 60_000,
  });

  const verificadores = useMemo(
    () => [...new Set((q.data ?? []).map((l) => l.verificado_por_codigo).filter((x): x is string => !!x))].sort(),
    [q.data],
  );

  const geradores = useMemo(
    () => [...new Set((q.data ?? []).map((l) => l.gerado_por_codigo).filter((x): x is string => !!x))].sort(),
    [q.data],
  );

  /** Coincidências sobre TODOS os ficheiros (também os já verificados): o mesmo salário repetido poucos dias depois. */
  const coincidencias = useMemo(() => coincidenciasDosLotes(q.data ?? [], janela), [q.data, janela]);

  const lotes = useMemo(() => {
    const t = pesquisa.trim().toLowerCase();
    const todos = (q.data ?? [])
      .filter((l) => (soPorVerificar ? l.estado !== 'verificado' || marcadosAgora.has(l.id) : l.estado === 'verificado'))
      .filter((l) => !geradoDe || l.created_at.slice(0, 10) >= geradoDe)
      .filter((l) => !geradoAte || l.created_at.slice(0, 10) <= geradoAte)
      .filter((l) => !quemGerou || l.gerado_por_codigo === quemGerou)
      .filter((l) => !sentido || l.sentido === sentido)
      .filter((l) => !soCoincidem || coincidencias.has(l.id))
      .filter(
        (l) =>
          !t ||
          l.nome_ficheiro.toLowerCase().includes(t) ||
          l.conta_empresa.includes(t) ||
          contaCurta(l.conta_empresa).includes(t),
      );
    if (soPorVerificar) return todos;
    // Histórico: o dia em que se verificou (não o do ficheiro), e quem verificou.
    return todos
      .filter((l) => !de || (l.verificado_em ?? '').slice(0, 10) >= de)
      .filter((l) => !ate || (l.verificado_em ?? '').slice(0, 10) <= ate)
      .filter((l) => !quem || l.verificado_por_codigo === quem)
      .sort((x, y) => (y.verificado_em ?? '').localeCompare(x.verificado_em ?? ''));
  }, [q.data, pesquisa, soPorVerificar, marcadosAgora, de, ate, quem, geradoDe, geradoAte, quemGerou, sentido, soCoincidem, coincidencias]);

  const pag = usePaginacao(lotes, { chave: `${separador}|${pesquisa}|${de}|${ate}|${quem}|${geradoDe}|${geradoAte}|${quemGerou}|${sentido}|${soCoincidem}|${janela}` });

  const nPorVerificar = useMemo(() => (q.data ?? []).filter((l) => l.estado !== 'verificado').length, [q.data]);
  const nHistorico = useMemo(() => (q.data ?? []).filter((l) => l.estado === 'verificado').length, [q.data]);

  /** Quantos ficheiros por verificar têm coincidências. */
  const nComCoincidencia = useMemo(
    () => (q.data ?? []).filter((l) => l.estado !== 'verificado' && coincidencias.has(l.id)).length,
    [q.data, coincidencias],
  );

  const recarregar = async () => {
    await queryClient.invalidateQueries({ queryKey: ['ps2-lotes'] });
    window.dispatchEvent(new Event('update-verificacao-badge'));
  };

  const alternar = async (l: Ps2Lote) => {
    const novo = l.estado !== 'verificado';
    setAGravar(l.id);
    const r = await marcarVerificado(l.id, novo);
    setAGravar(null);
    if (r.erro) {
      toast.error(r.erro);
      return;
    }
    setMarcadosAgora((prev) => {
      const n = new Set(prev);
      if (novo) n.add(l.id);
      else n.delete(l.id);
      return n;
    });
    await recarregar();
  };

  /** Só o nome/empresa se edita; a extensão original (.txt, .ps2…) mantém-se. */
  const renomear = async (l: Ps2Lote, texto: string) => {
    const base = texto.trim();
    if (base === nomeSemExtensao(l.nome_ficheiro)) return;
    if (!base) {
      toast.error('O nome não pode ficar vazio.');
      await recarregar();
      return;
    }
    const ext = l.nome_ficheiro.match(/\.[A-Za-z0-9]{1,8}$/)?.[0] ?? '';
    const r = await renomearLote(l.id, base + ext);
    if (r.erro) toast.error(r.erro);
    await recarregar();
  };

  return (
    <PageContainer size="wide">
      <PageHeader
        title="Verificar Débitos/Créditos"
        subtitle="Os ficheiros PS2 guardados no gerador: confere no core e marca como verificado"
      />

      <p className="mb-4 text-sm text-muted-foreground">
        Salários e pagamentos <strong>debitam</strong> a conta da empresa; cobranças <strong>creditam</strong>-na. No core,
        confirma que há <strong>um</strong> movimento com o valor (dois é duplicado) e marca o ficheiro como verificado.
      </p>

      <Tabs value={separador} onValueChange={(v) => setSeparador(v as 'por-verificar' | 'historico')} className="mb-4">
        <TabsList>
          <TabsTrigger value="por-verificar">Por verificar ({nPorVerificar})</TabsTrigger>
          <TabsTrigger value="historico">Histórico ({nHistorico})</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <Input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="max-w-sm"
            placeholder="Procurar por ficheiro, empresa ou conta"
            aria-label="Procurar por ficheiro, empresa ou conta"
          />
          <div className="space-y-1">
            <Label htmlFor="ger-de" className="text-xs">Gerado de</Label>
            <Input id="ger-de" type="date" value={geradoDe} onChange={(e) => setGeradoDe(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ger-ate" className="text-xs">até</Label>
            <Input id="ger-ate" type="date" value={geradoAte} onChange={(e) => setGeradoAte(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ger-quem" className="text-xs">Quem gerou</Label>
            <select id="ger-quem" value={quemGerou} onChange={(e) => setQuemGerou(e.target.value)} className="h-10 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">Todos</option>
              {geradores.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ger-sentido" className="text-xs">Na conta</Label>
            <select id="ger-sentido" value={sentido} onChange={(e) => setSentido(e.target.value)} className="h-10 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">Débito e crédito</option>
              <option value="debito">Débito</option>
              <option value="credito">Crédito</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ger-janela" className="text-xs" title="Mesmo valor na mesma conta gerado com até estes dias de diferença">Coincidência em até</Label>
            <select id="ger-janela" value={janela} onChange={(e) => setJanela(Number(e.target.value))} className="h-10 rounded-md border border-input bg-background px-2 text-sm">
              {JANELAS_DIAS.map((d) => (
                <option key={d} value={d}>{d} {d === 1 ? 'dia' : 'dias'}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Checkbox id="so-coincidem" checked={soCoincidem} onCheckedChange={(v) => setSoCoincidem(v === true)} />
            <Label htmlFor="so-coincidem" className="cursor-pointer text-xs font-normal">Só os que coincidem</Label>
          </div>
          {!soPorVerificar && (
            <>
              <div className="space-y-1">
                <Label htmlFor="hist-de" className="text-xs">Verificado de</Label>
                <Input id="hist-de" type="date" value={de} onChange={(e) => setDe(e.target.value)} className="w-40" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hist-ate" className="text-xs">até</Label>
                <Input id="hist-ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="w-40" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hist-quem" className="text-xs">Quem verificou</Label>
                <select
                  id="hist-quem"
                  value={quem}
                  onChange={(e) => setQuem(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="">Todos</option>
                  {verificadores.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <span className="text-xs text-muted-foreground">{lotes.length} ficheiro(s)</span>
        </CardContent>
      </Card>

      {nComCoincidencia > 0 && (
        <Alert className="mb-4 border-amber-500/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{nComCoincidencia}</strong> ficheiro(s) por verificar têm o mesmo valor, na mesma conta, de outro ficheiro
            gerado há {janela} dia(s) ou menos (ou têm exatamente o mesmo conteúdo). Uma folha igual mês após mês é normal;
            poucos dias depois pode ser um ficheiro aplicado duas vezes.{' '}
            <button type="button" className="text-primary underline" onClick={() => { setSoCoincidem(true); setSeparador('por-verificar'); }}>
              Ver só estes
            </button>
          </AlertDescription>
        </Alert>
      )}

      {q.isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{(q.error as Error).message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">{soPorVerificar ? 'Verificado' : 'Desfazer'}</TableHead>
                <TableHead title="Data de processamento dentro do ficheiro">Data do ficheiro</TableHead>
                <TableHead title="Quando e por quem o ficheiro foi gerado">Gerado em</TableHead>
                <TableHead>Empresa / ficheiro</TableHead>
                <TableHead title="O que o core deve mostrar na conta da empresa: um débito (salários, pagamentos) ou um crédito (cobranças)">
                  Na conta da empresa
                </TableHead>
                <TableHead title="Conta e natureza juntas, como se colam no core">Conta</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Quem verificou</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-sm text-muted-foreground">
                    A carregar…
                  </TableCell>
                </TableRow>
              )}
              {!q.isLoading && lotes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    {soPorVerificar
                      ? 'Nada por verificar. Os ficheiros aparecem aqui quando são guardados no gerador PS2; depois de verificados ficam no Histórico.'
                      : 'Nenhum ficheiro verificado com estes filtros.'}
                  </TableCell>
                </TableRow>
              )}
              {pag.itens.map((l) => {
                const feito = l.estado === 'verificado';
                return (
                  <TableRow key={l.id} className={feito ? 'bg-muted/30' : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={feito}
                        disabled={aGravar === l.id}
                        onCheckedChange={() => alternar(l)}
                        aria-label={`${soPorVerificar ? 'Verificado' : 'Desfazer a verificação'}: ${l.nome_ficheiro}`}
                        className="h-5 w-5"
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{l.data_processamento}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {dataHora(l.created_at)}
                      <div className="text-[10px] text-muted-foreground">{l.gerado_por_codigo ?? '—'}</div>
                    </TableCell>
                    <TableCell>
                      {feito ? (
                        <div className="font-mono text-sm font-medium text-muted-foreground">
                          {nomeSemExtensao(l.nome_ficheiro)}
                        </div>
                      ) : (
                        <Input
                          key={`${l.id}-${l.nome_ficheiro}`}
                          defaultValue={nomeSemExtensao(l.nome_ficheiro)}
                          maxLength={200}
                          aria-label="Empresa / ficheiro"
                          className="h-8 font-mono text-sm font-medium"
                          onBlur={(e) => renomear(l, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                        />
                      )}
                      <div className="text-[10px] text-muted-foreground">
                        {l.tipo_operacao} · {l.n_registos} registos
                      </div>
                      {coincidencias.has(l.id) && (
                        <button
                          type="button"
                          onClick={() => setVerCoincidencias(l)}
                          className="mt-1 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          Coincide com {coincidencias.get(l.id)!.length} ficheiro(s) — ver
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {l.sentido === 'credito' ? 'Crédito' : 'Débito'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-mono text-xs hover:text-primary"
                        title={`NIB ${l.conta_empresa} — clica para copiar a conta com a natureza`}
                        onClick={() => copiar(contaCurta(l.conta_empresa), 'Conta com natureza')}
                      >
                        {contaCurta(l.conta_empresa)} <Copy className="h-3 w-3" />
                      </button>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 tabular-nums hover:text-primary"
                        title="Clica para copiar o valor"
                        onClick={() => copiar(valorParaCopiar(l.total), 'Valor')}
                      >
                        {fmtValor(l.total)} <Copy className="h-3 w-3" />
                      </button>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {feito && (
                        <>
                          {l.verificado_por_codigo ?? '—'} · {dataHora(l.verificado_em)}
                          {l.mesma_pessoa && <div className="text-amber-600">mesma pessoa que guardou</div>}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Paginacao p={pag} />

      <Dialog open={verCoincidencias !== null} onOpenChange={(o) => !o && setVerCoincidencias(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ficheiros que coincidem</DialogTitle>
            <DialogDescription>
              {verCoincidencias && (
                <>
                  <span className="font-mono">{nomeSemExtensao(verCoincidencias.nome_ficheiro)}</span> · {fmtValor(verCoincidencias.total)} CVE ·
                  conta {contaCurta(verCoincidencias.conta_empresa)} · gerado em {dataHora(verCoincidencias.created_at)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ficheiro</TableHead>
                  <TableHead>Gerado em</TableHead>
                  <TableHead>Diferença</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(verCoincidencias ? coincidencias.get(verCoincidencias.id) ?? [] : []).map((c) => (
                  <TableRow key={c.lote.id}>
                    <TableCell>
                      <div className="font-mono text-xs">{nomeSemExtensao(c.lote.nome_ficheiro)}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {c.lote.tipo_operacao} · {c.lote.n_registos} registos{c.mesmosRegistos ? ' (mesmo nº)' : ''}
                      </div>
                      {c.motivo === 'mesmo-conteudo' && <div className="text-[10px] text-amber-700">exatamente o mesmo conteúdo</div>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {dataHora(c.lote.created_at)}
                      <div className="text-[10px] text-muted-foreground">{c.lote.gerado_por_codigo ?? '—'}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {c.diasDeDiferenca === 0 ? 'no mesmo dia' : `${c.diasDeDiferenca} dia(s)`}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">{fmtValor(c.lote.total)}</TableCell>
                    <TableCell className="text-xs">
                      {c.lote.estado === 'verificado'
                        ? `Verificado${c.lote.verificado_por_codigo ? ' por ' + c.lote.verificado_por_codigo : ''} · ${dataHora(c.lote.verificado_em)}`
                        : 'Por verificar'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
