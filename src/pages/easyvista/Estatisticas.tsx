import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, FileSpreadsheet, FileText, BarChart3, ChevronRight } from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { getFileProcesses, type FileProcess } from '@/services/fileProcessService';
import { buildMonthlyStats, defaultRange, filterByRange } from '@/lib/processStats';
import { useOperators } from '@/hooks/useOperators';
import ProcessesTable from '@/components/charts/ProcessesTable';
import ProcessesBarChart from '@/components/charts/ProcessesBarChart';

type TabKey = 'all' | 'salary' | 'cobrancas' | 'compensacao' | 'outros';
const TABS: TabKey[] = ['all', 'salary', 'cobrancas', 'compensacao', 'outros'];
const TIPOS_CONHECIDOS = ['salario', 'cobrancas', 'compensacao'];

const TAB_TITLES: Record<TabKey, string> = {
  all: 'Todos os Processamentos',
  salary: 'Processamentos de Salário',
  cobrancas: 'Cobranças',
  compensacao: 'Compensação',
  outros: 'Outros',
};

const EasyVistaEstatisticas = () => {
  const { labelOf } = useOperators();
  const [allProcesses, setAllProcesses] = useState<FileProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState(() => defaultRange());
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const detalheRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (TABS.includes(hash as TabKey)) {
      setActiveTab(hash as TabKey);
    }
  }, []);

  const loadData = async (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setLoading(true);
    try {
      const processes = await getFileProcesses();
      setAllProcesses(processes as FileProcess[]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData({ silent: true });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabKey);
    window.location.hash = value;
  };

  // As bibliotecas de exportação (xlsx / jspdf-autotable) só carregam ao exportar.
  const handleExport = async (kind: 'xlsx' | 'pdf') => {
    try {
      const mod = await import('@/lib/exportProcesses');
      // A exportação respeita o intervalo escolhido (está no mesmo cartão do
      // filtro) — a lista completa fica na tabela de detalhe.
      if (kind === 'xlsx') mod.exportProcessesXlsx(exportList, currentTitle, labelOf);
      else mod.exportProcessesPdf(exportList, currentTitle, labelOf);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Não foi possível gerar o ficheiro.');
    }
  };

  // As listas do detalhe respeitam o intervalo escolhido: o número do cartão e as linhas da tabela são os mesmos.
  const noPeriodo = useMemo(() => filterByRange(allProcesses, range.from, range.to), [allProcesses, range.from, range.to]);
  const salaryProcesses = useMemo(() => noPeriodo.filter((p) => p.tipo === 'salario'), [noPeriodo]);
  const cobrancasProcesses = useMemo(() => noPeriodo.filter((p) => p.tipo === 'cobrancas'), [noPeriodo]);
  const compensacaoProcesses = useMemo(() => noPeriodo.filter((p) => p.tipo === 'compensacao'), [noPeriodo]);
  const outrosProcesses = useMemo(() => noPeriodo.filter((p) => !TIPOS_CONHECIDOS.includes(p.tipo ?? '')), [noPeriodo]);

  const monthly = useMemo(
    () => buildMonthlyStats(allProcesses, range.from, range.to),
    [allProcesses, range.from, range.to],
  );

  // Totais do período (soma dos meses no intervalo).
  const periodTotals = useMemo(
    () =>
      monthly.reduce(
        (acc, m) => ({
          total: acc.total + m.total,
          salario: acc.salario + m.salario,
          cobrancas: acc.cobrancas + m.cobrancas,
          compensacao: acc.compensacao + m.compensacao,
          outros: acc.outros + m.outros,
        }),
        { total: 0, salario: 0, cobrancas: 0, compensacao: 0, outros: 0 },
      ),
    [monthly],
  );

  const tabData: Record<TabKey, FileProcess[]> = {
    all: noPeriodo,
    salary: salaryProcesses,
    cobrancas: cobrancasProcesses,
    compensacao: compensacaoProcesses,
    outros: outrosProcesses,
  };
  const currentTitle = TAB_TITLES[activeTab];
  // A exportação leva o que se está a ver: o separador escolhido, dentro do intervalo.
  const exportList = tabData[activeTab];

  /** Clicar num cartão mostra por baixo os processamentos que o compõem. */
  const abrirDetalhe = (tab: TabKey) => {
    handleTabChange(tab);
    window.requestAnimationFrame(() => detalheRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <PageContainer size="wide" className="space-y-6">
      <PageHeader
        title="Estatísticas de Processamentos"
        subtitle="Evolução mensal e detalhe dos processamentos de ficheiros"
        id="estatisticas-page"
      >
        <Button variant="outline" onClick={handleRefresh} disabled={loading || refreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </PageHeader>

      {loading ? (
        <LoadingState label="A carregar processamentos…" />
      ) : allProcesses.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Sem processamentos registados"
          hint="Regista processamentos de ficheiros na Ficha de Procedimentos para os veres aqui."
        />
      ) : (
        <div className="space-y-6">
          {/* Filtro de intervalo + exportação */}
          <Card>
            <CardContent className="flex flex-wrap items-end gap-4 pt-6">
              <div className="space-y-1.5">
                <Label htmlFor="range-from">De</Label>
                <Input
                  id="range-from"
                  type="date"
                  value={range.from}
                  max={range.to}
                  onChange={(e) =>
                    setRange((r) => {
                      const from = e.target.value;
                      return { from, to: r.to && from > r.to ? from : r.to };
                    })
                  }
                  className="w-[10rem]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="range-to">Até</Label>
                <Input
                  id="range-to"
                  type="date"
                  value={range.to}
                  min={range.from}
                  onChange={(e) =>
                    setRange((r) => {
                      const to = e.target.value;
                      return { from: r.from && to < r.from ? to : r.from, to };
                    })
                  }
                  className="w-[10rem]"
                />
              </div>
              <Button variant="ghost" size="sm" onClick={() => setRange(defaultRange())}>
                Últimos 6 meses
              </Button>

              <div className="ml-auto flex items-end gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleExport('xlsx')}
                  disabled={exportList.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  XLSX
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleExport('pdf')}
                  disabled={exportList.length === 0}
                >
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cartões de contagem (no período): clicar mostra os processamentos por baixo */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {([
              { tab: 'all', label: 'Total no período', value: periodTotals.total },
              { tab: 'salary', label: 'Salário', value: periodTotals.salario },
              { tab: 'cobrancas', label: 'Cobranças', value: periodTotals.cobrancas },
              { tab: 'compensacao', label: 'Compensação', value: periodTotals.compensacao },
              { tab: 'outros', label: 'Outros', value: periodTotals.outros },
            ] as Array<{ tab: TabKey; label: string; value: number }>).map((c) => {
              const ativo = activeTab === c.tab;
              return (
                <button
                  key={c.tab}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => abrirDetalhe(c.tab)}
                  title={`Ver ${c.label === 'Total no período' ? 'todos os processamentos' : c.label.toLowerCase()} do período`}
                  className={`rounded-lg border bg-muted/50 text-left shadow-sm transition-colors hover:border-primary/60 hover:bg-muted ${ativo ? 'border-primary ring-2 ring-primary/40' : ''}`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                      {c.label}
                      <ChevronRight className={`h-4 w-4 transition-transform ${ativo ? 'rotate-90' : ''}`} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold tabular-nums">{c.value}</p>
                  </CardContent>
                </button>
              );
            })}
          </div>

          {/* Gráfico de evolução mensal */}
          <ProcessesBarChart data={monthly} title="Processamentos por mês" />

          {/* Detalhe (por tipo, dentro do intervalo escolhido) */}
          <div ref={detalheRef} className="scroll-mt-4">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
              <TabsList className="grid grid-cols-2 gap-2 md:grid-cols-5">
                <TabsTrigger value="all">Todos ({noPeriodo.length})</TabsTrigger>
                <TabsTrigger value="salary">Salário ({salaryProcesses.length})</TabsTrigger>
                <TabsTrigger value="cobrancas">Cobranças ({cobrancasProcesses.length})</TabsTrigger>
                <TabsTrigger value="compensacao">Compensação ({compensacaoProcesses.length})</TabsTrigger>
                <TabsTrigger value="outros">Outros ({outrosProcesses.length})</TabsTrigger>
              </TabsList>

              {TABS.map((t) => (
                <TabsContent key={t} value={t}>
                  <ProcessesTable processes={tabData[t]} title={`${TAB_TITLES[t]} (no período)`} />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default EasyVistaEstatisticas;
