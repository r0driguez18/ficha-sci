import React, { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FileDown, AlertTriangle, Upload, CheckCircle2, Trash2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  TAMANHO_LINHA,
  autodetectarColunasOIC,
  codificarAnsi,
  formatarCentimos,
  gerarOIC,
  nibEmGrupos,
  nomeFicheiroOIC,
  tratarLinhaOIC,
  type LinhaOICComRef,
  type ResultadoOIC,
} from '@/lib/oic';
import { linhasDaFolha } from '@/lib/oicFolha';

const letraColuna = (i: number) => {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

/** Texto colado do Excel (tabs) → matriz; mantém as linhas em branco para a numeração bater certo. */
function paraMatriz(texto: string): unknown[][] {
  const linhas = texto.split(/\r\n|\r|\n/);
  while (linhas.length > 0 && linhas[linhas.length - 1].trim() === '') linhas.pop();
  const sep = texto.includes('\t') ? '\t' : texto.includes(';') ? ';' : ',';
  return linhas.map((l) => l.split(sep));
}

const COLUNAS_VAZIAS = { colNib: 0, colMontante: 1, colNome: 2, linhaInicial: 1 };
const DESCRITIVO_INICIAL = 'Pagamento Ordenado';

export default function GeradorOIC() {
  const [textoColado, setTextoColado] = useState('');
  const [rows, setRows] = useState<unknown[][]>([]);
  const [origem, setOrigem] = useState('');
  const [cols, setCols] = useState(COLUNAS_VAZIAS);
  const [descritivo, setDescritivo] = useState(DESCRITIVO_INICIAL);
  const [excluidos, setExcluidos] = useState<Set<number>>(new Set());
  const [resultado, setResultado] = useState<ResultadoOIC | null>(null);
  const [confirmarReset, setConfirmarReset] = useState(false);
  const inputFicheiro = useRef<HTMLInputElement>(null);

  const carregar = (novas: unknown[][], nomeOrigem: string) => {
    setRows(novas);
    setOrigem(nomeOrigem);
    setExcluidos(new Set());
    setResultado(null);
    if (novas.length > 0) {
      const d = autodetectarColunasOIC(novas);
      setCols({
        colNib: d.colNib,
        colMontante: d.colMontante,
        colNome: d.colNome,
        linhaInicial: d.linhaInicial,
      });
    }
  };

  const aoColar = (valor: string) => {
    setTextoColado(valor);
    carregar(valor.trim() === '' ? [] : paraMatriz(valor), 'texto colado');
  };

  const aoEscolherFicheiro = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const buf = await f.arrayBuffer();
      // raw: números ficam números, para se detetar um NIB que o Excel guardou como número.
      const wb = XLSX.read(buf, { type: 'array', raw: true });
      // Nas folhas de pagamento com várias abas, a do BCA é para o PS2: aqui só a "Interbancaria".
      // As folhas ocultas nunca entram.
      const visiveis = wb.SheetNames.filter((_, i) => !wb.Workbook?.Sheets?.[i]?.Hidden);
      const nomeFolha =
        visiveis.find((n) => /interbanc/i.test(n)) ?? (visiveis.length === 1 ? visiveis[0] : undefined);
      if (!nomeFolha) {
        toast.error('Não encontrei a aba "Interbancaria" neste ficheiro.');
        return;
      }
      const linhas = linhasDaFolha(wb.Sheets[nomeFolha]);
      if (linhas.length === 0) {
        toast.error('A folha está vazia.');
        return;
      }
      carregar(linhas, f.name);
      toast.success(visiveis.length > 1 ? `${f.name}: aba "${nomeFolha}", ${linhas.length} linhas lidas` : `${f.name}: ${linhas.length} linhas lidas`);
    } catch {
      toast.error('Não foi possível ler o ficheiro. Usa .xlsx, .xlsm, .xls ou .csv.');
    }
  };

  const nColunas = useMemo(() => Math.max(4, cols.colNib + 1, cols.colMontante + 1, cols.colNome + 1, rows.reduce((m, r) => Math.max(m, r.length), 0)), [rows, cols]);

  const tratadas = useMemo<LinhaOICComRef[]>(() => {
    const out: LinhaOICComRef[] = [];
    for (let i = Math.max(0, cols.linhaInicial - 1); i < rows.length; i++) {
      const r = rows[i] ?? [];
      const t = tratarLinhaOIC(
        { nib: r[cols.colNib], montante: r[cols.colMontante], nome: r[cols.colNome], descritivo: '' },
        descritivo,
      );
      if (!t.vazia) out.push({ ...t, ref: i + 1 });
    }
    return out;
  }, [rows, cols, descritivo]);

  const ativas = useMemo(() => tratadas.filter((t) => !excluidos.has(t.ref)), [tratadas, excluidos]);
  const nErros = ativas.filter((t) => t.erro).length;
  const nProntas = ativas.length - nErros;
  const totalPronto = ativas.reduce((s, t) => s + (t.erro ? 0 : t.cents), 0);

  const alternarExcluida = (ref: number) => {
    setResultado(null);
    setExcluidos((prev) => {
      const n = new Set(prev);
      if (n.has(ref)) n.delete(ref);
      else n.add(ref);
      return n;
    });
  };

  const gerar = () => {
    const r = gerarOIC(ativas);
    setResultado(r);
    if (r.erros.length > 0) toast.error(`${r.erros.length} erro(s) — corrige ou exclui as linhas.`);
    else toast.success(`Ficheiro gerado: ${r.totalRegistos} registos`);
  };

  const descarregar = () => {
    if (!resultado || resultado.erros.length > 0) return;
    // ANSI (Windows-1252), como o ficheiro que a macro gera: cada carácter = 1 byte, linhas de 135.
    const blob = new Blob([codificarAnsi(resultado.conteudo)], { type: 'text/plain;charset=windows-1252' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeFicheiroOIC();
    a.click();
    URL.revokeObjectURL(url);
  };

  const limparTudo = () => {
    setTextoColado('');
    setRows([]);
    setOrigem('');
    setCols(COLUNAS_VAZIAS);
    setDescritivo(DESCRITIVO_INICIAL);
    setExcluidos(new Set());
    setResultado(null);
  };

  const previewConteudo = useMemo(() => {
    if (!resultado || resultado.erros.length > 0) return '';
    const linhas = resultado.conteudo.split('\r\n');
    const mostra = linhas.slice(0, 25);
    if (linhas.length > mostra.length) mostra.push(`… (+${linhas.length - mostra.length} linhas)`);
    return mostra.join('\n');
  }, [resultado]);

  const seletorColuna = (rotulo: string, chave: 'colNib' | 'colMontante' | 'colNome') => (
    <div className="space-y-1">
      <Label>{rotulo}</Label>
      <Select
        value={String(cols[chave])}
        onValueChange={(v) => {
          setResultado(null);
          setCols((c) => ({ ...c, [chave]: Number(v) }));
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: nColunas }, (_, i) => (
            <SelectItem key={i} value={String(i)}>
              Coluna {letraColuna(i)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setConfirmarReset(true)}>
          <Undo2 className="h-4 w-4 mr-1" /> Recomeçar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Folha de pagamentos</CardTitle>
          <CardDescription>
            Cola as colunas do Excel ou carrega o ficheiro — o NIB, o montante e o nome são detetados sozinhos.
            Nos NIBs são removidos espaços, hífenes, apóstrofos, caracteres invisíveis e as letras do banco (BI, CECV…).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={inputFicheiro}
              type="file"
              accept=".xlsx,.xlsm,.xls,.csv"
              className="hidden"
              onChange={aoEscolherFicheiro}
            />
            <Button variant="outline" onClick={() => inputFicheiro.current?.click()}>
              <Upload className="h-4 w-4 mr-1" /> Carregar ficheiro
            </Button>
            <span className="text-sm text-muted-foreground">
              {origem && origem !== 'texto colado' ? origem : '.xlsx, .xlsm, .xls ou .csv — ou cola em baixo'}
            </span>
          </div>

          <Textarea
            value={textoColado}
            onChange={(e) => aoColar(e.target.value)}
            placeholder="Cola aqui as linhas copiadas do Excel (com ou sem cabeçalho)…"
            className="min-h-[120px] font-mono text-xs"
          />

          {rows.length > 0 && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {seletorColuna('NIB', 'colNib')}
              {seletorColuna('Montante', 'colMontante')}
              {seletorColuna('Nome', 'colNome')}
              <div className="space-y-1">
                <Label>Dados começam na linha</Label>
                <Input
                  type="number"
                  min={1}
                  value={cols.linhaInicial}
                  onChange={(e) => {
                    setResultado(null);
                    setCols((c) => ({ ...c, linhaInicial: Math.max(1, Number(e.target.value) || 1) }));
                  }}
                />
              </div>
            </div>
          )}

          <div className="max-w-sm space-y-1">
            <Label htmlFor="oic-desc">Descritivo (igual para todas as linhas)</Label>
            <Input
              id="oic-desc"
              maxLength={40}
              value={descritivo}
              onChange={(e) => {
                setResultado(null);
                setDescritivo(e.target.value);
              }}
              placeholder="Pagamento Ordenado"
            />
            <p className="text-xs text-muted-foreground">Escreve-se uma vez; vai em todas as linhas (máx. 40 caracteres).</p>
          </div>
        </CardContent>
      </Card>

      {tratadas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>2. Verificação</CardTitle>
            <CardDescription>
              <span className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> {nProntas} prontas
                </Badge>
                {nErros > 0 && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" /> {nErros} com erro
                  </Badge>
                )}
                {excluidos.size > 0 && <Badge variant="outline">{excluidos.size} excluídas</Badge>}
                <span className="text-sm">Total: {formatarCentimos(totalPronto)} CVE</span>
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[420px] overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted text-left">
                  <tr>
                    <th className="p-2">Linha</th>
                    <th className="p-2">Nome</th>
                    <th className="p-2">NIB</th>
                    <th className="p-2 text-right">Montante</th>
                    <th className="p-2">Descritivo</th>
                    <th className="p-2">Estado</th>
                    <th className="p-2" />
                  </tr>
                </thead>
                <tbody>
                  {tratadas.map((t) => {
                    const excl = excluidos.has(t.ref);
                    return (
                      <tr key={t.ref} className={`border-t ${excl ? 'opacity-50' : ''}`}>
                        <td className="p-2 tabular-nums">{t.ref}</td>
                        <td className="p-2">
                          {t.nome}
                          {t.nome.length > 27 && (
                            <span className="ml-1 text-xs text-amber-600">(corta a 27)</span>
                          )}
                        </td>
                        <td className="p-2 font-mono text-xs">{t.nib ? nibEmGrupos(t.nib) : '—'}</td>
                        <td className="p-2 text-right tabular-nums">
                          {t.cents > 0 ? formatarCentimos(t.cents) : '—'}
                        </td>
                        <td className="p-2">{t.descritivo}</td>
                        <td className="p-2">
                          {excl ? (
                            <span className="text-muted-foreground">excluída</span>
                          ) : t.erro ? (
                            <span className="text-destructive">{t.erro}</span>
                          ) : (
                            <span className="text-green-600">ok</span>
                          )}
                        </td>
                        <td className="p-2 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={excl ? 'Voltar a incluir a linha' : 'Excluir a linha'}
                            onClick={() => alternarExcluida(t.ref)}
                          >
                            {excl ? <Undo2 className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={gerar} disabled={nErros > 0 || nProntas === 0}>
                Gerar ficheiro OIC
              </Button>
              {nErros > 0 && (
                <span className="text-sm text-destructive">Corrige o ficheiro de origem ou exclui as linhas com erro.</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {resultado && resultado.erros.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Erros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm">
              {resultado.erros.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {resultado && resultado.erros.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>3. Ficheiro gerado</CardTitle>
            <CardDescription>
              Linhas: {resultado.totalRegistos} — Total: {formatarCentimos(resultado.totalCentimos)} CVE · linhas de{' '}
              {TAMANHO_LINHA} caracteres, ANSI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {resultado.substituidos > 0 && (
              <p className="flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                {resultado.substituidos} carácter(es) que o ANSI não tem (ex.: emojis) foram trocados por “?”.
              </p>
            )}
            <Button onClick={descarregar}>
              <FileDown className="h-4 w-4 mr-1" /> Descarregar {nomeFicheiroOIC()}
            </Button>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs leading-relaxed">{previewConteudo}</pre>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmarReset}
        onOpenChange={setConfirmarReset}
        title="Recomeçar do zero?"
        description="Limpa a folha colada/carregada e o resultado."
        confirmLabel="Limpar tudo"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={limparTudo}
      />
    </div>
  );
}
