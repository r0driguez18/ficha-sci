import React, { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PinDialog } from '@/components/taskboard/PinDialog';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Copy, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { contarMovimentos, type Sentido } from '@/lib/verificacaoMovimentos';
import { editarLote, listarLotes, verificarLote, type Ps2Lote } from '@/services/ps2LotesService';
import { operatorHasPin, verifyOperatorPin } from '@/services/operatorPinService';
import { useCurrentOperator } from '@/hooks/useOperators';

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

const dataCurta = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '—';

async function copiar(texto: string, rotulo: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success(`${rotulo} copiado.`);
  } catch {
    toast.error('Não consegui copiar — seleciona e copia à mão.');
  }
}

function EstadoBadge({ l }: { l: Ps2Lote }) {
  if (l.estado === 'verificado') {
    return (
      <Badge variant="secondary" className="whitespace-nowrap">
        <CheckCircle2 className="mr-1 h-3 w-3" /> verificado
      </Badge>
    );
  }
  if (l.estado === 'problema') {
    return (
      <Badge variant="destructive" className="whitespace-nowrap">
        <AlertTriangle className="mr-1 h-3 w-3" /> com problema
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="whitespace-nowrap">
      por verificar
    </Badge>
  );
}

interface LinhaProps {
  lote: Ps2Lote;
  aberto: boolean;
  aAbrir: () => void;
  aoAlterado: () => void;
}

function LinhaLote({ lote, aberto, aAbrir, aoAlterado }: LinhaProps) {
  const operador = useCurrentOperator();
  const [empresa, setEmpresa] = useState(lote.empresa);
  const [sentido, setSentido] = useState<Sentido>(lote.sentido);
  const [texto, setTexto] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [pinAberto, setPinAberto] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);
  const tokenRef = useRef<string | null>(null);

  const porVerificar = lote.estado === 'por_verificar';
  const resultado = useMemo(
    () => contarMovimentos(texto, Number(lote.total), sentido),
    [texto, lote.total, sentido],
  );
  const temTexto = texto.trim() !== '';

  const guardarEdicao = async (novaEmpresa: string, novoSentido: Sentido) => {
    const r = await editarLote(lote.id, novaEmpresa, novoSentido);
    if (r.erro) toast.error(r.erro);
    else aoAlterado();
  };

  const pedirPin = async () => {
    if (resultado.contagem !== 1 && observacoes.trim() === '') {
      toast.error('Escreve uma observação: o resultado não é "um movimento".');
      return;
    }
    const tem = await operatorHasPin();
    if (tem === false) {
      toast.error('Ainda não tens PIN. Define-o em Configurações → PIN de assinatura.');
      return;
    }
    setPinAberto(true);
  };

  const confirmarPin = async (pin: string) => {
    const r = await verifyOperatorPin(pin);
    if (!r.token) return { ok: false, error: r.error ?? 'PIN incorreto.' };
    tokenRef.current = r.token;
    return { ok: true };
  };

  const concluir = async () => {
    const token = tokenRef.current;
    tokenRef.current = null;
    if (!token) return;
    setAGuardar(true);
    const r = await verificarLote(lote.id, token, resultado.contagem, observacoes.trim());
    setAGuardar(false);
    if (r.erro) {
      toast.error(r.erro);
      return;
    }
    toast.success('Verificação registada.');
    aoAlterado();
  };

  return (
    <>
      <TableRow className={aberto ? 'bg-muted/40' : undefined}>
        <TableCell className="w-8 p-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={aAbrir} aria-label="Abrir verificação">
            {aberto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </TableCell>
        <TableCell className="whitespace-nowrap text-xs">{lote.data_processamento}</TableCell>
        <TableCell className="min-w-[10rem]">
          <Input
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            onBlur={() => empresa.trim() !== lote.empresa && guardarEdicao(empresa, sentido)}
            placeholder="Empresa"
            className="h-8"
            aria-label="Empresa"
          />
        </TableCell>
        <TableCell className="font-mono text-xs">{lote.nome_ficheiro}</TableCell>
        <TableCell className="text-xs">{lote.tipo_operacao}</TableCell>
        <TableCell>
          <Select
            value={sentido}
            disabled={!porVerificar}
            onValueChange={(v) => {
              setSentido(v as Sentido);
              guardarEdicao(empresa, v as Sentido);
            }}
          >
            <SelectTrigger className="h-8 w-[7.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="debito">Débito</SelectItem>
              <SelectItem value="credito">Crédito</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          <button
            type="button"
            className="inline-flex items-center gap-1 font-mono text-xs hover:text-primary"
            title={`NIB ${lote.conta_empresa} — clica para copiar a conta`}
            onClick={() => copiar(contaCurta(lote.conta_empresa), 'Conta')}
          >
            {contaCurta(lote.conta_empresa)} <Copy className="h-3 w-3" />
          </button>
        </TableCell>
        <TableCell className="whitespace-nowrap text-right">
          <button
            type="button"
            className="inline-flex items-center gap-1 tabular-nums hover:text-primary"
            title="Clica para copiar o valor"
            onClick={() => copiar(valorParaCopiar(lote.total), 'Valor')}
          >
            {fmtValor(lote.total)} <Copy className="h-3 w-3" />
          </button>
          <div className="text-[10px] text-muted-foreground">{lote.n_registos} registos</div>
        </TableCell>
        <TableCell>
          <EstadoBadge l={lote} />
        </TableCell>
      </TableRow>

      {aberto && (
        <TableRow className="bg-muted/20">
          <TableCell />
          <TableCell colSpan={8} className="space-y-3 p-4">
            {!porVerificar ? (
              <div className="space-y-1 text-sm">
                <p>
                  {lote.estado === 'verificado' ? 'Verificado' : 'Registado com problema'} por{' '}
                  <strong>{lote.verificado_por_codigo ?? '—'}</strong> em {dataCurta(lote.verificado_em)} —{' '}
                  {lote.contagem} movimento(s) encontrado(s).
                </p>
                {lote.mesma_pessoa && (
                  <p className="text-amber-600">Verificado pela mesma pessoa que guardou o ficheiro.</p>
                )}
                {lote.observacoes && <p className="text-muted-foreground">Observação: {lote.observacoes}</p>}
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor={`mov-${lote.id}`}>
                    Movimentos da conta no core ({sentido === 'debito' ? 'débito' : 'crédito'} de{' '}
                    <strong>{fmtValor(lote.total)}</strong>)
                  </Label>
                  <Textarea
                    id={`mov-${lote.id}`}
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="No core, abre os movimentos da conta, seleciona o texto, copia e cola aqui."
                    className="min-h-[110px] font-mono text-xs"
                  />
                </div>

                {temTexto && (
                  <div className="space-y-2 text-sm">
                    {resultado.contagem === 1 && (
                      <p className="flex items-center gap-2 font-medium text-green-600">
                        <CheckCircle2 className="h-4 w-4" /> 1 movimento com este valor — certo.
                      </p>
                    )}
                    {resultado.contagem === 0 && (
                      <p className="flex items-center gap-2 font-medium text-destructive">
                        <AlertTriangle className="h-4 w-4" /> Nenhum movimento com este valor — em falta.
                      </p>
                    )}
                    {resultado.contagem >= 2 && (
                      <p className="flex items-center gap-2 font-medium text-amber-600">
                        <AlertTriangle className="h-4 w-4" /> {resultado.contagem} movimentos com este valor —
                        possível duplicado.
                      </p>
                    )}
                    {resultado.outroSentido > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {resultado.outroSentido} linha(s) com o valor mas no sentido contrário — não contam.
                      </p>
                    )}
                    {resultado.semIndicacaoDeSentido > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {resultado.semIndicacaoDeSentido} das linhas não traz D/C no texto: confirma o sentido no
                        core.
                      </p>
                    )}
                    {resultado.linhas.length > 0 && (
                      <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded border bg-background p-2 text-xs">
                        {resultado.linhas.join('\n')}
                      </pre>
                    )}
                  </div>
                )}

                {temTexto && resultado.contagem !== 1 && (
                  <div className="space-y-1.5">
                    <Label htmlFor={`obs-${lote.id}`}>Observação (obrigatória quando não é "um movimento")</Label>
                    <Input
                      id={`obs-${lote.id}`}
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="O que se passa? (ex.: aplicado duas vezes, falta o débito…)"
                    />
                  </div>
                )}

                <Button onClick={pedirPin} disabled={!temTexto || aGuardar}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {resultado.contagem === 1 ? 'Confirmar com PIN' : 'Registar com problema (PIN)'}
                </Button>
              </>
            )}
          </TableCell>
        </TableRow>
      )}

      <PinDialog
        open={pinAberto}
        onOpenChange={setPinAberto}
        mode="enter"
        operatorName={operador?.label ?? ''}
        title="Confirmar verificação"
        description={`Introduza o seu PIN para registar a verificação de ${lote.nome_ficheiro}${
          operador ? ` como ${operador.label}` : ''
        }.`}
        onConfirm={confirmarPin}
        onSuccess={concluir}
      />
    </>
  );
}

export default function VerificacaoFicheiros() {
  const queryClient = useQueryClient();
  const [soPorVerificar, setSoPorVerificar] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [aberto, setAberto] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['ps2-lotes', soPorVerificar],
    queryFn: async () => {
      const r = await listarLotes({ soPorVerificar });
      if (r.erro) throw new Error(r.erro);
      return r.lotes;
    },
    refetchInterval: 60_000,
  });

  const lotes = useMemo(() => {
    const t = pesquisa.trim().toLowerCase();
    const todos = q.data ?? [];
    if (!t) return todos;
    return todos.filter(
      (l) =>
        l.empresa.toLowerCase().includes(t) ||
        l.nome_ficheiro.toLowerCase().includes(t) ||
        l.conta_empresa.includes(t) ||
        contaCurta(l.conta_empresa).includes(t),
    );
  }, [q.data, pesquisa]);

  const repetidos = useMemo(() => {
    const cont = new Map<string, number>();
    for (const l of q.data ?? []) cont.set(l.hash_ficheiro, (cont.get(l.hash_ficheiro) ?? 0) + 1);
    return new Set([...cont.entries()].filter(([, n]) => n > 1).map(([h]) => h));
  }, [q.data]);

  return (
    <PageContainer size="wide">
      <PageHeader
        title="Verificação de ficheiros"
        subtitle="Os ficheiros PS2 guardados no gerador: confere o débito/crédito no core e assina com o PIN"
      />

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
            placeholder="Procurar por empresa, ficheiro ou conta…"
            className="max-w-sm"
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
                <TableHead className="w-8" />
                <TableHead>Data</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Ficheiro</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Sentido</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.isLoading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-sm text-muted-foreground">
                    A carregar…
                  </TableCell>
                </TableRow>
              )}
              {!q.isLoading && lotes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    {soPorVerificar
                      ? 'Nada por verificar. Os ficheiros aparecem aqui quando são guardados no gerador PS2.'
                      : 'Ainda não há ficheiros registados.'}
                  </TableCell>
                </TableRow>
              )}
              {lotes.map((l) => (
                <React.Fragment key={l.id}>
                  <LinhaLote
                    lote={l}
                    aberto={aberto === l.id}
                    aAbrir={() => setAberto(aberto === l.id ? null : l.id)}
                    aoAlterado={() => queryClient.invalidateQueries({ queryKey: ['ps2-lotes'] })}
                  />
                  {repetidos.has(l.hash_ficheiro) && (
                    <TableRow className="border-0">
                      <TableCell />
                      <TableCell colSpan={8} className="pb-2 pt-0 text-[11px] text-amber-600">
                        ↑ repetido: este conteúdo já foi guardado noutro registo.
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
