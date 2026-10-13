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
import { FileDown, AlertTriangle, Upload, CheckCircle2, Trash2, Undo2, Pencil, Check, X } from 'lucide-react';
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
import { COLUNAS_JUNTA, lerFolhasOIC, type FolhaIgnorada, type FolhaUsada } from '@/lib/oicFolhas';
import { guardarFicheiro } from '@/lib/guardarFicheiro';
import { comExtensao, semExtensao } from '@/lib/nomeFicheiro';
import { DICA_TAB, tabNoCampo } from '@/lib/tabNoCampo';

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

/** Correção feita à mão numa linha (só vale para este ficheiro gerado — o Excel de origem não muda). */
interface EdicaoLinha {
  nib: string;
  nome: string;
  montante: string;
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
  /** Linhas corrigidas à mão, por nº de linha da folha. */
  const [edicoes, setEdicoes] = useState<Record<number, EdicaoLinha>>({});
  const [editando, setEditando] = useState<number | null>(null);
  const [rascunho, setRascunho] = useState<EdicaoLinha>({ nib: '', nome: '', montante: '' });
  const [resultado, setResultado] = useState<ResultadoOIC | null>(null);
  const [confirmarReset, setConfirmarReset] = useState(false);
  /** Folhas do ficheiro carregado: as usadas, as ignoradas, e se foram juntadas. */
  const [folhas, setFolhas] = useState<{ usadas: FolhaUsada[]; ignoradas: FolhaIgnorada[]; junta: boolean } | null>(null);
  /** Nome do ficheiro a gravar, sem a extensão (a ".txt" é sempre acrescentada, nunca se edita). */
  const [nomeBase, setNomeBase] = useState(() => semExtensao(nomeFicheiroOIC()));
  const inputFicheiro = useRef<HTMLInputElement>(null);

  const carregar = (novas: unknown[][], nomeOrigem: string, fixas?: typeof COLUNAS_VAZIAS) => {
    setRows(novas);
    setOrigem(nomeOrigem);
    setExcluidos(new Set());
    setEdicoes({});
    setEditando(null);
    setResultado(null);
    if (fixas) {
      setCols(fixas);
    } else if (novas.length > 0) {
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
    setFolhas(null);
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
      // O nome das abas não conta: entram as abas (visíveis) com NIBs de outros bancos, e se
      // houver várias (BAI, BCN, CECV…) juntam-se numa lista só.
      const lidas = lerFolhasOIC(wb);
      if (lidas.modo === 'nenhuma') {
        setFolhas(null);
        toast.error('Não encontrei NIBs de outros bancos neste ficheiro (nas folhas visíveis).');
        return;
      }
      setFolhas({ usadas: lidas.usadas, ignoradas: lidas.ignoradas, junta: lidas.modo === 'junta' });
      if (lidas.modo === 'junta') carregar(lidas.rows, f.name, COLUNAS_JUNTA);
      else carregar(lidas.rows, f.name);
      toast.success(
        lidas.modo === 'junta'
          ? `${f.name}: ${lidas.usadas.length} folhas juntas (${lidas.rows.length} linhas)`
          : `${f.name}: ${lidas.rows.length} linhas lidas`,
      );
    } catch {
      toast.error('Não foi possível ler o ficheiro. Usa .xlsx, .xlsm, .xls ou .csv.');
    }
  };

  const nColunas = useMemo(() => Math.max(4, cols.colNib + 1, cols.colMontante + 1, cols.colNome + 1, rows.reduce((m, r) => Math.max(m, r.length), 0)), [rows, cols]);

  const tratadas = useMemo<LinhaOICComRef[]>(() => {
    const out: LinhaOICComRef[] = [];
    for (let i = Math.max(0, cols.linhaInicial - 1); i < rows.length; i++) {
      const r = rows[i] ?? [];
      const ed = edicoes[i + 1];
      const t = tratarLinhaOIC(
        {
          nib: ed ? ed.nib : r[cols.colNib],
          montante: ed ? ed.montante : r[cols.colMontante],
          nome: ed ? ed.nome : r[cols.colNome],
          descritivo: '',
        },
        descritivo,
      );
      if (!t.vazia) out.push({ ...t, ref: i + 1, rotulo: folhas?.junta ? `${String(r[3])} · linha ${String(r[4])}` : undefined });
    }
    return out;
  }, [rows, cols, descritivo, folhas, edicoes]);

  const ativas = useMemo(() => tratadas.filter((t) => !excluidos.has(t.ref)), [tratadas, excluidos]);
  const nErros = ativas.filter((t) => t.erro).length;
  // NIBs do BCA (0003…) ficam fora do ficheiro: não são erro nem contam para o total.
  const nBca = ativas.filter((t) => t.foraDoFicheiro).length;
  const nProntas = ativas.length - nErros - nBca;
  const totalPronto = ativas.reduce((s, t) => s + (t.erro || t.foraDoFicheiro ? 0 : t.cents), 0);

  const celulaTexto = (v: unknown) => (v === null || v === undefined ? '' : String(v));

  const abrirEdicao = (ref: number) => {
    const r = rows[ref - 1] ?? [];
    setRascunho(
      edicoes[ref] ?? {
        nib: celulaTexto(r[cols.colNib]),
        nome: celulaTexto(r[cols.colNome]),
        montante: celulaTexto(r[cols.colMontante]),
      },
    );
    setEditando(ref);
  };

  const guardarEdicao = () => {
    if (editando === null) return;
    const ref = editando;
    setResultado(null);
    setEdicoes((p) => ({ ...p, [ref]: { ...rascunho } }));
    setEditando(null);
  };

  const reporOriginal = (ref: number) => {
    setResultado(null);
    setEdicoes((p) => {
      const resto = { ...p };
      delete resto[ref];
      return resto;
    });
    setEditando(null);
  };

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

  const descarregar = async () => {
    if (!resultado || resultado.erros.length > 0) return;
    // ANSI (Windows-1252), como o ficheiro que a macro gera: cada carácter = 1 byte, linhas de 135.
    const blob = new Blob([codificarAnsi(resultado.conteudo)], { type: 'text/plain;charset=windows-1252' });
    await guardarFicheiro(blob, {
      sugestaoNome: comExtensao(nomeBase, '.txt'),
      extensao: '.txt',
      descricaoTipo: 'Ficheiro OIC',
    });
  };

  const limparTudo = () => {
    setTextoColado('');
    setFolhas(null);
    setRows([]);
    setOrigem('');
    setCols(COLUNAS_VAZIAS);
    setDescritivo(DESCRITIVO_INICIAL);
    setNomeBase(semExtensao(nomeFicheiroOIC()));
    setExcluidos(new Set());
    setEdicoes({});
    setEditando(null);
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
            onKeyDown={tabNoCampo}
            placeholder="Cola aqui as linhas copiadas do Excel (com ou sem cabeçalho)…"
            className="min-h-[120px] font-mono text-xs"
          />
          <p className="text-[11px] text-muted-foreground">{DICA_TAB}</p>

          {folhas && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
              <p>
                <strong>{folhas.junta ? 'Folhas juntas:' : 'Folha usada:'}</strong>{' '}
                {folhas.usadas.map((u) => (folhas.junta ? `${u.folha} (${u.linhas})` : u.folha)).join(' · ')}
              </p>
              {folhas.ignoradas.length > 0 && (
                <p className="text-muted-foreground">
                  <strong>Ignoradas:</strong>{' '}
                  {folhas.ignoradas.map((i) => `${i.folha} — ${i.motivo}`).join(' · ')}
                </p>
              )}
            </div>
          )}

          {rows.length > 0 && !folhas?.junta && (
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
                {nBca > 0 && (
                  <Badge variant="outline" title="NIBs do BCA (0003…) não vão no ficheiro OIC — usa o gerador PS2">
                    {nBca} do BCA fora do ficheiro
                  </Badge>
                )}
                {Object.keys(edicoes).length > 0 && (
                  <Badge variant="outline" title="Corrigidas aqui; o Excel de origem não foi alterado">
                    {Object.keys(edicoes).length} editadas
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
                    const emEdicao = editando === t.ref;
                    const editada = t.ref in edicoes;
                    if (emEdicao) {
                      const aoTecla = (e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') guardarEdicao();
                        if (e.key === 'Escape') setEditando(null);
                      };
                      return (
                        <tr key={t.ref} className="border-t bg-muted/40">
                          <td className="p-2 tabular-nums whitespace-nowrap">{t.rotulo ?? t.ref}</td>
                          <td className="p-2">
                            <Input
                              autoFocus
                              value={rascunho.nome}
                              onChange={(e) => setRascunho((d) => ({ ...d, nome: e.target.value }))}
                              onKeyDown={aoTecla}
                              aria-label="Nome"
                              className="h-8"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={rascunho.nib}
                              onChange={(e) => setRascunho((d) => ({ ...d, nib: e.target.value }))}
                              onKeyDown={aoTecla}
                              aria-label="NIB"
                              inputMode="numeric"
                              className="h-8 font-mono text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={rascunho.montante}
                              onChange={(e) => setRascunho((d) => ({ ...d, montante: e.target.value }))}
                              onKeyDown={aoTecla}
                              aria-label="Montante"
                              inputMode="decimal"
                              className="h-8 text-right tabular-nums"
                            />
                          </td>
                          <td className="p-2 text-xs text-muted-foreground" />
                          <td className="p-2 text-xs text-muted-foreground">Enter guarda · Esc cancela</td>
                          <td className="p-2 text-right whitespace-nowrap">
                            <Button variant="ghost" size="icon" aria-label="Guardar a correção" onClick={guardarEdicao}>
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            {editada && (
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Repor o valor do ficheiro"
                                title="Repor o valor do ficheiro"
                                onClick={() => reporOriginal(t.ref)}
                              >
                                <Undo2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" aria-label="Cancelar" onClick={() => setEditando(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={t.ref} className={`border-t ${excl ? 'opacity-50' : ''}`}>
                        <td className="p-2 tabular-nums whitespace-nowrap">{t.rotulo ?? t.ref}</td>
                        <td className="p-2">
                          {t.nome}
                          {t.nome.length > 27 && (
                            <span className="ml-1 text-xs text-amber-600">(corta a 27)</span>
                          )}
                        </td>
                        <td className="p-2 font-mono text-xs">{t.nib ? nibEmGrupos(t.nib) : '—'}</td>
                        <td className="p-2 text-right tabular-nums">
                          {t.cents > 0 ? formatarCentimos(t.cents) : '—'}
                          {t.arredondado && (
                            <span className="ml-1 text-[10px] text-muted-foreground" title="Tinha casas decimais — arredondado a 0 casas (como o ARRED do Excel)">
                              ≈
                            </span>
                          )}
                        </td>
                        <td className="p-2">{t.descritivo}</td>
                        <td className="p-2">
                          {excl ? (
                            <span className="text-muted-foreground">excluída</span>
                          ) : t.erro ? (
                            <span className="text-destructive">{t.erro}</span>
                          ) : t.foraDoFicheiro ? (
                            <span className="text-muted-foreground">BCA — fora do ficheiro (vai pelo PS2)</span>
                          ) : (
                            <span className="text-green-600">ok</span>
                          )}
                          {editada && !excl && (
                            <span className="ml-2 text-xs text-primary" title="Corrigida aqui; o Excel de origem não foi alterado">
                              editada
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-right whitespace-nowrap">
                          {!excl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Editar a linha"
                              title={editada ? 'Editada — editar de novo' : 'Corrigir nome, NIB ou montante'}
                              onClick={() => abrirEdicao(t.ref)}
                            >
                              <Pencil className={`h-4 w-4 ${editada ? 'text-primary' : ''}`} />
                            </Button>
                          )}
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
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor="oic-nome-ficheiro" className="text-xs text-muted-foreground">
                  Nome do ficheiro
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    id="oic-nome-ficheiro"
                    value={nomeBase}
                    onChange={(e) => setNomeBase(e.target.value)}
                    className="w-56 font-mono text-xs"
                  />
                  <span className="text-xs text-muted-foreground">.txt</span>
                </div>
              </div>
              <Button onClick={descarregar}>
                <FileDown className="h-4 w-4 mr-1" /> Guardar ficheiro
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              A extensão é sempre .txt (não se muda). "Guardar ficheiro" abre o diálogo "Guardar como" do browser — escolhe a pasta aí.
            </p>
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
