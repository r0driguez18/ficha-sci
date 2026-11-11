import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ChevronRight, Download, FileSpreadsheet, Loader2, RefreshCw, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { guardarFicheiro } from '@/lib/guardarFicheiro';
import { excelDasAplicacoes, lerExcelAplicacoes, lerOperacoes, nomeExcelAplicacoes } from '@/lib/aplicacoesDia';
import {
  getAplicacoesDia,
  getUltimoPedido,
  pedirAplicacoesDia,
  registarAplicacoesManual,
  type AplicacoesDia,
  type PedidoAplicacoes,
} from '@/services/aplicacoesDiaService';

const fmt = (iso?: string | null) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('pt-PT');
  } catch {
    return iso;
  }
};

const MAX_ESPERA_MS = 3 * 60 * 1000;

/**
 * Aplicações do dia (core bancário) para a data da ficha: um botão pede ao worker que corra a query; o resultado fica
 * guardado, com o Excel para descarregar e a lista das operações reconhecidas. Sem worker, dá para carregar à mão o
 * Excel que o script gera. (Por agora só mostra: a tabela de Processamentos continua a ser preenchida como até aqui.)
 */
export const AplicacoesDiaCard: React.FC<{ data: string; disabled?: boolean }> = ({ data, disabled }) => {
  const [aplicacao, setAplicacao] = useState<AplicacoesDia | null>(null);
  const [pedido, setPedido] = useState<PedidoAplicacoes | null>(null);
  const [aEsperar, setAEsperar] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [aberta, setAberta] = useState(false);
  const inicioEspera = useRef(0);
  const input = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async () => {
    const [a, p] = await Promise.all([getAplicacoesDia(data), getUltimoPedido(data)]);
    setAplicacao(a.data);
    setPedido(p.data);
    return { aplicacao: a.data, pedido: p.data };
  }, [data]);

  useEffect(() => {
    setAplicacao(null);
    setPedido(null);
    setAEsperar(false);
    void carregar();
  }, [carregar]);

  // Enquanto o worker não responde, vai-se perguntando (de 2 em 2 s, no máximo 3 min).
  useEffect(() => {
    if (!aEsperar) return;
    const t = setInterval(async () => {
      const r = await carregar();
      const p = r.pedido;
      if (Date.now() - inicioEspera.current > MAX_ESPERA_MS) {
        setAEsperar(false);
        toast.error('O worker não respondeu. Confirma que está ligado (ou carrega o Excel à mão).');
      } else if (p && p.estado === 'concluido') {
        setAEsperar(false);
        toast.success('Aplicações do dia recebidas.');
      } else if (p && p.estado === 'erro') {
        setAEsperar(false);
        toast.error(p.erro || 'O worker não conseguiu ler o core.');
      }
    }, 2000);
    return () => clearInterval(t);
  }, [aEsperar, carregar]);

  const gerar = async () => {
    setBusy('gerar');
    try {
      const { data: p, error } = await pedirAplicacoesDia(data);
      if (error || !p) {
        toast.error(error?.message || 'Não foi possível pedir as aplicações.');
        return;
      }
      setPedido(p);
      inicioEspera.current = Date.now();
      setAEsperar(true);
    } finally {
      setBusy(null);
    }
  };

  const carregarExcel = async (f: File | undefined) => {
    if (!f) return;
    setBusy('excel');
    try {
      const { colunas, linhas } = await lerExcelAplicacoes(await f.arrayBuffer());
      const lido = lerOperacoes(linhas, data);
      if (lido.operacoes.length === 0) {
        toast.error(lido.avisos[0] ?? 'Este ficheiro não tem aplicações do core.');
        return;
      }
      const { error } = await registarAplicacoesManual(data, colunas, linhas);
      if (error) {
        toast.error(error.message || 'Não foi possível guardar o ficheiro.');
        return;
      }
      await carregar();
      toast.success(`${lido.operacoes.length} operações lidas do Excel.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível ler o Excel.');
    } finally {
      setBusy(null);
      if (input.current) input.current.value = '';
    }
  };

  const descarregar = async () => {
    if (!aplicacao) return;
    setBusy('baixar');
    try {
      const blob = await excelDasAplicacoes(aplicacao.colunas, aplicacao.linhas);
      await guardarFicheiro(blob, {
        sugestaoNome: nomeExcelAplicacoes(data),
        tipoMime: blob.type,
        extensao: '.xlsx',
        descricaoTipo: 'Excel',
        idPasta: 'aplicacoes',
      });
    } finally {
      setBusy(null);
    }
  };

  const leitura = useMemo(() => (aplicacao ? lerOperacoes(aplicacao.linhas, data) : null), [aplicacao, data]);
  const aCorrer = aEsperar || pedido?.estado === 'pendente' || pedido?.estado === 'a-correr';
  const pedidoComErro = pedido?.estado === 'erro' && (!aplicacao || pedido.pedido_em > aplicacao.gerado_em);

  return (
    <div className="mt-8 border-t pt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setAberta((a) => !a)}
          aria-expanded={aberta}
          className="flex items-center gap-1.5 text-base font-semibold text-foreground hover:text-primary"
        >
          <ChevronRight className="rodar-seta h-4 w-4" data-aberto={aberta} />
          Aplicações do dia (core)
          {leitura && <span className="text-sm font-normal text-muted-foreground">({leitura.operacoes.length} operações)</span>}
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={gerar} disabled={disabled || aCorrer || busy === 'gerar'} className="gap-1.5">
            {aCorrer || busy === 'gerar' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {aCorrer ? 'A gerar…' : aplicacao ? 'Gerar de novo' : 'Gerar aplicações do dia'}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => input.current?.click()} disabled={disabled || busy === 'excel'} className="gap-1.5" title="Sem worker: carrega o Excel que o script gera">
            {busy === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Carregar Excel
          </Button>
          <input ref={input} type="file" accept=".xlsx" className="hidden" onChange={(e) => void carregarExcel(e.target.files?.[0])} />
          {aplicacao && (
            <Button type="button" size="sm" variant="outline" onClick={descarregar} disabled={busy === 'baixar'} className="gap-1.5">
              <Download className="h-4 w-4" />
              Descarregar Excel
            </Button>
          )}
        </div>
      </div>

      {aCorrer && (
        <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin" />
          {pedido?.estado === 'a-correr' ? 'O worker está a ler o core…' : 'À espera do worker (costuma demorar poucos segundos)…'}
        </p>
      )}
      {pedidoComErro && (
        <p className="mb-2 flex items-center gap-2 text-sm text-destructive" role="alert">
          <AlertTriangle className="h-4 w-4" />
          Último pedido falhou: {pedido?.erro || 'erro desconhecido'}
        </p>
      )}
      {aplicacao ? (
        <p className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <FileSpreadsheet className="h-4 w-4" />
          Gerado em {fmt(aplicacao.gerado_em)}
          {aplicacao.gerado_por_nome ? ` por ${aplicacao.gerado_por_nome}` : ''}
          <Badge variant="outline">{aplicacao.origem === 'worker' ? 'Lido do core' : 'Excel carregado'}</Badge>
        </p>
      ) : (
        !aCorrer && <p className="text-sm text-muted-foreground">Ainda não há aplicações para {data}.</p>
      )}
      {leitura?.avisos.map((a) => (
        <p key={a} className="mb-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400" role="alert">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {a}
        </p>
      ))}

      {aberta && leitura && leitura.operacoes.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs uppercase">Hora</TableHead>
                <TableHead className="text-xs uppercase">Empresa</TableHead>
                <TableHead className="text-xs uppercase">Nome AS400</TableHead>
                <TableHead className="text-xs uppercase">Nº Operação</TableHead>
                <TableHead className="text-xs uppercase">Pedido por</TableHead>
                <TableHead className="text-right text-xs uppercase">Mov.</TableHead>
                <TableHead className="text-right text-xs uppercase">Aplic.</TableHead>
                <TableHead className="text-right text-xs uppercase">Pend.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leitura.operacoes.map((o) => (
                <TableRow key={o.nOperacao}>
                  <TableCell className="tabular-nums">{o.hora}</TableCell>
                  <TableCell>
                    {o.empresa} <span className="text-xs text-muted-foreground">#{o.seq}</span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{o.ficheiro}</TableCell>
                  <TableCell className="font-mono text-xs">{o.nOperacao}</TableCell>
                  <TableCell>{o.utilizador}</TableCell>
                  <TableCell className="text-right tabular-nums">{o.movimentos}</TableCell>
                  <TableCell className="text-right tabular-nums">{o.aplicados}</TableCell>
                  <TableCell className={`text-right tabular-nums ${o.pendentes > 0 ? 'font-semibold text-amber-600' : ''}`}>{o.pendentes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
