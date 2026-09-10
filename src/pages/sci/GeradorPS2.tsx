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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, AlertTriangle, Upload, ClipboardPaste, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { gerarPS2, montarNib, nomeFicheiroPS2, TIPOS_OPERACAO, type PS2Resultado } from '@/lib/ps2';
import { tratarNib, NATUREZA_PADRAO, type NaturezaRegra, type NibTratado } from '@/lib/nibBca';

interface LinhaBruta {
  recebido: string;
  valor: string;
  nome: string;
}

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Limpa um valor colado do Excel: espaços e separadores de milhar → número canónico. */
function limparValor(s: string): string {
  let t = (s ?? '').toString().trim().replace(/\s/g, '').replace(/[^\d.,-]/g, '');
  if (t.includes('.') && t.includes(',')) {
    t =
      t.lastIndexOf(',') > t.lastIndexOf('.')
        ? t.replace(/\./g, '').replace(',', '.')
        : t.replace(/,/g, '');
  } else if (t.includes(',')) {
    t = t.replace(',', '.');
  }
  return t;
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

interface LinhaTratada extends LinhaBruta {
  trat: NibTratado;
  nibFinal: string;
  estado: NibTratado['estado'];
}

export default function GeradorPS2() {
  const [contaEmpresa, setContaEmpresa] = useState('');
  const [data, setData] = useState(todayIso());
  const [referencia, setReferencia] = useState('');
  const [prefixo, setPrefixo] = useState('');
  const [tipo, setTipo] = useState<string>(TIPOS_OPERACAO[0]);

  const [modo, setModo] = useState<'colar' | 'ficheiro'>('colar');
  const [colagem, setColagem] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);
  const [sheetRows, setSheetRows] = useState<string[][]>([]);
  const [nColunas, setNColunas] = useState(0);
  const [colConta, setColConta] = useState(0);
  const [colValor, setColValor] = useState(1);
  const [colNome, setColNome] = useState(2);
  const [linhaInicial, setLinhaInicial] = useState(1);

  const [natTabela, setNatTabela] = useState<NaturezaRegra[]>(NATUREZA_PADRAO);
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [resultado, setResultado] = useState<PS2Resultado | null>(null);

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
    () => linhas.filter((l) => l.recebido !== '' || l.valor !== ''),
    [linhas],
  );

  const tratadas: LinhaTratada[] = useMemo(
    () =>
      comDados.map((l, i) => {
        const trat = tratarNib(l.recebido, natTabela);
        const ov = (overrides[i] ?? '').replace(/\D/g, '');
        if (ov) {
          const ok = /^\d{21}$/.test(ov);
          return { ...l, trat, nibFinal: ov, estado: ok ? 'ok' : 'alerta' };
        }
        return { ...l, trat, nibFinal: trat.nib, estado: trat.estado };
      }),
    [comDados, natTabela, overrides],
  );

  const contagem = useMemo(() => {
    let ok = 0,
      naoBca = 0,
      alerta = 0;
    for (const t of tratadas) {
      if (t.estado === 'ok') ok++;
      else if (t.estado === 'nao-bca') naoBca++;
      else alerta++;
    }
    return { ok, naoBca, alerta };
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
      setOverrides({});
      setResultado(null);
      toast.success(`${norm.length} linha(s) lidas de "${file.name}".`);
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível ler o ficheiro.');
    }
  };

  const gerar = () => {
    if (contagem.alerta > 0) {
      toast.error(`${contagem.alerta} linha(s) em alerta — corrige os NIB antes de gerar.`);
      return;
    }
    const res = gerarPS2({
      tipo,
      nibEmpresa: montarNib(contaEmpresa),
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

  const nibEmpresaPreview = contaEmpresa.trim() ? montarNib(contaEmpresa) : '—';
  const colOpts = Array.from({ length: Math.max(nColunas, 3) }, (_, i) => i);
  const previewLinhas = tratadas.slice(0, 200);

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
    <div className="container mx-auto p-6 max-w-5xl">
      <PageHeader
        title="Gerador PS2"
        subtitle="Trata a folha de salários (contas → NIB) e gera o ficheiro PS2"
      />

      {/* Cabeçalho */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Dados do ordenante</CardTitle>
          <CardDescription>
            NIB da empresa montado: <code>{nibEmpresaPreview}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contaEmpresa">Nº de conta da empresa</Label>
            <Input
              id="contaEmpresa"
              value={contaEmpresa}
              onChange={(e) => setContaEmpresa(e.target.value)}
              placeholder="dígitos da conta (célula B8 da folha)"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="data">Data de processamento</Label>
            <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="referencia">Referência do ordenante</Label>
            <Input
              id="referencia"
              value={referencia}
              maxLength={35}
              onChange={(e) => setReferencia(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tipo">Tipo de operação</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_OPERACAO.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="prefixo">Descritivo (prefixo)</Label>
            <Input
              id="prefixo"
              value={prefixo}
              onChange={(e) => setPrefixo(e.target.value)}
              placeholder="ex.: Ordenado — junta-se ao nome de cada linha"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de natureza */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Tabela de natureza</CardTitle>
          <CardDescription>
            Índice recebido (1–9, ou `1`/`10`/`101`/`10001`…) → natureza final de 5 dígitos.
            Editável — quando surgir um caso novo, ajusta aqui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {natTabela.map((r, i) => (
              <div key={i} className="flex items-center gap-1 rounded-md border px-2 py-1">
                <span className="text-xs text-muted-foreground w-10 text-right">{r.recebida} →</span>
                <Input
                  value={r.final}
                  onChange={(e) =>
                    setNatTabela((prev) =>
                      prev.map((x, j) => (j === i ? { ...x, final: e.target.value.replace(/\D/g, '') } : x)),
                    )
                  }
                  className="h-7 w-20 font-mono text-xs"
                  maxLength={5}
                />
                {r.recebida.length >= 3 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setNatTabela((prev) => prev.filter((_, j) => j !== i))}
                    aria-label="Remover regra"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNatTabela((prev) => [...prev, { recebida: '', final: '' }])}
            >
              <Plus className="h-4 w-4 mr-1" /> Regra
            </Button>
          </div>
          {natTabela.some((r) => r.recebida === '' || r.final === '') && (
            <p className="mt-2 text-xs text-muted-foreground">
              Preenche "recebida" (o que vem no fim do NIB) e "final" nas regras novas.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Beneficiários */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Beneficiários</CardTitle>
          <CardDescription>
            Cola a folha (NIB/conta, valor, nome) ou carrega o ficheiro. Centenas de linhas de uma
            vez. As contas são transformadas em NIB automaticamente.
          </CardDescription>
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant={modo === 'colar' ? 'default' : 'outline'} onClick={() => setModo('colar')}>
              <ClipboardPaste className="h-4 w-4 mr-1" /> Colar
            </Button>
            <Button size="sm" variant={modo === 'ficheiro' ? 'default' : 'outline'} onClick={() => setModo('ficheiro')}>
              <Upload className="h-4 w-4 mr-1" /> Carregar ficheiro
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {modo === 'colar' ? (
            <Textarea
              value={colagem}
              onChange={(e) => {
                setColagem(e.target.value);
                setOverrides({});
                setResultado(null);
              }}
              placeholder={'Uma linha por beneficiário: NIB/conta [tab] valor [tab] nome\n000300006757980410176\t108800,00\tJOÃO SILVA\n67579804\t142500\tMARIA COSTA'}
              className="min-h-[160px] font-mono text-xs"
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
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    ['NIB / conta', colConta, setColConta] as const,
                    ['Valor', colValor, setColValor] as const,
                    ['Nome', colNome, setColNome] as const,
                  ].map(([label, val, set]) => (
                    <div key={label} className="space-y-1">
                      <Label className="text-xs">Coluna {label}</Label>
                      <Select value={String(val)} onValueChange={(v) => set(Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {colOpts.map((i) => (
                            <SelectItem key={i} value={String(i)}>{XLSX.utils.encode_col(i)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  <div className="space-y-1">
                    <Label className="text-xs" htmlFor="li">Linha inicial</Label>
                    <Input
                      id="li"
                      type="number"
                      min={1}
                      value={linhaInicial}
                      onChange={(e) => setLinhaInicial(Math.max(1, Number(e.target.value) || 1))}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {tratadas.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="secondary">{contagem.ok} prontos</Badge>
                {contagem.naoBca > 0 && <Badge variant="outline">{contagem.naoBca} não-BCA (fora)</Badge>}
                {contagem.alerta > 0 && (
                  <Badge variant="destructive">{contagem.alerta} em alerta — corrigir</Badge>
                )}
                {tratadas.length > previewLinhas.length && (
                  <span className="text-xs text-muted-foreground self-center">
                    (mostra as primeiras {previewLinhas.length})
                  </span>
                )}
              </div>
              <div className="max-h-[28rem] overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Recebido</TableHead>
                      <TableHead>Nat.</TableHead>
                      <TableHead>NIB final</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewLinhas.map((t, i) => (
                      <TableRow
                        key={i}
                        className={
                          t.estado === 'nao-bca'
                            ? 'opacity-45'
                            : t.estado === 'alerta'
                              ? 'bg-destructive/5'
                              : undefined
                        }
                      >
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="max-w-[10rem] truncate">{t.nome || '—'}</TableCell>
                        <TableCell className="font-mono text-[11px]">{t.recebido}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {t.trat.naturezaRecebida
                            ? `${t.trat.naturezaRecebida} → ${t.trat.naturezaFinal}`
                            : '—'}
                        </TableCell>
                        <TableCell className="font-mono text-[11px]">
                          {t.estado === 'nao-bca' ? (
                            <span className="text-muted-foreground">{t.trat.motivo}</span>
                          ) : t.estado === 'alerta' ? (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                              <Input
                                value={overrides[i] ?? ''}
                                onChange={(e) =>
                                  setOverrides((prev) => ({ ...prev, [i]: e.target.value }))
                                }
                                placeholder={t.trat.motivo ?? 'NIB (21 díg.)'}
                                className="h-7 w-52 font-mono text-[11px]"
                              />
                            </div>
                          ) : (
                            t.nibFinal
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{t.valor}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={gerar} disabled={contagem.ok === 0 || contagem.alerta > 0}>
          Gerar ficheiro PS2
        </Button>
        <Button
          variant="outline"
          onClick={descarregar}
          disabled={!resultado || resultado.erros.length > 0}
        >
          <FileDown className="h-4 w-4 mr-1" /> Descarregar {nomeFicheiroPS2()}
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
            <CardTitle className="text-base flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Ficheiro pronto
            </CardTitle>
            <Badge variant="secondary">{resultado.totalRegistos} registos</Badge>
            <Badge variant="outline">total {Math.trunc(resultado.somaTotal)}</Badge>
            {resultado.linhasIgnoradas > 0 && (
              <Badge variant="outline">{resultado.linhasIgnoradas} linha(s) vazia(s) ignorada(s)</Badge>
            )}
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs leading-relaxed">
              {previewConteudo}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
