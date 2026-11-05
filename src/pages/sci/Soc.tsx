import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronRight, ClipboardCopy, FileDown, FileSpreadsheet, Lock, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  NOME_CARTAO,
  NOME_CLASSE,
  NOME_RECOMENDACAO,
  analisarSoc,
  candidatosDe,
  contarPor,
  dominiosDoCartao,
  ehCandidato,
  listaParaEsa,
  paraCsv,
  preSelecionados,
  textoEmail,
  type Cartao,
  type DominioSoc,
  type Recomendacao,
  type ResultadoSoc,
} from '@/lib/soc';
import { lerFicheiroSoc } from '@/lib/socFicheiro';

const COR: Record<Recomendacao, string> = {
  whitelist: 'border-green-600 text-green-700 dark:text-green-400',
  'verificar-remetente': 'border-amber-500 text-amber-700 dark:text-amber-300',
  'nao-libertar': 'border-red-600 text-red-700 dark:text-red-400',
  verificar: 'border-amber-500 text-amber-700 dark:text-amber-300',
  manter: 'text-muted-foreground',
};
const TODAS = '__todas__';
const RECOMENDACOES: Recomendacao[] = ['whitelist', 'verificar-remetente', 'nao-libertar', 'verificar', 'manter'];
const dataCurta = (d: Date | null) => (d ? d.toLocaleDateString('pt-PT') : '—');
const pct = (n: number, total: number) => (total === 0 ? '0%' : `${Math.round((n / total) * 100)}%`);

/** O que o painel do resumo está a mostrar: os domínios de um cartão, ou os de uma recomendação. */
type Foco = { tipo: 'cartao'; cartao: Cartao } | { tipo: 'rec'; rec: Recomendacao };

async function copiar(texto: string, rotulo: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success(`${rotulo} copiado.`);
  } catch {
    toast.error('Não consegui copiar — seleciona o texto e copia à mão.');
  }
}

function descarregar(nome: string, conteudo: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

const Selo: React.FC<{ rec: Recomendacao }> = ({ rec }) => (
  <Badge variant="outline" className={COR[rec]}>
    {NOME_RECOMENDACAO[rec]}
  </Badge>
);

/** Pode ir no pedido? Todos os de CV/PT, menos os que nunca se libertam (vírus ou parecidos com o banco). */
const podeIrNoPedido = (d: DominioSoc) => ehCandidato(d) && d.recomendacao !== 'nao-libertar';

export default function Soc() {
  const entrada = useRef<HTMLInputElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const [ficheiro, setFicheiro] = useState('');
  const [resultado, setResultado] = useState<ResultadoSoc | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [escolhidos, setEscolhidos] = useState<Set<string>>(new Set());
  const [filtroRec, setFiltroRec] = useState<string>(TODAS);
  const [pesquisa, setPesquisa] = useState('');
  const [email, setEmail] = useState('');
  const [tab, setTab] = useState('resumo');
  const [foco, setFoco] = useState<Foco | null>(null);
  const [detalhe, setDetalhe] = useState<DominioSoc | null>(null);

  const dominios = resultado?.dominios ?? [];
  const candidatos = useMemo(() => candidatosDe(dominios), [dominios]);

  const gerarEmail = (alvo: Set<string>, nome: string) =>
    setEmail(textoEmail(dominios.filter((d) => alvo.has(d.dominio)), { ficheiro: nome }));

  const abrir = async (f: File) => {
    setErro(null);
    const leitura = lerFicheiroSoc(await f.arrayBuffer());
    if ('erro' in leitura) {
      setErro(leitura.erro);
      setResultado(null);
      return;
    }
    const r = analisarSoc(leitura.linhas);
    // Os domínios de Cabo Verde e Portugal já vêm escolhidos para o e-mail; quem decide tira os que não quiser.
    const marcados = new Set(preSelecionados(r.dominios).map((d) => d.dominio));
    setFicheiro(f.name);
    setResultado(r);
    setEscolhidos(marcados);
    setFiltroRec(TODAS);
    setPesquisa('');
    setFoco(null);
    setDetalhe(null);
    setTab('resumo');
    setEmail(textoEmail(r.dominios.filter((d) => marcados.has(d.dominio)), { ficheiro: f.name }));
    toast.success(`${leitura.linhas.length} mensagens lidas (folha "${leitura.folha}") · ${marcados.size} domínios já escolhidos para o e-mail.`);
  };

  const definirEscolhidos = (n: Set<string>) => {
    setEscolhidos(n);
    gerarEmail(n, ficheiro);
  };

  const alternar = (dominio: string) => {
    const n = new Set(escolhidos);
    if (n.has(dominio)) n.delete(dominio);
    else n.add(dominio);
    definirEscolhidos(n);
  };

  const todos = useMemo(() => {
    const t = pesquisa.trim().toLowerCase();
    return dominios.filter((d) => (filtroRec === TODAS || d.recomendacao === filtroRec) && (!t || d.dominio.includes(t)));
  }, [dominios, filtroRec, pesquisa]);

  const r = resultado?.resumo;
  const selecionados = dominios.filter((d) => escolhidos.has(d.dominio));
  const elegiveis = candidatos.filter(podeIrNoPedido);

  // Os domínios que o painel do resumo mostra, conforme o cartão ou a recomendação em que se clicou.
  const doFoco = useMemo(() => {
    if (!foco) return [];
    return foco.tipo === 'cartao' ? dominiosDoCartao(dominios, foco.cartao) : dominios.filter((d) => d.recomendacao === foco.rec);
  }, [foco, dominios]);
  const tituloFoco = foco ? (foco.tipo === 'cartao' ? NOME_CARTAO[foco.cartao] : NOME_RECOMENDACAO[foco.rec]) : '';

  // Ao clicar num cartão, o painel aparece e leva-se o ecrã até ele.
  useEffect(() => {
    if (foco) painel.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [foco]);

  const alternarFoco = (f: Foco) =>
    setFoco((atual) => (atual && JSON.stringify(atual) === JSON.stringify(f) ? null : f));
  const ativo = (f: Foco) => !!foco && JSON.stringify(foco) === JSON.stringify(f);

  const verEmTodos = (rec: Recomendacao) => {
    setFiltroRec(rec);
    setPesquisa('');
    setTab('todos');
  };

  const cartoes: Array<{ cartao: Cartao; titulo: string; valor: string; sub: string }> = r
    ? [
        { cartao: 'mensagens', titulo: 'Mensagens em quarentena', valor: String(r.mensagens), sub: `${dataCurta(r.primeira)} a ${dataCurta(r.ultima)}` },
        { cartao: 'dominios', titulo: 'Domínios de remetentes', valor: String(r.dominiosOrigem), sub: `${r.remetentes} endereços diferentes` },
        { cartao: 'antiSpam', titulo: 'Apanhadas pelo anti-spam', valor: pct(r.antiSpam, r.mensagens), sub: `${r.antiSpam} mensagens` },
        { cartao: 'dmarcFail', titulo: 'DMARC falhado', valor: pct(r.dmarcFail, r.mensagens), sub: `${r.dmarcFail} falharam · ${r.dmarcPass} passaram · ${r.dmarcOutro} sem verificação` },
      ]
    : [];

  /** Tabela de domínios com a escolha para o e-mail e o detalhe ao clicar. */
  const tabelaDominios = (lista: DominioSoc[], limite = 300) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10" />
          <TableHead>Domínio</TableHead>
          <TableHead>Classe</TableHead>
          <TableHead className="text-right">Msgs</TableHead>
          <TableHead className="text-right">DMARC fail</TableHead>
          <TableHead className="text-right">Spam</TableHead>
          <TableHead>Recomendação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lista.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
              Nenhum domínio.
            </TableCell>
          </TableRow>
        )}
        {lista.slice(0, limite).map((d) => (
          <TableRow key={d.dominio}>
            <TableCell>
              {podeIrNoPedido(d) && (
                <Checkbox
                  checked={escolhidos.has(d.dominio)}
                  onCheckedChange={() => alternar(d.dominio)}
                  aria-label={`Incluir ${d.dominio} no e-mail`}
                />
              )}
            </TableCell>
            <TableCell>
              <button type="button" onClick={() => setDetalhe(d)} className="font-mono text-sm text-primary underline-offset-2 hover:underline" title="Ver o detalhe deste domínio">
                {d.dominio}
              </button>
            </TableCell>
            <TableCell className="text-sm">{NOME_CLASSE[d.classe]}</TableCell>
            <TableCell className="text-right tabular-nums">{d.mensagens}</TableCell>
            <TableCell className="text-right tabular-nums">{d.dmarcFail}</TableCell>
            <TableCell className="text-right tabular-nums">{d.antiSpam}</TableCell>
            <TableCell>
              <Selo rec={d.recomendacao} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <PageContainer size="wide">
      <PageHeader
        title="Relatório SOC"
        subtitle="Descobre que remetentes legítimos de Cabo Verde e Portugal o Cisco ESA está a bloquear, e prepara o pedido de libertação"
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Lock className="h-4 w-4" /> O ficheiro é lido no teu browser e não é enviado para o servidor.
            </div>
            Escolhe o relatório do SOC (Excel, folha «cisco - esa»). {ficheiro && <strong className="text-foreground">Aberto: {ficheiro}</strong>}
          </div>
          <div>
            <input
              ref={entrada}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void abrir(f);
                e.target.value = '';
              }}
            />
            <Button onClick={() => entrada.current?.click()} className="gap-1.5">
              <FileSpreadsheet className="h-4 w-4" />
              {resultado ? 'Abrir outro relatório' : 'Escolher o relatório'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {erro && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      {resultado && r && (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="candidatos">Domínios CV/PT ({candidatos.length})</TabsTrigger>
            <TabsTrigger value="todos">Todos os domínios ({dominios.length})</TabsTrigger>
            <TabsTrigger value="email">E-mail ({selecionados.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-4">
            <p className="text-xs text-muted-foreground">Clica num cartão ou numa recomendação para ver os domínios por trás do número.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {cartoes.map((c) => {
                const f: Foco = { tipo: 'cartao', cartao: c.cartao };
                return (
                  <button
                    key={c.cartao}
                    type="button"
                    aria-pressed={ativo(f)}
                    onClick={() => alternarFoco(f)}
                    className={`rounded-lg border bg-card text-left shadow-sm transition-colors hover:border-primary/60 hover:bg-muted/40 ${ativo(f) ? 'border-primary ring-2 ring-primary/40' : ''}`}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                        {c.titulo}
                        <ChevronRight className={`h-4 w-4 transition-transform ${ativo(f) ? 'rotate-90' : ''}`} />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-semibold tabular-nums">{c.valor}</div>
                      <p className="text-xs text-muted-foreground">{c.sub}</p>
                    </CardContent>
                  </button>
                );
              })}
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">O que fazer com cada domínio</CardTitle>
                <CardDescription>
                  O anti-vírus detetou {r.antiVirus} mensagem(ns). {r.semRemetente > 0 && `${r.semRemetente} mensagens não têm remetente identificável (não entram na lista).`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {RECOMENDACOES.map((rec) => {
                  const f: Foco = { tipo: 'rec', rec };
                  const n = contarPor(dominios, rec);
                  return (
                    <button
                      key={rec}
                      type="button"
                      disabled={n === 0}
                      aria-pressed={ativo(f)}
                      className={`rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50 ${ativo(f) ? 'border-primary bg-muted ring-2 ring-primary/40' : ''}`}
                      onClick={() => alternarFoco(f)}
                      title="Ver estes domínios aqui em baixo"
                    >
                      <Selo rec={rec} /> <span className="ml-1 font-semibold tabular-nums">{n}</span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {foco && (
              <div ref={painel}>
                <Card className="border-primary/40">
                  <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                    <div>
                      <CardTitle className="text-base">
                        {tituloFoco} <span className="font-normal text-muted-foreground">({doFoco.length})</span>
                      </CardTitle>
                      <CardDescription>
                        Clica no domínio para ver o detalhe. As caixas escolhem o que vai no e-mail.
                        {foco.tipo === 'rec' && ' '}
                        {foco.tipo === 'rec' && (
                          <button type="button" className="underline-offset-2 hover:underline text-primary" onClick={() => verEmTodos(foco.rec)}>
                            Ver em «Todos os domínios»
                          </button>
                        )}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Fechar o painel" onClick={() => setFoco(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[28rem] overflow-y-auto">{tabelaDominios(doFoco)}</div>
                    {doFoco.length > 300 && <p className="p-3 text-xs text-muted-foreground">A mostrar os 300 primeiros.</p>}
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quem mais é bloqueado</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domínio</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead className="text-right">Mensagens</TableHead>
                      <TableHead>Recomendação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dominios.slice(0, 10).map((d) => (
                      <TableRow key={d.dominio} className="cursor-pointer" onClick={() => setDetalhe(d)}>
                        <TableCell className="font-mono text-sm">{d.dominio}</TableCell>
                        <TableCell className="text-sm">{NOME_CLASSE[d.classe]}</TableCell>
                        <TableCell className="text-right tabular-nums">{d.mensagens}</TableCell>
                        <TableCell>
                          <Selo rec={d.recomendacao} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="candidatos" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Os domínios de Cabo Verde e Portugal vêm <strong>todos escolhidos</strong> para o e-mail (menos os que nunca se libertam: com vírus ou parecidos com o
              banco). Quem decide pode tirar os que não quiser. Os que falham o DMARC vão à parte no e-mail, a pedir que se confirme o remetente antes de libertar.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {elegiveis.filter((d) => escolhidos.has(d.dominio)).length} de {elegiveis.length} no e-mail
              </Badge>
              <Button variant="outline" size="sm" onClick={() => definirEscolhidos(new Set(elegiveis.map((d) => d.dominio)))}>
                Escolher todos
              </Button>
              <Button variant="outline" size="sm" onClick={() => definirEscolhidos(new Set(elegiveis.filter((d) => d.dmarcFail === 0).map((d) => d.dominio)))}>
                Só os sem falhas de DMARC
              </Button>
              <Button variant="outline" size="sm" onClick={() => definirEscolhidos(new Set())}>
                Tirar todos
              </Button>
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Domínio</TableHead>
                    <TableHead className="text-right">Msgs</TableHead>
                    <TableHead className="text-right">DMARC fail</TableHead>
                    <TableHead className="text-right">Spam</TableHead>
                    <TableHead>Recomendação</TableHead>
                    <TableHead>Porquê</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidatos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                        Nenhum remetente de Cabo Verde ou Portugal neste relatório.
                      </TableCell>
                    </TableRow>
                  )}
                  {candidatos.map((d) => (
                    <TableRow key={d.dominio}>
                      <TableCell>
                        <Checkbox
                          checked={escolhidos.has(d.dominio)}
                          onCheckedChange={() => alternar(d.dominio)}
                          aria-label={`Incluir ${d.dominio} no pedido`}
                          disabled={d.recomendacao === 'nao-libertar'}
                        />
                      </TableCell>
                      <TableCell>
                        <button type="button" onClick={() => setDetalhe(d)} className="font-mono text-sm text-primary underline-offset-2 hover:underline">
                          {d.dominio}
                        </button>
                        <div className="text-[11px] text-muted-foreground">{NOME_CLASSE[d.classe]} · {dataCurta(d.primeira)}–{dataCurta(d.ultima)}</div>
                        {d.assuntos.length > 0 && <div className="text-[11px] text-muted-foreground">ex.: {d.assuntos.join(' · ')}</div>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{d.mensagens}</TableCell>
                      <TableCell className="text-right tabular-nums">{d.dmarcFail}</TableCell>
                      <TableCell className="text-right tabular-nums">{d.antiSpam}</TableCell>
                      <TableCell>
                        <Selo rec={d.recomendacao} />
                      </TableCell>
                      <TableCell className="max-w-sm text-xs text-muted-foreground">{d.motivo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="todos" className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-56">
                <Select value={filtroRec} onValueChange={setFiltroRec}>
                  <SelectTrigger aria-label="Filtrar por recomendação">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODAS}>Todas as recomendações</SelectItem>
                    {(Object.keys(NOME_RECOMENDACAO) as Recomendacao[]).map((rec) => (
                      <SelectItem key={rec} value={rec}>
                        {NOME_RECOMENDACAO[rec]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input className="w-64" placeholder="Pesquisar domínio…" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
              <Button variant="outline" className="ml-auto gap-1.5" onClick={() => descarregar('SOC_dominios.csv', paraCsv(todos), 'text/csv;charset=utf-8')}>
                <FileDown className="h-4 w-4" />
                Descarregar CSV ({todos.length})
              </Button>
            </div>
            <div className="rounded-lg border">{tabelaDominios(todos)}</div>
            {todos.length > 300 && <p className="text-xs text-muted-foreground">A mostrar os 300 primeiros; o CSV leva todos.</p>}
          </TabsContent>

          <TabsContent value="email" className="space-y-3">
            {selecionados.length === 0 ? (
              <Alert>
                <AlertDescription>Não há domínios escolhidos. Escolhe-os em «Domínios CV/PT».</AlertDescription>
              </Alert>
            ) : (
              <>
                <Textarea rows={16} value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Texto do e-mail" className="font-mono text-sm" />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => copiar(email, 'E-mail')} className="gap-1.5">
                    <ClipboardCopy className="h-4 w-4" />
                    Copiar e-mail
                  </Button>
                  <Button variant="outline" onClick={() => copiar(listaParaEsa(selecionados), 'Lista de domínios')} className="gap-1.5">
                    <ClipboardCopy className="h-4 w-4" />
                    Copiar só os domínios (1 por linha)
                  </Button>
                  <Button variant="outline" onClick={() => gerarEmail(escolhidos, ficheiro)}>
                    Refazer o texto
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={!!detalhe} onOpenChange={(open) => { if (!open) setDetalhe(null); }}>
        <DialogContent className="max-w-lg">
          {detalhe && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono text-base">{detalhe.dominio}</DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2">
                  {NOME_CLASSE[detalhe.classe]} <Selo rec={detalhe.recomendacao} />
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm">{detalhe.motivo}</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {[
                  ['Mensagens', detalhe.mensagens],
                  ['Endereços diferentes', detalhe.remetentes],
                  ['DMARC falhou', detalhe.dmarcFail],
                  ['DMARC passou', detalhe.dmarcPass],
                  ['Sem verificação DMARC', detalhe.dmarcOutro],
                  ['Anti-spam', detalhe.antiSpam],
                  ['Anti-vírus', detalhe.antiVirus],
                  ['Período', `${dataCurta(detalhe.primeira)} – ${dataCurta(detalhe.ultima)}`],
                ].map(([k, v]) => (
                  <React.Fragment key={String(k)}>
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="tabular-nums">{v}</dd>
                  </React.Fragment>
                ))}
              </dl>
              {detalhe.parecidoCom && <p className="text-sm text-destructive">Parece-se com o domínio do banco ({detalhe.parecidoCom}).</p>}
              {detalhe.assuntos.length > 0 && (
                <div className="text-sm">
                  <div className="text-muted-foreground">Assuntos de exemplo</div>
                  <ul className="list-disc pl-5">
                    {detalhe.assuntos.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                {podeIrNoPedido(detalhe) ? (
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox checked={escolhidos.has(detalhe.dominio)} onCheckedChange={() => alternar(detalhe.dominio)} />
                    Incluir no e-mail
                  </label>
                ) : (
                  <span className="text-xs text-muted-foreground">Este domínio não vai no pedido de libertação.</span>
                )}
                <Button variant="outline" size="sm" onClick={() => copiar(detalhe.dominio, 'Domínio')} className="gap-1.5">
                  <ClipboardCopy className="h-4 w-4" />
                  Copiar domínio
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
