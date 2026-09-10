import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, FileSpreadsheet, FileText, BarChart3 } from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { getFileProcesses, type FileProcess } from '@/services/fileProcessService';
import { buildMonthlyStats, defaultRange } from '@/lib/processStats';
import { useOperators } from '@/hooks/useOperators';
import ProcessesTable from '@/components/charts/ProcessesTable';
import ProcessesBarChart from '@/components/charts/ProcessesBarChart';

type TabKey = 'all' | 'salary' | 'cobrancas' | 'compensacao';

const TAB_TITLES: Record<TabKey, string> = {
  all: 'Todos os Processamentos',
  salary: 'Processamentos de Salário',
  cobrancas: 'Cobranças',
  compensacao: 'Compensação',
};

const EasyVistaEstatisticas = () => {
  const { labelOf } = useOperators();
  const [allProcesses, setAllProcesses] = useState<FileProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState(() => defaultRange());
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (['all', 'salary', 'cobrancas', 'compensacao'].includes(hash)) {
      setActiveTab(hash as TabKey);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
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
    loadData();
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabKey);
    window.location.hash = value;
  };

  // As bibliotecas de exportação (xlsx / jspdf-autotable) só carregam ao exportar.
  const handleExport = async (kind: 'xlsx' | 'pdf') => {
    try {
      const mod = await import('@/lib/exportProcesses');
      if (kind === 'xlsx') mod.exportProcessesXlsx(currentList, currentTitle, labelOf);
      else mod.exportProcessesPdf(currentList, currentTitle, labelOf);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Não foi possível gerar o ficheiro.');
    }
  };

  const salaryProcesses = useMemo(() => allProcesses.filter((p) => p.tipo === 'salario'), [allProcesses]);
  const cobrancasProcesses = useMemo(() => allProcesses.filter((p) => p.tipo === 'cobrancas'), [allProcesses]);
  const compensacaoProcesses = useMemo(() => allProcesses.filter((p) => p.tipo === 'compensacao'), [allProcesses]);

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
        }),
        { total: 0, salario: 0, cobrancas: 0, compensacao: 0 },
      ),
    [monthly],
  );

  const tabData: Record<TabKey, FileProcess[]> = {
    all: allProcesses,
    salary: salaryProcesses,
    cobrancas: cobrancasProcesses,
    compensacao: compensacaoProcesses,
  };
  const currentList = tabData[activeTab];
  const currentTitle = TAB_TITLES[activeTab];

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
                  onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
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
                  onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
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
                  disabled={currentList.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  XLSX
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleExport('pdf')}
                  disabled={currentList.length === 0}
                >
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cartões de contagem (no período) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total no período', value: periodTotals.total },
              { label: 'Salário', value: periodTotals.salario },
              { label: 'Cobranças', value: periodTotals.cobrancas },
              { label: 'Compensação', value: periodTotals.compensacao },
            ].map((c) => (
              <Card key={c.label} className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tabular-nums">{c.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Gráfico de evolução mensal */}
          <ProcessesBarChart data={monthly} title="Processamentos por mês" />

          {/* Detalhe (lista completa, por tipo) */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="salary">Salário</TabsTrigger>
              <TabsTrigger value="cobrancas">Cobranças</TabsTrigger>
              <TabsTrigger value="compensacao">Compensação</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <ProcessesTable processes={allProcesses} title="Todos os Processamentos" />
            </TabsContent>
            <TabsContent value="salary">
              <ProcessesTable processes={salaryProcesses} title="Processamentos de Salário" />
            </TabsContent>
            <TabsContent value="cobrancas">
              <ProcessesTable processes={cobrancasProcesses} title="Cobranças" />
            </TabsContent>
            <TabsContent value="compensacao">
              <ProcessesTable processes={compensacaoProcesses} title="Compensação" />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </PageContainer>
  );
};

export default EasyVistaEstatisticas;
