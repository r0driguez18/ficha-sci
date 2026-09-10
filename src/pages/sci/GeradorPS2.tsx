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
import { FileDown, AlertTriangle, Upload, ClipboardPaste, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { gerarPS2, montarNib, nomeFicheiroPS2, TIPOS_OPERACAO, type PS2Resultado } from '@/lib/ps2';

interface LinhaBruta {
  contaBenef: string;
  valor: string;
  nome: string;
}

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Aceita tanto o nº de conta curto (como na folha Excel, que o embrulha em
 * "00030000…10176") como um NIB completo já colado da origem.
 */
function nibDe(conta: string): string {
  const c = (conta ?? '').replace(/\s/g, '');
  return c.startsWith('0003') && c.length >= 13 ? c : montarNib(c);
}

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

/** Parte texto colado (tab / ; / ,) em linhas {conta, valor, nome}. */
function parseColagem(txt: string): LinhaBruta[] {
  return txt
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== '')
    .map((l) => {
      const sep = l.includes('\t') ? '\t' : l.includes(';') ? ';' : ',';
      const [c = '', v = '', n = ''] = l.split(sep).map((x) => x.trim());
      return { contaBenef: c, valor: v, nome: n };
    });
}

export default function GeradorPS2() {
  const [contaEmpresa, setContaEmpresa] = useState('');
  const [data, setData] = useState(todayIso());
  const [referencia, setReferencia] = useState('');
  const [prefixo, setPrefixo] = useState('');
  const [tipo, setTipo] = useState<string>(TIPOS_OPERACAO[0]);

  const [modo, setModo] = useState<'colar' | 'ficheiro'>('colar');
  const [colagem, setColagem] = useState('');

  // Importação de ficheiro
  const fileRef = useRef<HTMLInputElement>(null);
  const [sheetRows, setSheetRows] = useState<string[][]>([]);
  const [nColunas, setNColunas] = useState(0);
  const [colConta, setColConta] = useState(0);
  const [colValor, setColValor] = useState(1);
  const [colNome, setColNome] = useState(2);
  const [linhaInicial, setLinhaInicial] = useState(1);

  const [resultado, setResultado] = useState<PS2Resultado | null>(null);

  const linhas: LinhaBruta[] = useMemo(() => {
    if (modo === 'colar') return parseColagem(colagem);
    const out: LinhaBruta[] = [];
    for (let i = Math.max(0, linhaInicial - 1); i < sheetRows.length; i++) {
      const r = sheetRows[i] ?? [];
      out.push({
        contaBenef: (r[colConta] ?? '').toString().trim(),
        valor: (r[colValor] ?? '').toString().trim(),
        nome: (r[colNome] ?? '').toString().trim(),
      });
    }
    return out;
  }, [modo, colagem, sheetRows, colConta, colValor, colNome, linhaInicial]);

  const carregarFicheiro = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, blankrows: false, defval: '' });
      const norm = rows.map((r) => (Array.isArray(r) ? r.map((c) => (c ?? '').toString()) : []));
      setSheetRows(norm);
      setNColunas(norm.reduce((m, r) => Math.max(m, r.length), 0));
      setResultado(null);
      toast.success(`${norm.length} linha(s) lidas de "${file.name}".`);
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível ler o ficheiro.');
    }
  };

  const gerar = () => {
    const uteis = linhas.filter((l) => l.contaBenef !== '' || l.valor !== '');
    const res = gerarPS2({
      tipo,
      nibEmpresa: montarNib(contaEmpresa),
      data,
      referenciaOrdenante: referencia,
      linhas: uteis.map((l) => ({
        nib: nibDe(l.contaBenef),
        valor: limparValor(l.valor),
        descritivo: `${prefixo} ${l.nome}`.trim(),
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
  const comDados = linhas.filter((l) => l.contaBenef !== '' || l.valor !== '');
  const previewLinhas = comDados.slice(0, 100);
  const colOpts = Array.from({ length: Math.max(nColunas, 3) }, (_, i) => i);

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
    <div className="container mx-auto p-6 max-w-4xl">
      <PageHeader
        title="Gerador PS2"
        subtitle="Trata a folha de salários e gera o ficheiro PS2 para processar no sistema"
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

      {/* Beneficiários em massa */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Beneficiários</CardTitle>
          <CardDescription>
            Cola a folha do Excel (nº conta, valor, nome) ou carrega o ficheiro. Centenas de linhas
            de uma vez.
          </CardDescription>
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant={modo === 'colar' ? 'default' : 'outline'}
              onClick={() => setModo('colar')}
            >
              <ClipboardPaste className="h-4 w-4 mr-1" /> Colar
            </Button>
            <Button
              size="sm"
              variant={modo === 'ficheiro' ? 'default' : 'outline'}
              onClick={() => setModo('ficheiro')}
            >
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
                setResultado(null);
              }}
              placeholder={'Uma linha por beneficiário, colunas separadas por tab:\n0003…\t150000\tJOÃO SILVA\n0003…\t142500\tMARIA COSTA'}
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
                  <div className="space-y-1">
                    <Label className="text-xs">Coluna Nº conta</Label>
                    <Select value={String(colConta)} onValueChange={(v) => setColConta(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {colOpts.map((i) => (
                          <SelectItem key={i} value={String(i)}>{XLSX.utils.encode_col(i)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Coluna Valor</Label>
                    <Select value={String(colValor)} onValueChange={(v) => setColValor(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {colOpts.map((i) => (
                          <SelectItem key={i} value={String(i)}>{XLSX.utils.encode_col(i)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Coluna Nome</Label>
                    <Select value={String(colNome)} onValueChange={(v) => setColNome(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {colOpts.map((i) => (
                          <SelectItem key={i} value={String(i)}>{XLSX.utils.encode_col(i)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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

          {comDados.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {comDados.length} linha(s) com dados. Pré-visualização (máx. 100):
              </p>
              <div className="max-h-72 overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Nº conta</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Nome</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewLinhas.map((l, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{l.contaBenef}</TableCell>
                        <TableCell>{l.valor}</TableCell>
                        <TableCell>{l.nome}</TableCell>
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
        <Button onClick={gerar} disabled={comDados.length === 0}>
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
