import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ChevronRight, Download, FileSpreadsheet, ListPlus, Loader2, RefreshCw, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { linhasParaTabela } from '@/lib/tabelaProcessamentos';
import type { TaskTableRow } from '@/types/taskTableRow';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { guardarFicheiro } from '@/lib/guardarFicheiro';
import { useAuth } from '@/components/auth/AuthProvider';
import { cobrancasParaRetorno, ROTULO_TIPO, tipoDaOperacao } from '@/lib/cobrancasDc';
import { createCobrancaRetorno } from '@/services/cobrancasRetornoService';
import { ZonaLargarFicheiro } from '@/components/ZonaLargarFicheiro';
import {
  chaveDaOperacao,
  diaSeguinte,
  excelDasOperacoes,
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
interface Props {
  data: string;
  disabled?: boolean;
  operadores?: string[];
  embutido?: boolean;
  /** As linhas que a tabela de Processamentos já tem (para não repetir o que está escrito à mão). */
  tabela?: TaskTableRow[];
  /** Acrescenta linhas à tabela de Processamentos da ficha. Sem isto o cartão só mostra (como no Histórico). */
  onPreencherTabela?: (linhas: Omit<TaskTableRow, 'id'>[]) => void;
}

export const AplicacoesDiaCard: React.FC<Props> = ({ data, disabled, operadores, embutido, tabela, onPreencherTabela }) => {
  const [aplicacao, setAplicacao] = useState<AplicacoesDia | null>(null);
  const [pedido, setPedido] = useState<PedidoAplicacoes | null>(null);
  const { user } = useAuth();
  const [criarRetornos, setCriarRetornos] = useState(false); // ligado quando um pedido acaba de ser concluído aqui
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
    if (pedido.estado === 'concluido') {
      toast.success('Aplicações do dia recebidas.');
      // Só ao gerar nesta ficha (não ao abrir o Histórico de um dia antigo): evita criar retornos já em atraso.
      if (!embutido && !disabled) setCriarRetornos(true);
    }
    else if (pedido.estado === 'erro') toast.error(pedido.erro || 'O worker não conseguiu ler o core.');
  }, [pedido]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const { selecionadas: filtradas, aviso: avisoJanela } = useMemo(
    () => selecionarOperacoes(todas, data, operadores),
    [todas, data, operadores],
  );
  /** Junta à tabela de Processamentos as operações que ainda lá não estão (o que foi escrito à mão não se repete). */
  const preencherTabela = useCallback(
    (silencioso: boolean) => {
      if (!onPreencherTabela) return;
      const { novas, jaExistiam } = linhasParaTabela(filtradas, tabela ?? [], operadores ?? []);
      if (novas.length > 0) onPreencherTabela(novas);
      if (novas.length > 0) {
        toast.success(
          `${novas.length} processamento${novas.length === 1 ? '' : 's'} acrescentado${novas.length === 1 ? '' : 's'} à tabela de Processamentos` +
            (jaExistiam > 0 ? ` (${jaExistiam} já lá estava${jaExistiam === 1 ? '' : 'm'}).` : '.'),
        );
      } else if (!silencioso) {
        toast.info(filtradas.length === 0 ? 'Não há processamentos para acrescentar.' : 'A tabela já tem todos estes processamentos.');
      }
    },
    [filtradas, tabela, operadores, onPreencherTabela],
  );

  // Cobranças aplicadas (empresas da lista; validações não): criam o retorno logo que aparecem, sem esperar pela exportação
  // da ficha. Repetir não duplica: a base de dados só aceita um retorno por ficheiro e data.
  useEffect(() => {
    if (!criarRetornos) return;
    setCriarRetornos(false);
    preencherTabela(true);
    const nomes = cobrancasParaRetorno(filtradas);
    if (nomes.length === 0 || !user?.id) return;
    void (async () => {
      let criados = 0;
      let falhas = 0;
      for (const nome of nomes) {
        try {
          const r = await createCobrancaRetorno(user.id, data, nome);
          if (r.error) falhas++;
          else if (r.data) criados++;
        } catch {
          falhas++;
        }
      }
      if (criados > 0) {
        toast.success(`${criados} retorno${criados === 1 ? '' : 's'} de cobrança registado${criados === 1 ? '' : 's'}: já aparece${criados === 1 ? '' : 'm'} em Retornos de Cobranças.`);
        window.dispatchEvent(new Event('update-returns-badge'));
      }
      if (falhas > 0) toast.error(`${falhas} retorno(s) de cobrança não foram registados — confirma em Retornos de Cobranças.`);
    })();
  }, [criarRetornos, filtradas, user?.id, data, preencherTabela]);

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
          {temDados && onPreencherTabela && !disabled && (
            <Button type="button" size="sm" variant="outline" onClick={() => preencherTabela(false)} disabled={filtradas.length === 0} className="gap-1.5" title="Acrescenta à tabela de Processamentos o que ainda lá não está">
              <ListPlus className="h-4 w-4" />
              Preencher tabela
            </Button>
          )}
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
      {leitura?.avisos.map((a) => (
        <p key={a} className="mb-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400" role="alert">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {a}
        </p>
      ))}

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
                <TableHead className="text-xs uppercase">Empresa</TableHead>
                <TableHead className="text-xs uppercase">Nº operação</TableHead>
                <TableHead className="text-xs uppercase">Tipo</TableHead>
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
                  <TableCell>{o.empresa || '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{o.nOperacao || '—'}</TableCell>
                  <TableCell>{ROTULO_TIPO[tipoDaOperacao(o)]}</TableCell>
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
