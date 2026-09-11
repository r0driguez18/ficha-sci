import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Upload,
  ClipboardPaste,
  FileDown,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LIMITE_LOTE,
  autodetectarColunas,
  extrairLinhas,
  construirPrn,
  nomeBaseRenovacao,
  nomeFicheiroExcelLote,
  type LinhaBrutaCartao,
  type LinhaInvalida,
} from '@/lib/renovacaoCartoes';
import {
  listarSessoesEmCurso,
  listarSessoesConcluidas,
  criarSessaoRenovacao,
  inserirCartoes,
  contarPendentesPorBalcao,
  totaisSessao,
  listarLotes,
  linhasDoLote,
  criarLoteRenovacao,
  concluirSessaoRenovacao,
  descartarSessaoRenovacao,
  reabrirSessaoRenovacao,
  type CardRenewalSession,
  type CardRenewalLote,
  type BalcaoPendente,
} from '@/services/cardRenewalService';

const CABECALHOS_COLAGEM = ['Balcão', 'Nº de Cartão', 'Nome'];

function parseColagemCartoes(txt: string): string[][] {
  return txt
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== '')
    .map((l) => {
      const sep = l.includes('\t') ? '\t' : l.includes(';') ? ';' : ',';
      return l.split(sep).map((x) => x.trim());
    });
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function descarregarBlob(blob: Blob, nomeFicheiro: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeFicheiro;
  a.click();
  URL.revokeObjectURL(url);
}

function descarregarPrn(numeros: string[], nomeFicheiro: string) {
  descarregarBlob(new Blob([construirPrn(numeros)], { type: 'text/plain;charset=utf-8' }), nomeFicheiro);
}

/** A folha "Resultado" do processo manual: a linha completa de cada cartão do lote. */
function descarregarExcel(linhas: Record<string, string>[], nomeFicheiro: string) {
  if (linhas.length === 0) return;
  const cabecalhos = Object.keys(linhas[0]);
  const ws = XLSX.utils.json_to_sheet(linhas, { header: cabecalhos });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Resultado');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  descarregarBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    nomeFicheiro,
  );
}

/**
 * Descarrega o .prn e o .xlsx de um lote. Com um pequeno intervalo entre os
 * dois — disparar dois downloads no mesmo instante leva o Chrome a bloquear
 * o segundo (só avisa com um ícone discreto na barra de endereço).
 */
async function descarregarFicheirosDoLote(
  linhas: { numeroCartao: string; dados: Record<string, string> }[],
  nomeBase: string,
  numero: number,
) {
  try {
    descarregarPrn(linhas.map((l) => l.numeroCartao), `${nomeBase} ${numero}.prn`);
    await esperar(400);
    descarregarExcel(linhas.map((l) => l.dados), nomeFicheiroExcelLote(nomeBase, numero));
  } catch (e) {
    console.error(e);
    toast.error(
      'Não foi possível montar um dos ficheiros. Se o download do .xlsx não apareceu, verifica se o browser bloqueou downloads múltiplos (ícone na barra de endereço).',
    );
  }
}

export default function RenovacaoCartoes() {
  const [carregando, setCarregando] = useState(true);
  const [sessoes, setSessoes] = useState<CardRenewalSession[]>([]);
  const [sessoesConcluidas, setSessoesConcluidas] = useState<CardRenewalSession[]>([]);
  const [sessaoAtiva, setSessaoAtiva] = useState<CardRenewalSession | null>(null);
  const [mostrarUpload, setMostrarUpload] = useState(false);
  const [aReabrir, setAReabrir] = useState<string | null>(null);

  const [pendentes, setPendentes] = useState<BalcaoPendente[]>([]);
  const [lotes, setLotes] = useState<CardRenewalLote[]>([]);
  const [totais, setTotais] = useState({ total: 0, pendentes: 0 });
  const [aRefrescar, setARefrescar] = useState(false);

  const [balcoesSelecionados, setBalcoesSelecionados] = useState<Set<string>>(new Set());
  const [gerandoLote, setGerandoLote] = useState(false);
  const [aConcluir, setAConcluir] = useState(false);
  const [aDescartar, setADescartar] = useState(false);
  const [confirmarNovaSessao, setConfirmarNovaSessao] = useState(false);
  const [confirmarConcluir, setConfirmarConcluir] = useState(false);
  const [sessaoADescartar, setSessaoADescartar] = useState<CardRenewalSession | null>(null);

  // -- upload de um novo ficheiro --
  const [modo, setModo] = useState<'colar' | 'ficheiro'>('ficheiro');
  const [colagem, setColagem] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [sheetRows, setSheetRows] = useState<string[][]>([]);
  const [nColunas, setNColunas] = useState(0);
  const [colBalcao, setColBalcao] = useState(0);
  const [colCartao, setColCartao] = useState(1);
  const [colNome, setColNome] = useState(-1);
  const [linhaInicial, setLinhaInicial] = useState(1);
  const [iniciando, setIniciando] = useState(false);

  const carregarSessaoAtual = useCallback(async (sessao: CardRenewalSession) => {
    setARefrescar(true);
    const [pendRes, lotesRes, totRes] = await Promise.all([
      contarPendentesPorBalcao(sessao.id),
      listarLotes(sessao.id),
      totaisSessao(sessao.id),
    ]);
    setARefrescar(false);
    if (pendRes.error || lotesRes.error || totRes.error) {
      toast.error('Não foi possível carregar os dados da sessão.');
      return;
    }
    setPendentes(pendRes.data ?? []);
    setLotes(lotesRes.data ?? []);
    setTotais({ total: totRes.total, pendentes: totRes.pendentes });
  }, []);

  const selecionarSessao = useCallback(
    async (sessao: CardRenewalSession) => {
      setSessaoAtiva(sessao);
      setMostrarUpload(false);
      setBalcoesSelecionados(new Set());
      await carregarSessaoAtual(sessao);
    },
    [carregarSessaoAtual],
  );

  const carregarSessoes = useCallback(async () => {
    setCarregando(true);
    const [{ data, error }, { data: concluidas }] = await Promise.all([
      listarSessoesEmCurso(),
      listarSessoesConcluidas(),
    ]);
    setCarregando(false);
    setSessoesConcluidas(concluidas ?? []);
    if (error) {
      toast.error('Não foi possível carregar as sessões de renovação.');
      return;
    }
    const lista = data ?? [];
    setSessoes(lista);
    if (lista.length === 0) {
      setSessaoAtiva(null);
      setMostrarUpload(true);
    } else if (lista.length === 1) {
      await selecionarSessao(lista[0]);
    }
  }, [selecionarSessao]);

  const reabrirSessao = async (sessao: CardRenewalSession) => {
    setAReabrir(sessao.id);
    const { error } = await reabrirSessaoRenovacao(sessao.id);
    setAReabrir(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`"${sessao.nome}" reaberta.`);
    await carregarSessoes();
  };

  useEffect(() => {
    carregarSessoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetUpload = () => {
    setColagem('');
    setSheetRows([]);
    setNColunas(0);
    setColBalcao(0);
    setColCartao(1);
    setColNome(-1);
    setLinhaInicial(1);
  };

  const carregarFicheiro = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, blankrows: false, defval: '' });
      const norm = rows.map((r) => (Array.isArray(r) ? r.map((c) => (c ?? '').toString()) : []));
      setSheetRows(norm);
      setNColunas(norm.reduce((m, r) => Math.max(m, r.length), 0));
      const det = autodetectarColunas(norm);
      setColBalcao(det.colBalcao);
      setColCartao(det.colCartao);
      setColNome(det.colNome);
      setLinhaInicial(det.linhaInicial);
      toast.success(`${norm.length} linha(s) lidas — colunas detetadas.`);
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível ler o ficheiro.');
    }
  };

  const rowsAtuais = useMemo(
    () => (modo === 'colar' ? parseColagemCartoes(colagem) : sheetRows),
    [modo, colagem, sheetRows],
  );
  const colBalcaoEff = modo === 'colar' ? 0 : colBalcao;
  const colCartaoEff = modo === 'colar' ? 1 : colCartao;
  const colNomeEff = modo === 'colar' ? 2 : colNome;
  const linhaInicialEff = modo === 'colar' ? 1 : linhaInicial;
  const headerRow = sheetRows[Math.max(0, linhaInicial - 2)] ?? [];
  const headersEff = modo === 'colar' ? CABECALHOS_COLAGEM : headerRow.map((h) => String(h ?? ''));

  const { validas, invalidas }: { validas: LinhaBrutaCartao[]; invalidas: LinhaInvalida[] } = useMemo(
    () => extrairLinhas(rowsAtuais, colBalcaoEff, colCartaoEff, colNomeEff, linhaInicialEff, headersEff),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rowsAtuais, colBalcaoEff, colCartaoEff, colNomeEff, linhaInicialEff],
  );

  const balcoesNoFicheiro = useMemo(() => {
    const s = new Set(validas.map((v) => v.balcao));
    return s.size;
  }, [validas]);

  const colOpts = Array.from({ length: Math.max(nColunas, 2) }, (_, i) => i);
  const nomeCol = (i: number) => {
    const h = String(headerRow[i] ?? '').trim();
    return h ? `${XLSX.utils.encode_col(i)} — ${h.slice(0, 22)}` : XLSX.utils.encode_col(i);
  };

  const iniciarSessao = async () => {
    if (validas.length === 0) {
      toast.error('Não há nenhuma linha válida para iniciar a sessão.');
      return;
    }
    setIniciando(true);
    const nome = nomeBaseRenovacao();
    const { data: sessao, error: errSessao } = await criarSessaoRenovacao(nome);
    if (errSessao || !sessao) {
      setIniciando(false);
      toast.error('Não foi possível criar a sessão.');
      return;
    }
    const { inseridos, error: errCartoes } = await inserirCartoes(sessao.id, validas);
    setIniciando(false);
    if (errCartoes) {
      toast.error(
        'Sessão criada, mas falhou a carregar alguns cartões. Recarrega a página — os já guardados não se perdem.',
      );
    } else {
      toast.success(`${inseridos} cartão(ões) carregados em "${nome}".`);
    }
    resetUpload();
    await carregarSessoes();
    await selecionarSessao(sessao);
  };

  const toggleBalcao = (balcao: string) =>
    setBalcoesSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(balcao)) next.delete(balcao);
      else next.add(balcao);
      return next;
    });

  const totalSelecionado = pendentes
    .filter((p) => balcoesSelecionados.has(p.balcao))
    .reduce((s, p) => s + p.pendentes, 0);

  const gerarLote = async () => {
    if (!sessaoAtiva || balcoesSelecionados.size === 0 || gerandoLote) return;
    setGerandoLote(true);
    const { data, error } = await criarLoteRenovacao(
      sessaoAtiva.id,
      Array.from(balcoesSelecionados),
      sessaoAtiva.nome,
      LIMITE_LOTE,
    );
    if (error || !data || data.length === 0) {
      setGerandoLote(false);
      toast.error(error?.message ?? 'Não foi possível gerar o lote.');
      return;
    }
    const loteNumero = data[0].loteNumero;
    const { data: linhas, error: errLinhas } = await linhasDoLote(sessaoAtiva.id, loteNumero);
    setGerandoLote(false);
    if (errLinhas || !linhas) {
      toast.error('Lote gerado, mas não foi possível montar os ficheiros — usa "Descarregar" na lista de lotes.');
    } else {
      await descarregarFicheirosDoLote(linhas, sessaoAtiva.nome, loteNumero);
    }
    toast.success(`Lote ${loteNumero} gerado — ${data.length} cartão(ões).`);
    setBalcoesSelecionados(new Set());
    await carregarSessaoAtual(sessaoAtiva);
  };

  const redescarregarLote = async (lote: CardRenewalLote) => {
    if (!sessaoAtiva) return;
    const { data: linhas, error } = await linhasDoLote(sessaoAtiva.id, lote.numero);
    if (error || !linhas) {
      toast.error('Não foi possível obter os cartões deste lote.');
      return;
    }
    await descarregarFicheirosDoLote(linhas, sessaoAtiva.nome, lote.numero);
  };

  const concluirSessao = async () => {
    if (!sessaoAtiva) return;
    setAConcluir(true);
    const { error } = await concluirSessaoRenovacao(sessaoAtiva.id);
    setAConcluir(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Sessão concluída.');
    await carregarSessoes();
  };

  const descartarSessao = async () => {
    if (!sessaoADescartar) return;
    setADescartar(true);
    const { error } = await descartarSessaoRenovacao(sessaoADescartar.id);
    setADescartar(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Sessão descartada.');
    setSessaoADescartar(null);
    if (sessaoAtiva?.id === sessaoADescartar.id) setSessaoAtiva(null);
    await carregarSessoes();
  };

  if (carregando) {
    return (
      <PageContainer size="default">
        <LoadingState label="A carregar…" />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="default">
      <PageHeader
        title="Renovação de Cartões"
        subtitle="Divide o export do banco em lotes de até 490 cartões, por balcão"
      />

      {/* Escolher entre várias sessões em curso */}
      {sessoes.length > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Há mais que uma sessão em curso</CardTitle>
            <CardDescription>Escolhe qual continuar.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {sessoes.map((s) => (
              <div key={s.id} className="flex items-center gap-1">
                <Button
                  variant={sessaoAtiva?.id === s.id ? 'default' : 'outline'}
                  onClick={() => selecionarSessao(s)}
                >
                  {s.nome}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  title="Descartar esta sessão"
                  onClick={() => setSessaoADescartar(s)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {sessoesConcluidas.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Sessões terminadas</CardTitle>
            <CardDescription>Os dados ficam guardados — reabre para continuar.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {sessoesConcluidas.map((s) => (
              <Button
                key={s.id}
                variant="outline"
                size="sm"
                disabled={aReabrir === s.id}
                onClick={() => reabrirSessao(s)}
              >
                {aReabrir === s.id ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-1" />
                )}
                {s.nome}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {sessaoAtiva && !mostrarUpload && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">{sessaoAtiva.nome}</CardTitle>
                <CardDescription>Sessão em curso</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{totais.total} no total</Badge>
                <Badge variant={totais.pendentes > 0 ? 'destructive' : 'outline'}>
                  {totais.pendentes} pendente(s)
                </Badge>
                <Badge variant="outline">{totais.total - totais.pendentes} atribuído(s)</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmarNovaSessao(true)}>
                <Plus className="h-4 w-4 mr-1" /> Nova sessão
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={aConcluir}
                onClick={() => setConfirmarConcluir(true)}
              >
                {aConcluir ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Terminar sessão
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                disabled={aDescartar}
                onClick={() => setSessaoADescartar(sessaoAtiva)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Descartar sessão
              </Button>
            </CardContent>
          </Card>

          {lotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lotes gerados</CardTitle>
                <CardDescription>Cada um pode ser descarregado de novo, se precisares.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lotes.map((l) => (
                    <div
                      key={l.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Lote {l.numero}</Badge>
                        <span className="text-muted-foreground">
                          {l.total_cartoes} cartão(ões) · balcões {l.balcoes.join(', ')}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => redescarregarLote(l)}>
                        <FileDown className="h-4 w-4 mr-1" /> {l.ficheiro_nome}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {totais.pendentes > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Criar novo lote</CardTitle>
                <CardDescription>
                  Escolhe os balcões a incluir — no máximo {LIMITE_LOTE} cartões por lote; se a
                  seleção tiver mais, o resto fica pendente para o lote seguinte.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {pendentes.map((p) => (
                    <label
                      key={p.balcao}
                      className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={balcoesSelecionados.has(p.balcao)}
                        onCheckedChange={() => toggleBalcao(p.balcao)}
                      />
                      <span className="font-medium">Balcão {p.balcao}</span>
                      <span className="ml-auto text-muted-foreground tabular-nums">{p.pendentes}</span>
                    </label>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={totalSelecionado > LIMITE_LOTE ? 'destructive' : 'secondary'}>
                    {totalSelecionado} selecionado(s)
                  </Badge>
                  {totalSelecionado > LIMITE_LOTE && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Só entram {LIMITE_LOTE} neste lote — os restantes{' '}
                      {totalSelecionado - LIMITE_LOTE} ficam para o próximo.
                    </span>
                  )}
                  <Button
                    className="ml-auto"
                    disabled={balcoesSelecionados.size === 0 || gerandoLote || aRefrescar}
                    onClick={gerarLote}
                  >
                    {gerandoLote ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4 mr-1" />
                    )}
                    Gerar lote
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-success/40">
              <CardContent className="flex items-center gap-2 py-4 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" /> Não há mais cartões pendentes nesta sessão.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {mostrarUpload && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {sessoes.length > 0 ? 'Nova sessão de renovação' : 'Carregar o ficheiro do banco'}
            </CardTitle>
            <CardDescription>
              Cola a folha ou carrega o export (Balcão e Nº de Cartão são detetados automaticamente).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessoes.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setMostrarUpload(false)}>
                <RotateCcw className="h-4 w-4 mr-1" /> Cancelar
              </Button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) carregarFicheiro(f);
              }}
            />

            <div className="flex gap-2">
              <Button size="sm" variant={modo === 'colar' ? 'default' : 'outline'} onClick={() => setModo('colar')}>
                <ClipboardPaste className="h-4 w-4 mr-1" /> Colar
              </Button>
              <Button
                size="sm"
                variant={modo === 'ficheiro' ? 'default' : 'outline'}
                onClick={() => {
                  setModo('ficheiro');
                  fileRef.current?.click();
                }}
              >
                <Upload className="h-4 w-4 mr-1" /> Carregar ficheiro (.xls / .xlsx / .csv)
              </Button>
            </div>

            {modo === 'colar' ? (
              <Textarea
                value={colagem}
                onChange={(e) => setColagem(e.target.value)}
                placeholder={'balcão [tab] nº cartão [tab] nome\n36\t752923\tMARLENE LUZ FORTES'}
                className="min-h-[150px] font-mono text-xs"
              />
            ) : (
              <div className="space-y-4">
                {sheetRows.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(
                      [
                        ['Balcão', colBalcao, setColBalcao] as const,
                        ['Nº de Cartão', colCartao, setColCartao] as const,
                      ] as const
                    ).map(([label, val, set]) => (
                      <div key={label} className="space-y-1">
                        <Label className="text-xs">Coluna do {label}</Label>
                        <select
                          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                          value={val}
                          onChange={(e) => set(Number(e.target.value))}
                        >
                          {colOpts.map((i) => (
                            <option key={i} value={i}>
                              {nomeCol(i)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                    <div className="space-y-1">
                      <Label className="text-xs">Dados começam na linha</Label>
                      <input
                        type="number"
                        min={1}
                        value={linhaInicial}
                        onChange={(e) => setLinhaInicial(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {rowsAtuais.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="secondary">{validas.length} válido(s)</Badge>
                  <Badge variant="outline">{balcoesNoFicheiro} balcão(ões)</Badge>
                  {invalidas.length > 0 && (
                    <Badge variant="destructive">{invalidas.length} linha(s) inválida(s)</Badge>
                  )}
                </div>
                {invalidas.length > 0 && (
                  <div className="max-h-32 overflow-y-auto rounded-md border bg-destructive/5 p-2 text-xs text-muted-foreground">
                    {invalidas.slice(0, 30).map((inv, i) => (
                      <div key={i}>
                        Linha {inv.linha}: {inv.motivo}
                      </div>
                    ))}
                    {invalidas.length > 30 && <div>… e mais {invalidas.length - 30}.</div>}
                  </div>
                )}
              </div>
            )}

            <Button onClick={iniciarSessao} disabled={validas.length === 0 || iniciando}>
              {iniciando ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Iniciar sessão de renovação
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmarNovaSessao}
        onOpenChange={setConfirmarNovaSessao}
        title="Iniciar uma nova sessão?"
        description="A sessão atual continua guardada e pode ser escolhida mais tarde — nada se perde. Isto só começa uma sessão adicional, a partir de um novo ficheiro."
        confirmLabel="Nova sessão"
        cancelLabel="Cancelar"
        onConfirm={() => {
          setMostrarUpload(true);
          resetUpload();
        }}
      />

      <ConfirmDialog
        open={confirmarConcluir}
        onOpenChange={setConfirmarConcluir}
        title="Terminar esta sessão?"
        description={
          totais.pendentes > 0
            ? `Ainda há ${totais.pendentes} cartão(ões) pendente(s) — ficam guardados, nada se perde. A sessão só deixa de aparecer como "em curso"; pode ser reaberta a qualquer momento em "Sessões terminadas".`
            : 'A sessão deixa de aparecer como "em curso" — pode ser reaberta a qualquer momento em "Sessões terminadas".'
        }
        confirmLabel="Terminar sessão"
        cancelLabel="Cancelar"
        onConfirm={concluirSessao}
      />

      <ConfirmDialog
        open={sessaoADescartar !== null}
        onOpenChange={(open) => {
          if (!open) setSessaoADescartar(null);
        }}
        title={`Descartar "${sessaoADescartar?.nome}"?`}
        description="Apaga a sessão inteira — todos os cartões carregados e, se já existirem, os lotes gerados (o histórico de quais cartões foram entregues ao banco nesses lotes perde-se). Esta ação não pode ser anulada."
        confirmLabel="Descartar sessão"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={descartarSessao}
      />
    </PageContainer>
  );
}
