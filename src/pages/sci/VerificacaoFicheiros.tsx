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
import { toast } from 'sonner';
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

/** A conta como o operador a conhece: o NIB sem o banco/balcão ("00030000" + conta + natureza). */
const contaCurta = (nib: string) => (nib.length === 21 ? nib.slice(8) : nib);

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
  const [soPorVerificar, setSoPorVerificar] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  /** Ficheiros marcados nesta sessão: ficam visíveis (esbatidos) até se recarregar a página. */
  const [marcadosAgora, setMarcadosAgora] = useState<Set<string>>(new Set());
  const [aGravar, setAGravar] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['ps2-lotes'],
    queryFn: async () => {
      const r = await listarLotes({ limite: 300 });
      if (r.erro) throw new Error(r.erro);
      return r.lotes;
    },
    refetchInterval: 60_000,
  });

  const lotes = useMemo(() => {
    const t = pesquisa.trim().toLowerCase();
    return (q.data ?? [])
      .filter((l) => !soPorVerificar || l.estado !== 'verificado' || marcadosAgora.has(l.id))
      .filter(
        (l) =>
          !t ||
          l.nome_ficheiro.toLowerCase().includes(t) ||
          l.conta_empresa.includes(t) ||
          contaCurta(l.conta_empresa).includes(t),
      );
  }, [q.data, pesquisa, soPorVerificar, marcadosAgora]);

  const repetidos = useMemo(() => {
    const cont = new Map<string, number>();
    for (const l of q.data ?? []) cont.set(l.hash_ficheiro, (cont.get(l.hash_ficheiro) ?? 0) + 1);
    return new Set([...cont.entries()].filter(([, n]) => n > 1).map(([h]) => h));
  }, [q.data]);

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

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="so-por-verificar"
              checked={soPorVerificar}
              onCheckedChange={(v) => setSoPorVerificar(v === true)}
            />
            <Label htmlFor="so-por-verificar">Só por verificar</Label>
          </div>
          <Input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="max-w-sm"
            aria-label="Procurar por ficheiro ou conta"
          />
          <span className="text-xs text-muted-foreground">{lotes.length} ficheiro(s)</span>
        </CardContent>
      </Card>

      {repetidos.size > 0 && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Há ficheiros guardados mais de uma vez com exatamente o mesmo conteúdo (marcados "repetido"). Confirma que
            só foram aplicados uma vez.
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
                <TableHead className="w-24">Verificado</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Empresa / ficheiro</TableHead>
                <TableHead title="O que o core deve mostrar na conta da empresa: um débito (salários, pagamentos) ou um crédito (cobranças)">
                  Na conta da empresa
                </TableHead>
                <TableHead>Conta</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Quem verificou</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">
                    A carregar…
                  </TableCell>
                </TableRow>
              )}
              {!q.isLoading && lotes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    {soPorVerificar
                      ? 'Nada por verificar. Os ficheiros aparecem aqui quando são guardados no gerador PS2.'
                      : 'Ainda não há ficheiros registados.'}
                  </TableCell>
                </TableRow>
              )}
              {lotes.map((l) => {
                const feito = l.estado === 'verificado';
                return (
                  <TableRow key={l.id} className={feito ? 'bg-muted/30' : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={feito}
                        disabled={aGravar === l.id}
                        onCheckedChange={() => alternar(l)}
                        aria-label={`Verificado: ${l.nome_ficheiro}`}
                        className="h-5 w-5"
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{l.data_processamento}</TableCell>
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
                        {repetidos.has(l.hash_ficheiro) && (
                          <span className="ml-2 text-amber-600">repetido: mesmo conteúdo guardado antes</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {l.sentido === 'credito' ? 'Crédito' : 'Débito'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-mono text-xs hover:text-primary"
                        title={`NIB ${l.conta_empresa} — clica para copiar a conta`}
                        onClick={() => copiar(contaCurta(l.conta_empresa), 'Conta')}
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
    </PageContainer>
  );
}
