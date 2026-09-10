import React, { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageContainer } from '@/components/layout/PageContainer';
import {
  FileDown,
  AlertTriangle,
  Upload,
  ClipboardPaste,
  CheckCircle2,
  Trash2,
  Undo2,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { gerarPS2, nomeFicheiroPS2, TIPOS_OPERACAO, type PS2Resultado } from '@/lib/ps2';
import { tratarNib, NATUREZA_PADRAO, type NibTratado, type ModoConta } from '@/lib/nibBca';

const MODOS: { valor: ModoConta; label: string; hint: string }[] = [
  { valor: 'auto', label: 'Detetar automaticamente', hint: 'tenta perceber se há natureza no fim' },
  { valor: 'so-conta', label: 'Só o nº de conta', hint: 'concatena 0003…10176, não mexe no fim' },
  { valor: 'nib', label: 'NIB completo (21 díg.)', hint: 'só limpa e converte a natureza' },
];

interface LinhaBruta {
  recebido: string;
  valor: string;
  nome: string;
}

interface LinhaTratada extends LinhaBruta {
  idx: number;
  trat: NibTratado;
  nibFinal: string;
  estado: NibTratado['estado'] | 'excluido';
}

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Valor do Excel → escudos inteiros (o PS2 e o VBA só usam a parte inteira).
 * Um `.` ou `,` com **exatamente 2 dígitos a seguir** são cêntimos e caem;
 * os restantes separadores são milhares. Ex.: "6,860"→6860 · "108,800.00"→108800.
 */
function limparValor(s: string): string {
  let t = String(s ?? '').replace(/[^\d.,-]/g, '').trim();
  if (!t) return '';
  if (/[.,]\d{2}$/.test(t)) t = t.slice(0, -3); // cêntimos
  return t.replace(/[.,]/g, '');
}

function parseColagem(txt: string): LinhaBruta[] {
  return txt
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== '')
    .map((l) => {
      const sep = l.includes('\t') ? '\t' : l.includes(';') ? ';' : ',';
      const [c = '', v = '', n = ''] = l.split(sep).map((x) => x.trim());
      return { recebido: c, valor: v, nome: n };
    });
}

const pareceNib = (v: unknown) => String(v ?? '').replace(/\D/g, '').length >= 8;
const pareceValor = (v: unknown) => {
  const s = String(v ?? '').replace(/[.,\s]/g, '');
  return s.length > 0 && !Number.isNaN(Number(s)) && Number(s) > 0;
};

/** Adivinha as colunas (NIB / valor / nome) e a linha onde começam os dados. */
function autodetectar(rows: string[][]) {
  const nCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
  let header = -1;
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const txt = (rows[i] ?? []).filter(
      (c) => String(c).trim().length > 1 && Number.isNaN(Number(String(c).replace(/[.,\s]/g, ''))),
    ).length;
    if (txt >= 2) {
      header = i;
      break;
    }
  }
  const heads = (header >= 0 ? rows[header] ?? [] : []).map((c) => String(c ?? '').toLowerCase());
  const acha = (...keys: string[]) => heads.findIndex((h) => keys.some((k) => h.includes(k)));
  let cConta = acha('nib', 'iban', 'conta');
  let cValor = acha('valor', 'montante', 'líquido', 'liquido', 'a pagar', 'total');
  let cNome = acha('nome', 'benefici', 'deputado', 'funcion', 'colaborad');

  const dataStart = header < 0 ? 0 : header + 1;
  if (cConta < 0) {
    let best = 0;
    let bestN = -1;
    for (let c = 0; c < nCols; c++) {
      let n = 0;
      for (let i = dataStart; i < rows.length; i++) if (pareceNib((rows[i] ?? [])[c])) n++;
      if (n > bestN) {
        bestN = n;
        best = c;
      }
    }
    cConta = best;
  }
  if (cValor < 0) {
    for (let c = nCols - 1; c >= 0; c--) {
      let n = 0;
      for (let i = dataStart; i < rows.length; i++) if (pareceValor((rows[i] ?? [])[c])) n++;
      if (c !== cConta && n > 0) {
        cValor = c;
        break;
      }
    }
    if (cValor < 0) cValor = Math.min(cConta + 1, nCols - 1);
  }
  if (cNome < 0) cNome = cConta > 1 ? cConta - 1 : nCols > 2 ? 2 : 0;

  let li = dataStart;
  for (let i = dataStart; i < rows.length; i++) {
    if (pareceNib((rows[i] ?? [])[cConta])) {
      li = i;
      break;
    }
  }
  return {
    colConta: Math.max(0, cConta),
    colValor: Math.max(0, cValor),
    colNome: Math.max(0, cNome),
    linhaInicial: li + 1,
  };
}

const fmtNum = (v: string) => {
  const n = Math.trunc(Number(limparValor(v)));
  return Number.isNaN(n) ? v : n.toLocaleString('pt-PT');
};

export default function GeradorPS2() {
  const [contaEmpresa, setContaEmpresa] = useState('');
  const [data, setData] = useState(todayIso());
  const [referencia, setReferencia] = useState('');
  const [prefixo, setPrefixo] = useState('');
  const [tipo, setTipo] = useState<string>(TIPOS_OPERACAO[0]);

  const [modo, setModo] = useState<'colar' | 'ficheiro'>('colar');
  const [colagem, setColagem] = useState('');
  const [modoConta, setModoConta] = useState<ModoConta>('auto');
  const [soAlertas, setSoAlertas] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const [sheetRows, setSheetRows] = useState<string[][]>([]);
  const [nColunas, setNColunas] = useState(0);
  const [colConta, setColConta] = useState(0);
  const [colValor, setColValor] = useState(1);
  const [colNome, setColNome] = useState(2);
  const [linhaInicial, setLinhaInicial] = useState(1);

  const [verNatureza, setVerNatureza] = useState(false);
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [excluidos, setExcluidos] = useState<Set<number>>(new Set());
  const [resultado, setResultado] = useState<PS2Resultado | null>(null);
  const [confirmarReset, setConfirmarReset] = useState(false);

  const resetLinhas = () => {
    setOverrides({});
    setExcluidos(new Set());
    setResultado(null);
    setSoAlertas(false);
  };

  const limparTudo = () => {
    setContaEmpresa('');
    setData(todayIso());
    setReferencia('');
    setPrefixo('');
    setTipo(TIPOS_OPERACAO[0]);
    setModo('colar');
    setColagem('');
    setModoConta('auto');
    setSheetRows([]);
    setNColunas(0);
    setColConta(0);
    setColValor(1);
    setColNome(2);
    setLinhaInicial(1);
    resetLinhas();
    toast.success('Dados limpos.');
  };

  const recomecar = () => {
    const temDados =
      contaEmpresa.trim() !== '' || colagem.trim() !== '' || sheetRows.length > 0;
    if (temDados) setConfirmarReset(true);
    else limparTudo();
  };

  const linhas: LinhaBruta[] = useMemo(() => {
    if (modo === 'colar') return parseColagem(colagem);
    const out: LinhaBruta[] = [];
    for (let i = Math.max(0, linhaInicial - 1); i < sheetRows.length; i++) {
      const r = sheetRows[i] ?? [];
      out.push({
        recebido: (r[colConta] ?? '').toString().trim(),
        valor: (r[colValor] ?? '').toString().trim(),
        nome: (r[colNome] ?? '').toString().trim(),
      });
    }
    return out;
  }, [modo, colagem, sheetRows, colConta, colValor, colNome, linhaInicial]);

  const comDados = useMemo(
    () => linhas.map((l, i) => ({ ...l, idx: i })).filter((l) => l.recebido !== '' || l.valor !== ''),
    [linhas],
  );

  const tratadas: LinhaTratada[] = useMemo(
    () =>
      comDados.map((l) => {
        const trat = tratarNib(l.recebido, NATUREZA_PADRAO, modoConta);
        if (excluidos.has(l.idx)) return { ...l, trat, nibFinal: '', estado: 'excluido' };
        const ov = (overrides[l.idx] ?? '').replace(/\D/g, '');
        if (ov) {
          return { ...l, trat, nibFinal: ov, estado: /^\d{21}$/.test(ov) ? 'ok' : 'alerta' };
        }
        return { ...l, trat, nibFinal: trat.nib, estado: trat.estado };
      }),
    [comDados, overrides, excluidos, modoConta],
  );

  // O nº de conta da empresa é sempre escrito à mão com a natureza no fim
  // (ex.: …10002). Trata-se sempre em modo "auto", independentemente do
  // formato escolhido para a folha dos beneficiários.
  const nibEmpresa = useMemo(
    () => tratarNib(contaEmpresa, NATUREZA_PADRAO, 'auto'),
    [contaEmpresa],
  );

  const contagem = useMemo(() => {
    let ok = 0;
    let naoBca = 0;
    let alerta = 0;
    let excluidas = 0;
    for (const t of tratadas) {
      if (t.estado === 'ok') ok++;
      else if (t.estado === 'nao-bca') naoBca++;
      else if (t.estado === 'excluido') excluidas++;
      else alerta++;
    }
    return { ok, naoBca, alerta, excluidas };
  }, [tratadas]);

  const carregarFicheiro = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, blankrows: false, defval: '' });
      const norm = rows.map((r) => (Array.isArray(r) ? r.map((c) => (c ?? '').toString()) : []));
      setSheetRows(norm);
      setNColunas(norm.reduce((m, r) => Math.max(m, r.length), 0));
      const det = autodetectar(norm);
      setColConta(det.colConta);
      setColValor(det.colValor);
      setColNome(det.colNome);
      setLinhaInicial(det.linhaInicial);
      resetLinhas();
      toast.success(`${norm.length} linha(s) lidas — colunas detetadas.`);
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível ler o ficheiro.');
    }
  };

  const toggleExcluir = (idx: number) =>
    setExcluidos((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });

  const gerar = () => {
    if (contagem.alerta > 0) {
      toast.error(`${contagem.alerta} linha(s) em alerta — corrige ou exclui antes de gerar.`);
      return;
    }
    if (nibEmpresa.estado !== 'ok') {
      toast.error(`NIB da empresa inválido: ${nibEmpresa.motivo ?? 'verifica o nº de conta'}.`);
      return;
    }
    const res = gerarPS2({
      tipo,
      nibEmpresa: nibEmpresa.nib,
      data,
      referenciaOrdenante: referencia,
      linhas: tratadas
        .filter((t) => t.estado === 'ok')
        .map((t) => ({
          nib: t.nibFinal,
          valor: limparValor(t.valor),
          descritivo: `${prefixo} ${t.nome}`.trim(),
        })),
    });
    setResultado(res);
    if (res.erros.length === 0) toast.success(`Ficheiro PS2 pronto — ${res.totalRegistos} registos.`);
    else toast.error(`${res.erros.length} erro(s) — corrige e gera de novo.`);
  };

  const descarregar = () => {
    if (!resultado || resultado.erros.length > 0) return;
    const blob = new Blob([resultado.conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeFicheiroPS2();
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewFonte = soAlertas ? tratadas.filter((t) => t.estado === 'alerta') : tratadas;
  const colOpts = Array.from({ length: Math.max(nColunas, 3) }, (_, i) => i);
  const previewLinhas = previewFonte.slice(0, 400);
  const headerRow = sheetRows[Math.max(0, linhaInicial - 2)] ?? [];
  const nomeCol = (i: number) => {
    const h = String(headerRow[i] ?? '').trim();
    return h ? `${XLSX.utils.encode_col(i)} — ${h.slice(0, 22)}` : XLSX.utils.encode_col(i);
  };

  const previewConteudo = useMemo(() => {
    if (!resultado || resultado.erros.length > 0) return '';
    const ls = resultado.conteudo.split('\r\n').filter(Boolean);
    if (ls.length <= 40) return resultado.conteudo;
    return [
      ls[0],
      ...ls.slice(1, 25),
      `… (${resultado.totalRegistos} registos — descarrega para ver tudo) …`,
      ls[ls.length - 1],
    ].join('\r\n');
  }, [resultado]);

  return (
    <PageContainer size="default">
      <PageHeader
        title="Gerador PS2"
        subtitle="Trata a folha de salários (contas → NIB) e gera o ficheiro PS2"
      >
        <Button variant="outline" size="sm" onClick={recomecar}>
          <Undo2 className="h-4 w-4 mr-1" /> Recomeçar
        </Button>
      </PageHeader>

      {/* Cabeçalho */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Dados do ordenante</CardTitle>
          <CardDescription>Aplicam-se ao ficheiro inteiro (cabeçalho PS2).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Conta da empresa + NIB resolvido — bloco próprio */}
          <div className="rounded-md border bg-muted/30 p-4 space-y-2">
            <Label htmlFor="contaEmpresa">Conta da empresa (ordenante)</Label>
            <Input
              id="contaEmpresa"
              value={contaEmpresa}
              onChange={(e) => setContaEmpresa(e.target.value)}
              placeholder="ex.: 9315589110002 (com a natureza no fim)"
              className="font-mono max-w-sm bg-background"
            />
            <div className="flex items-baseline gap-2 text-xs">
              <span className="text-muted-foreground">NIB:</span>
              {contaEmpresa.trim() ? (
                <code className={nibEmpresa.estado === 'ok' ? 'font-medium' : 'text-destructive'}>
                  {nibEmpresa.estado === 'ok' ? nibEmpresa.nib : nibEmpresa.motivo}
                </code>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="data">Data de processamento</Label>
              <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo de operação</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger id="tipo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_OPERACAO.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="referencia">Referência do ordenante</Label>
              <Input id="referencia" value={referencia} maxLength={35} onChange={(e) => setReferencia(e.target.value)} placeholder="máx. 35 caracteres" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prefixo">Descritivo (prefixo)</Label>
              <Input id="prefixo" value={prefixo} onChange={(e) => setPrefixo(e.target.value)} placeholder="ex.: Ordenado — junta-se ao nome" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Como a natureza é convertida (referência) */}
      <div className="mb-6 rounded-md border bg-muted/30">
        <button
          type="button"
          onClick={() => setVerNatureza((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium"
        >
          Como a natureza é convertida
          <ChevronDown
            className={`h-4 w-4 transition-transform ${verNatureza ? 'rotate-180' : ''}`}
          />
        </button>
        {verNatureza && (
          <div className="border-t px-4 py-3 text-xs text-muted-foreground">
            <p className="mb-2">
              Quando a conta traz a natureza no fim (<code>1</code>, <code>10</code>,{' '}
              <code>101</code>, <code>10001</code>, <code>102</code>…), o gerador substitui-a
              pela natureza final de 5 dígitos:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {NATUREZA_PADRAO.map((r) => (
                <span key={r.recebida} className="rounded border bg-background px-2 py-0.5 font-mono">
                  {r.recebida} → {r.final}
                </span>
              ))}
            </div>
            <p className="mt-2">
              Em <strong>Só o nº de conta</strong> nada disto é aplicado — a conta é usada tal
              como vem, com <code>10176</code> no fim.
            </p>
          </div>
        )}
      </div>

      {/* Beneficiários */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Beneficiários</CardTitle>
          <CardDescription>Cola a folha ou carrega o ficheiro. As contas viram NIB.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Como introduzir</Label>
              <div className="flex gap-2">
                <Button size="sm" variant={modo === 'colar' ? 'default' : 'outline'} onClick={() => setModo('colar')}>
                  <ClipboardPaste className="h-4 w-4 mr-1" /> Colar
                </Button>
                <Button size="sm" variant={modo === 'ficheiro' ? 'default' : 'outline'} onClick={() => setModo('ficheiro')}>
                  <Upload className="h-4 w-4 mr-1" /> Carregar ficheiro
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground" htmlFor="modoConta">Formato das contas recebidas</Label>
              <Select value={modoConta} onValueChange={(v) => setModoConta(v as ModoConta)}>
                <SelectTrigger id="modoConta"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODOS.map((m) => (
                    <SelectItem key={m.valor} value={m.valor}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {MODOS.find((m) => m.valor === modoConta)?.hint}
              </p>
            </div>
          </div>

          {modo === 'colar' ? (
            <Textarea
              value={colagem}
              onChange={(e) => {
                setColagem(e.target.value);
                resetLinhas();
              }}
              placeholder={'NIB/conta [tab] valor [tab] nome\n000300006757980410176\t108800,00\tJOÃO SILVA\n67579804\t142500\tMARIA COSTA'}
              className="min-h-[150px] font-mono text-xs"
            />
          ) : (
            <div className="space-y-4">
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
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" /> Escolher ficheiro (.xlsx / .csv)
              </Button>

              {sheetRows.length > 0 && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-md border">
                    <table className="text-[11px] w-full">
                      <thead>
                        <tr className="bg-muted/60 text-left">
                          <th className="px-2 py-1 font-normal text-muted-foreground w-10">linha</th>
                          {colOpts.map((i) => {
                            const papel = i === colConta ? 'NIB' : i === colValor ? 'Valor' : i === colNome ? 'Nome' : '';
                            const cor = i === colConta ? 'text-primary' : i === colValor ? 'text-success' : i === colNome ? 'text-foreground' : 'text-muted-foreground';
                            return (
                              <th key={i} className={`px-2 py-1 whitespace-nowrap font-medium ${cor}`}>
                                {XLSX.utils.encode_col(i)}
                                {papel && <span className="ml-1 font-normal">· {papel}</span>}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {sheetRows.slice(0, 8).map((r, ri) => (
                          <tr key={ri} className={`border-t ${ri === linhaInicial - 1 ? 'border-l-2 border-l-primary' : ''} ${ri >= linhaInicial - 1 ? '' : 'opacity-45'}`}>
                            <td className="px-2 py-1 text-muted-foreground">{ri + 1}</td>
                            {colOpts.map((ci) => (
                              <td key={ci} className={`px-2 py-1 max-w-[14rem] truncate ${ci === colConta ? 'text-primary font-mono' : ci === colValor ? 'text-success' : ci === colNome ? 'text-foreground' : ''}`}>
                                {(r[ci] ?? '').toString()}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    {(
                      [
                        ['NIB', colConta, setColConta] as const,
                        ['Valor', colValor, setColValor] as const,
                        ['Nome', colNome, setColNome] as const,
                      ] as const
                    ).map(([label, val, set]) => (
                      <div key={label} className="space-y-1">
                        <Label className="text-xs">Coluna do {label}</Label>
                        <Select value={String(val)} onValueChange={(v) => set(Number(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {colOpts.map((i) => (
                              <SelectItem key={i} value={String(i)}>{nomeCol(i)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                    <div className="space-y-1">
                      <Label className="text-xs" htmlFor="li">Dados começam na linha</Label>
                      <Input id="li" type="number" min={1} value={linhaInicial} onChange={(e) => setLinhaInicial(Math.max(1, Number(e.target.value) || 1))} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tratadas.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary">{contagem.ok} prontos</Badge>
                {contagem.alerta > 0 && (
                  <button type="button" onClick={() => setSoAlertas((v) => !v)}>
                    <Badge variant={soAlertas ? 'default' : 'destructive'}>
                      {contagem.alerta} em alerta {soAlertas ? '· a mostrar' : '· ver só estes'}
                    </Badge>
                  </button>
                )}
                {soAlertas && (
                  <button type="button" onClick={() => setSoAlertas(false)} className="text-xs text-primary hover:underline">
                    mostrar todas
                  </button>
                )}
                {contagem.naoBca > 0 && <Badge variant="outline">{contagem.naoBca} não-BCA (fora)</Badge>}
                {contagem.excluidas > 0 && <Badge variant="outline">{contagem.excluidas} excluídas</Badge>}
              </div>

              <div className="max-h-[30rem] overflow-y-auto rounded-md border">
                <table className="w-full table-fixed text-sm">
                  <colgroup>
                    <col className="w-8" />
                    <col />
                    <col className="w-[13.5rem]" />
                    <col className="w-24" />
                    <col className="w-28" />
                    <col className="w-10" />
                  </colgroup>
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="px-2 py-2">#</th>
                      <th className="px-2 py-2">Nome</th>
                      <th className="px-2 py-2">NIB final</th>
                      <th className="px-2 py-2 text-right">Valor</th>
                      <th className="px-2 py-2">Natureza</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {previewLinhas.map((t) => (
                      <tr
                        key={t.idx}
                        className={`border-b last:border-0 ${
                          t.estado === 'excluido'
                            ? 'line-through opacity-40'
                            : t.estado === 'nao-bca'
                              ? 'opacity-50'
                              : t.estado === 'alerta'
                                ? 'bg-destructive/5'
                                : ''
                        }`}
                      >
                        <td className="px-2 py-1.5 text-muted-foreground">{t.idx + 1}</td>
                        <td className="px-2 py-1.5 truncate" title={t.nome}>
                          {t.nome || <span className="text-muted-foreground">(sem nome)</span>}
                        </td>
                        <td className="px-2 py-1.5 font-mono text-[11px]">
                          {t.estado === 'nao-bca' ? (
                            <span className="text-muted-foreground">{t.trat.motivo}</span>
                          ) : t.estado === 'alerta' ? (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                              <Input
                                value={overrides[t.idx] ?? ''}
                                onChange={(e) => setOverrides((p) => ({ ...p, [t.idx]: e.target.value }))}
                                placeholder="NIB (21 díg.)"
                                className="h-7 font-mono text-[11px]"
                                title={`Recebido: ${t.recebido}`}
                              />
                            </div>
                          ) : (
                            t.nibFinal || '—'
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{fmtNum(t.valor)}</td>
                        <td className="px-2 py-1.5 text-xs text-muted-foreground">
                          {t.trat.naturezaRecebida && t.trat.naturezaRecebida !== t.trat.naturezaFinal
                            ? `${t.trat.naturezaRecebida} → ${t.trat.naturezaFinal}`
                            : '—'}
                        </td>
                        <td className="px-2 py-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => toggleExcluir(t.idx)}
                            title={t.estado === 'excluido' ? 'Repor linha' : 'Excluir linha'}
                          >
                            {t.estado === 'excluido' ? (
                              <Undo2 className="h-4 w-4" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewFonte.length > previewLinhas.length && (
                <p className="text-xs text-muted-foreground">
                  Mostra as primeiras {previewLinhas.length} de {previewFonte.length}.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={gerar} disabled={contagem.ok === 0 || contagem.alerta > 0}>
          Gerar ficheiro PS2
        </Button>
        <Button variant="outline" onClick={descarregar} disabled={!resultado || resultado.erros.length > 0}>
          <FileDown className="h-4 w-4 mr-1" /> Descarregar {nomeFicheiroPS2()}
        </Button>
        <Button variant="ghost" onClick={recomecar} className="ml-auto text-muted-foreground">
          <Undo2 className="h-4 w-4 mr-1" /> Recomeçar
        </Button>
      </div>

      {resultado && resultado.erros.length > 0 && (
        <Card className="mt-6 border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> {resultado.erros.length} erro(s) — nada foi gerado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm space-y-1 max-h-64 overflow-auto">
              {resultado.erros.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {resultado && resultado.erros.length === 0 && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row flex-wrap items-center gap-3">
            <CardTitle className="text-base flex items-center gap-2 text-success">
              <CheckCircle2 className="h-4 w-4" /> Ficheiro pronto
            </CardTitle>
            <Badge variant="secondary">{resultado.totalRegistos} registos</Badge>
            <Badge variant="outline">total {Math.trunc(resultado.somaTotal).toLocaleString('pt-PT')}</Badge>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs leading-relaxed">
              {previewConteudo}
            </pre>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmarReset}
        onOpenChange={setConfirmarReset}
        title="Recomeçar do zero?"
        description="Limpa todos os campos, a folha colada/carregada e o resultado."
        confirmLabel="Limpar tudo"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={limparTudo}
      />
    </PageContainer>
  );
}
