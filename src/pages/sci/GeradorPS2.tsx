import React, { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, FileDown, AlertTriangle, ClipboardPaste } from 'lucide-react';
import { toast } from 'sonner';
import {
  gerarPS2,
  montarNib,
  nomeFicheiroPS2,
  TIPOS_OPERACAO,
  type PS2Resultado,
} from '@/lib/ps2';

interface Linha {
  contaBenef: string;
  valor: string;
  nome: string;
}

const linhaVazia = (): Linha => ({ contaBenef: '', valor: '', nome: '' });
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function GeradorPS2() {
  const [contaEmpresa, setContaEmpresa] = useState('');
  const [data, setData] = useState(todayIso());
  const [referencia, setReferencia] = useState('');
  const [prefixo, setPrefixo] = useState('');
  const [tipo, setTipo] = useState<string>(TIPOS_OPERACAO[0]);
  const [linhas, setLinhas] = useState<Linha[]>([linhaVazia(), linhaVazia(), linhaVazia()]);
  const [colar, setColar] = useState('');
  const [resultado, setResultado] = useState<PS2Resultado | null>(null);

  const setLinha = (i: number, patch: Partial<Linha>) =>
    setLinhas((prev) => prev.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const addLinha = () => setLinhas((prev) => [...prev, linhaVazia()]);
  const removerLinha = (i: number) =>
    setLinhas((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : prev));

  const importarColagem = () => {
    const novas = colar
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [contaBenef = '', valor = '', nome = ''] = l.split(/\t|;/).map((c) => c.trim());
        return { contaBenef, valor, nome };
      });
    if (novas.length === 0) {
      toast.error('Nada para importar. Cole linhas do Excel (conta, valor, nome).');
      return;
    }
    setLinhas(novas);
    setColar('');
    toast.success(`${novas.length} linha(s) importada(s).`);
  };

  const gerar = () => {
    const res = gerarPS2({
      tipo,
      nibEmpresa: montarNib(contaEmpresa),
      data,
      referenciaOrdenante: referencia,
      linhas: linhas
        .filter((l) => l.contaBenef.trim() !== '' || l.valor.trim() !== '')
        .map((l) => ({
          nib: montarNib(l.contaBenef),
          valor: l.valor,
          descritivo: `${prefixo} ${l.nome}`.trim(),
        })),
    });
    setResultado(res);
    if (res.erros.length === 0) toast.success(`Ficheiro PS2 pronto — ${res.totalRegistos} registos.`);
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

  const nibEmpresaPreview = useMemo(
    () => (contaEmpresa.trim() ? montarNib(contaEmpresa) : '—'),
    [contaEmpresa],
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <PageHeader
        title="Gerador PS2"
        subtitle="Gera o ficheiro PS2 de pagamentos em massa (mesma lógica da folha Excel)"
      />

      {/* Cabeçalho */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Dados do ordenante</CardTitle>
          <CardDescription>NIB da empresa montado: <code>{nibEmpresaPreview}</code></CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contaEmpresa">Nº de conta da empresa</Label>
            <Input
              id="contaEmpresa"
              value={contaEmpresa}
              onChange={(e) => setContaEmpresa(e.target.value)}
              placeholder="dígitos da conta (como na folha, célula B8)"
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

      {/* Linhas */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Beneficiários</CardTitle>
          <Button size="sm" variant="outline" onClick={addLinha}>
            <Plus className="h-4 w-4 mr-1" /> Linha
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº conta</TableHead>
                <TableHead className="w-40">Valor</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((l, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Input
                      value={l.contaBenef}
                      onChange={(e) => setLinha(i, { contaBenef: e.target.value })}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={l.valor}
                      onChange={(e) => setLinha(i, { valor: e.target.value })}
                      className="h-8"
                      inputMode="decimal"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={l.nome}
                      onChange={(e) => setLinha(i, { nome: e.target.value })}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removerLinha(i)}
                      aria-label={`Remover linha ${i + 1}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">Colar do Excel</summary>
            <div className="mt-2 space-y-2">
              <Textarea
                value={colar}
                onChange={(e) => setColar(e.target.value)}
                placeholder="Uma linha por beneficiário: nº conta [tab] valor [tab] nome"
                className="min-h-[90px] font-mono text-xs"
              />
              <Button size="sm" variant="secondary" onClick={importarColagem}>
                <ClipboardPaste className="h-4 w-4 mr-1" /> Importar (substitui a tabela)
              </Button>
            </div>
          </details>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={gerar}>Gerar ficheiro PS2</Button>
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
              <AlertTriangle className="h-4 w-4" /> {resultado.erros.length} erro(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm space-y-1">
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
            <CardTitle className="text-base">Pré-visualização</CardTitle>
            <Badge variant="secondary">{resultado.totalRegistos} registos</Badge>
            <Badge variant="outline">total {Math.trunc(resultado.somaTotal)}</Badge>
            {resultado.linhasIgnoradas > 0 && (
              <Badge variant="outline">{resultado.linhasIgnoradas} linha(s) vazia(s) ignorada(s)</Badge>
            )}
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs leading-relaxed">
              {resultado.conteudo}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
