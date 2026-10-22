import React, { useMemo, useRef, useState } from 'react';
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
import { ClipboardCopy, FileDown, FileSpreadsheet, Lock } from 'lucide-react';
import { toast } from 'sonner';
import {
  NOME_CLASSE,
  NOME_RECOMENDACAO,
  analisarSoc,
  contarPor,
  listaParaEsa,
  paraCsv,
  textoEmail,
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
const dataCurta = (d: Date | null) => (d ? d.toLocaleDateString('pt-PT') : '—');
const pct = (n: number, total: number) => (total === 0 ? '0%' : `${Math.round((n / total) * 100)}%`);

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

export default function Soc() {
  const entrada = useRef<HTMLInputElement>(null);
  const [ficheiro, setFicheiro] = useState('');
  const [resultado, setResultado] = useState<ResultadoSoc | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [escolhidos, setEscolhidos] = useState<Set<string>>(new Set());
  const [filtroRec, setFiltroRec] = useState<string>(TODAS);
  const [pesquisa, setPesquisa] = useState('');
  const [email, setEmail] = useState('');

  const dominios = resultado?.dominios ?? [];
  const candidatos = useMemo(
    () => dominios.filter((d) => d.classe === 'cv' || d.classe === 'pt' || d.recomendacao === 'whitelist' || d.recomendacao === 'verificar-remetente'),
    [dominios],
  );

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
    const marcados = new Set(r.dominios.filter((d) => d.recomendacao === 'whitelist').map((d) => d.dominio));
    setFicheiro(f.name);
    setResultado(r);
    setEscolhidos(marcados);
    setFiltroRec(TODAS);
    setPesquisa('');
    setEmail(textoEmail(r.dominios.filter((d) => marcados.has(d.dominio)), { ficheiro: f.name }));
    toast.success(`${leitura.linhas.length} mensagens lidas (folha "${leitura.folha}").`);
  };

  const alternar = (dominio: string) => {
    const n = new Set(escolhidos);
    if (n.has(dominio)) n.delete(dominio);
    else n.add(dominio);
    setEscolhidos(n);
    gerarEmail(n, ficheiro);
  };

  const todos = useMemo(() => {
    const t = pesquisa.trim().toLowerCase();
    return dominios.filter((d) => (filtroRec === TODAS || d.recomendacao === filtroRec) && (!t || d.dominio.includes(t)));
  }, [dominios, filtroRec, pesquisa]);

  const r = resultado?.resumo;
  const selecionados = dominios.filter((d) => escolhidos.has(d.dominio));

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
        <Tabs defaultValue="resumo">
          <TabsList className="mb-4">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="candidatos">Candidatos CV/PT ({candidatos.length})</TabsTrigger>
            <TabsTrigger value="todos">Todos os domínios ({dominios.length})</TabsTrigger>
            <TabsTrigger value="email">E-mail ({selecionados.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Mensagens em quarentena', String(r.mensagens), `${dataCurta(r.primeira)} a ${dataCurta(r.ultima)}`],
                ['Domínios de remetentes', String(r.dominiosOrigem), `${r.remetentes} endereços diferentes`],
                ['Apanhadas pelo anti-spam', pct(r.antiSpam, r.mensagens), `${r.antiSpam} mensagens`],
                ['DMARC falhado', pct(r.dmarcFail, r.mensagens), `${r.dmarcFail} falharam · ${r.dmarcPass} passaram · ${r.dmarcOutro} sem verificação`],
              ].map(([t, v, s]) => (
                <Card key={t}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold tabular-nums">{v}</div>
                    <p className="text-xs text-muted-foreground">{s}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">O que fazer com cada domínio</CardTitle>
                <CardDescription>
                  O anti-vírus detetou {r.antiVirus} mensagem(ns). {r.semRemetente > 0 && `${r.semRemetente} mensagens não têm remetente identificável (não entram na lista).`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {(['whitelist', 'verificar-remetente', 'nao-libertar', 'verificar', 'manter'] as Recomendacao[]).map((rec) => (
                  <button
                    key={rec}
                    type="button"
                    className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                    onClick={() => setFiltroRec(rec)}
                    title="Ver estes domínios em «Todos os domínios»"
                  >
                    <Selo rec={rec} /> <span className="ml-1 font-semibold tabular-nums">{contarPor(dominios, rec)}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

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
                      <TableRow key={d.dominio}>
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
              Marca os que queres incluir no pedido. Só os que o anti-spam apanhou <strong>sem</strong> falhas de DMARC vêm marcados:
              se o DMARC falha, o remetente pode ser uma falsificação e não convém libertá-lo sem falar com ele.
            </p>
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
                        <div className="font-mono text-sm">{d.dominio}</div>
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
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domínio</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead className="text-right">Msgs</TableHead>
                    <TableHead className="text-right">Remet.</TableHead>
                    <TableHead className="text-right">DMARC fail</TableHead>
                    <TableHead>Recomendação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todos.slice(0, 300).map((d: DominioSoc) => (
                    <TableRow key={d.dominio}>
                      <TableCell className="font-mono text-sm">{d.dominio}</TableCell>
                      <TableCell className="text-sm">{NOME_CLASSE[d.classe]}</TableCell>
                      <TableCell className="text-right tabular-nums">{d.mensagens}</TableCell>
                      <TableCell className="text-right tabular-nums">{d.remetentes}</TableCell>
                      <TableCell className="text-right tabular-nums">{d.dmarcFail}</TableCell>
                      <TableCell>
                        <Selo rec={d.recomendacao} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {todos.length > 300 && <p className="text-xs text-muted-foreground">A mostrar os 300 primeiros; o CSV leva todos.</p>}
          </TabsContent>

          <TabsContent value="email" className="space-y-3">
            {selecionados.length === 0 ? (
              <Alert>
                <AlertDescription>Não há domínios escolhidos. Marca-os em «Candidatos CV/PT».</AlertDescription>
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
    </PageContainer>
  );
}
