import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ChevronRight, Download, FileSpreadsheet, Loader2, RefreshCw, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { guardarFicheiro } from '@/lib/guardarFicheiro';
import { ZonaLargarFicheiro } from '@/components/ZonaLargarFicheiro';
import {
  chaveDaOperacao,
  diaSeguinte,
  excelDasOperacoes,
  janelaDaFicha,
  juntarOperacoes,
  lerExcelAplicacoes,
  lerOperacoes,
  nomeExcelAplicacoes,
  operacoesDeDc,
  selecionarOperacoes,
  situacaoDoPedido,
  type RegistoDc,
} from '@/lib/aplicacoesDia';
import {
  getAplicacoesDia,
  getCopiaDc,
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

/**
 * Aplicações do dia (core bancário) para a data da ficha: um botão pede ao worker que corra a query; o resultado fica
 * guardado, com o Excel para descarregar e a lista das operações reconhecidas. Sem worker, dá para carregar à mão o
 * Excel que o script gera. (Por agora só mostra: a tabela de Processamentos continua a ser preenchida como até aqui.)
 */
export const AplicacoesDiaCard: React.FC<{ data: string; disabled?: boolean; operadores?: string[]; embutido?: boolean }> = ({ data, disabled, operadores, embutido }) => {
  const [aplicacao, setAplicacao] = useState<AplicacoesDia | null>(null);
  const [pedido, setPedido] = useState<PedidoAplicacoes | null>(null);
  const [dc, setDc] = useState<RegistoDc[]>([]); // os DC guardados pelo worker (cópia da GBAPL), dias D e D+1
  const [busy, setBusy] = useState<string | null>(null);
  const [aberta, setAberta] = useState(!!embutido); // embutido numa janela (Histórico): já vem aberto
  const input = useRef<HTMLInputElement>(null);
  const estadoAnterior = useRef<string | null>(null);

  const carregar = useCallback(async () => {
    const [a, p, d] = await Promise.all([getAplicacoesDia(data), getUltimoPedido(data), getCopiaDc([data, diaSeguinte(data)])]);
    setAplicacao(a.data);
    setPedido(p.data);
    setDc(d.data);
    return { aplicacao: a.data, pedido: p.data };
  }, [data]);

  useEffect(() => {
    setAplicacao(null);
    setPedido(null);
    setDc([]);
    estadoAnterior.current = null;
    void carregar();
  }, [carregar]);

  const situacao = pedido ? situacaoDoPedido(pedido) : null;
  const aCorrer = situacao === 'a-esperar-worker' || situacao === 'worker-a-ler';
  const semResposta = situacao === 'sem-resposta' && (!aplicacao || (pedido?.pedido_em ?? '') > aplicacao.gerado_em);

  // Enquanto há um pedido à espera do worker, vai-se perguntando de 2 em 2 s (também depois de sair e entrar de novo).
  // Pára sozinho quando o pedido termina ou passa o prazo (3 min), e o botão volta a estar disponível.
  useEffect(() => {
    if (!aCorrer) return;
    const t = setInterval(() => void carregar(), 2000);
    return () => clearInterval(t);
  }, [aCorrer, carregar]);

  // Avisos quando o pedido muda de estado (só se o víamos a correr).
  useEffect(() => {
    if (!pedido) return;
    const antes = estadoAnterior.current;
    estadoAnterior.current = pedido.estado;
    if (antes !== 'pendente' && antes !== 'a-correr') return;
    if (pedido.estado === 'concluido') toast.success('Aplicações do dia recebidas.');
    else if (pedido.estado === 'erro') toast.error(pedido.erro || 'O worker não conseguiu ler o core.');
  }, [pedido]);

  const gerar = async () => {
    setBusy('gerar');
    try {
      const { data: p, error } = await pedirAplicacoesDia(data);
      if (error || !p) {
        toast.error(error?.message || 'Não foi possível pedir as aplicações.');
        return;
      }
      estadoAnterior.current = p.estado;
      setPedido(p);
    } finally {
      setBusy(null);
    }
  };

  const carregarExcel = async (f: File | undefined) => {
    if (!f) return;
    setBusy('excel');
    try {
      const { colunas, linhas } = await lerExcelAplicacoes(await f.arrayBuffer());
      const lido = lerOperacoes(linhas);
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
    if (!temDados) return;
    setBusy('baixar');
    try {
      const blob = await excelDasOperacoes(filtradas);
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

  const leitura = useMemo(() => (aplicacao ? lerOperacoes(aplicacao.linhas) : null), [aplicacao, data]);
  // Duas fontes: o registo de ficheiros processados (tudo menos DC) e a cópia da GBAPL (só DC, com nº de operação).
  const todas = useMemo(() => juntarOperacoes(leitura?.operacoes ?? [], operacoesDeDc(dc)), [leitura, dc]);
  const temDados = !!aplicacao || dc.length > 0;
  const dcDoDia = dc.filter((r) => r.data === data).length;
  // Só as operações da janela da ficha (07:00 → 07:00), dos operadores e já aplicadas (SISP, quem não é operador e as
  // validações — 0 aplicados — não entram no Excel).
  const { selecionadas: filtradas, deOutros, validacoes, foraDaJanela, aviso: avisoJanela } = useMemo(
    () => selecionarOperacoes(todas, data, operadores),
    [todas, data, operadores],
  );
  const pedidoComErro = pedido?.estado === 'erro' && (!aplicacao || pedido.pedido_em > aplicacao.gerado_em);

  return (
    <ZonaLargarFicheiro extensoes={['.xlsx']} disabled={disabled || busy === 'excel'} onFicheiros={([f]) => void carregarExcel(f)} texto="Larga aqui o Excel das aplicações" className={embutido ? undefined : 'mt-8'}>
    <div className={embutido ? undefined : 'border-t pt-6'}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setAberta((a) => !a)}
          aria-expanded={aberta}
          className="flex items-center gap-1.5 text-base font-semibold text-foreground hover:text-primary"
        >
          <ChevronRight className="rodar-seta h-4 w-4" data-aberto={aberta} />
          Aplicações do dia (core)
          {temDados && <span className="text-sm font-normal text-muted-foreground">({filtradas.length} operações)</span>}
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={gerar} disabled={disabled || aCorrer || busy === 'gerar'} className="gap-1.5">
            {aCorrer || busy === 'gerar' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {aCorrer ? 'A gerar…' : aplicacao ? 'Gerar de novo' : 'Gerar aplicações do dia'}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => input.current?.click()} disabled={disabled || busy === 'excel'} className="gap-1.5" title="Sem worker: carrega o Excel do registo de ficheiros processados">
            {busy === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Carregar Excel
          </Button>
          <input ref={input} type="file" accept=".xlsx" className="hidden" onChange={(e) => void carregarExcel(e.target.files?.[0])} />
          {temDados && (
            <Button type="button" size="sm" variant="outline" onClick={descarregar} disabled={busy === 'baixar' || filtradas.length === 0} className="gap-1.5">
              <Download className="h-4 w-4" />
              Descarregar Excel
            </Button>
          )}
        </div>
      </div>

      {aCorrer && (
        <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin" />
          {situacao === 'worker-a-ler' ? 'O worker está a ler o core…' : 'À espera do worker (costuma demorar poucos segundos; desiste ao fim de 3 min)…'}
        </p>
      )}
      {semResposta && (
        <p className="mb-2 flex items-start gap-2 text-sm text-destructive" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Ninguém respondeu ao pedido de {fmt(pedido?.pedido_em)}: o worker não está a correr (ou não chega à app). Vê se o
            programa está ligado no PC (ficheiro worker.log), ou usa «Carregar Excel». Podes voltar a carregar em «Gerar».
          </span>
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
        !aCorrer && !temDados && <p className="text-sm text-muted-foreground">Ainda não há aplicações para {data}.</p>
      )}
      {temDados && !aCorrer && dcDoDia === 0 && (
        <p className="mb-2 flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Não há DC (débitos/créditos por lotes) guardados para {data}. O worker copia-os de 10 em 10 minutos: se esteve
            desligado nesse dia, ou se não houve DC, não aparecem aqui. O resto dos processamentos vem do registo de ficheiros.
          </span>
        </p>
      )}
      {avisoJanela && (
        <p className="mb-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400" role="alert">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {avisoJanela}
        </p>
      )}
      {validacoes.length > 0 && (
        <p className="mb-2 text-xs text-muted-foreground">
          {validacoes.length} ficheiro{validacoes.length === 1 ? '' : 's'} só validado{validacoes.length === 1 ? '' : 's'} (sem aplicar) não entra{validacoes.length === 1 ? '' : 'm'} no Excel: só as aplicações.
        </p>
      )}
      {foraDaJanela.length > 0 && (
        <p className="mb-2 text-xs text-muted-foreground">
          {foraDaJanela.length} operaç{foraDaJanela.length === 1 ? 'ão' : 'ões'} fora da janela desta ficha ({janelaDaFicha(data).inicio} a{' '}
          {janelaDaFicha(data).fim}) não entram: são de outra ficha.
        </p>
      )}
      {leitura?.avisos.map((a) => (
        <p key={a} className="mb-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400" role="alert">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {a}
        </p>
      ))}

      {deOutros.length > 0 && (
        <p className="mb-2 text-xs text-muted-foreground">
          {deOutros.length} operaç{deOutros.length === 1 ? 'ão' : 'ões'} de outros utilizadores do core (
          {[...new Set(deOutros.map((o) => o.utilizador))].join(', ')}) não entram no Excel nem na lista.
        </p>
      )}
      {aberta && temDados && filtradas.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs uppercase">Data</TableHead>
                <TableHead className="text-xs uppercase">Hora</TableHead>
                <TableHead className="text-xs uppercase">Nome AS400</TableHead>
                <TableHead className="text-xs uppercase">Referência</TableHead>
                <TableHead className="text-xs uppercase">Módulo</TableHead>
                <TableHead className="text-xs uppercase">Processado por</TableHead>
                <TableHead className="text-xs uppercase">Nº ordem</TableHead>
                <TableHead className="text-xs uppercase">Empresa</TableHead>
                <TableHead className="text-xs uppercase">Nº operação</TableHead>
                <TableHead className="text-right text-xs uppercase">Mov. / aplic.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((o) => (
                <TableRow key={chaveDaOperacao(o)}>
                  <TableCell className="tabular-nums">{o.data}</TableCell>
                  <TableCell className="tabular-nums">{o.hora}</TableCell>
                  <TableCell className="font-mono text-xs">{o.ficheiro || '—'}</TableCell>
                  <TableCell>{o.referencia}</TableCell>
                  <TableCell>{o.modulo}</TableCell>
                  <TableCell>{o.utilizador}</TableCell>
                  <TableCell className="font-mono text-xs">{o.nOrdem || '—'}</TableCell>
                  <TableCell>{o.empresa || '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{o.nOperacao || '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{o.nOperacao ? `${o.movimentos ?? 0} / ${o.aplicados ?? 0}` : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
    </ZonaLargarFicheiro>
  );
};
