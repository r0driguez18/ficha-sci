
import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFileProcesses, getSalaryProcesses, getCobrancasProcesses, getCompensacaoProcesses, getProcessesStatsByMonth } from '@/services/fileProcessService';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import ProcessesTable from '@/components/charts/ProcessesTable';
import { useTheme } from '@/hooks/use-theme';

const EasyVistaEstatisticas = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [allProcesses, setAllProcesses] = useState<any[]>([]);
  const [salaryProcesses, setSalaryProcesses] = useState<any[]>([]);
  const [cobrancasProcesses, setCobrancasProcesses] = useState<any[]>([]);
  const [compensacaoProcesses, setCompensacaoProcesses] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { isDarkMode } = useTheme();

  // Use this for URL hash navigation
  useEffect(() => {
    // Check if there's a hash in the URL and set the active tab accordingly
    const hash = window.location.hash.replace('#', '');
    if (hash && ['all', 'salary', 'cobrancas', 'compensacao'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar todos os processos
      const processes = await getFileProcesses();
      console.log("Processos carregados (página Estatisticas):", processes);
      setAllProcesses(processes);
      
      // Carregar processos de salário
      const salaries = await getSalaryProcesses();
      console.log("Processos de salário carregados (página Estatisticas):", salaries);
      setSalaryProcesses(salaries);

      // Carregar processos de cobranças
      const cobrancas = await getCobrancasProcesses();
      console.log("Processos de cobranças carregados:", cobrancas);
      setCobrancasProcesses(cobrancas);
      
      // Carregar processos de compensação
      const compensacao = await getCompensacaoProcesses();
      console.log("Processos de compensação carregados:", compensacao);
      setCompensacaoProcesses(compensacao);
      
      if (processes.length === 0) {
        toast.info("Nenhum dado de processamento disponível. Adicione alguns processos para visualizá-los aqui.");
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados. Por favor, tente novamente.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar dados inicialmente
  useEffect(() => {
    loadData();
  }, []);

  // Atualizar dados a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.location.hash = value; // Update the URL hash
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Processamentos - Estatísticas" 
          subtitle="Visualização detalhada dos dados de processamento"
          id="estatisticas-page"
        />
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          disabled={loading || refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando dados...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Processamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total de Processamentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{allProcesses.length}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-orange-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Salário</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{salaryProcesses.length}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-purple-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Cobranças</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{cobrancasProcesses.length}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Compensação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{compensacaoProcesses.length}</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="salary">Salário</TabsTrigger>
              <TabsTrigger value="cobrancas">Cobranças</TabsTrigger>
              <TabsTrigger value="compensacao">Compensação</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <ProcessesTable 
                processes={allProcesses} 
                title="Todos os Processamentos" 
              />
            </TabsContent>
            
            <TabsContent value="salary">
              <ProcessesTable 
                processes={salaryProcesses} 
                title="Processamentos de Salário" 
              />
            </TabsContent>

            <TabsContent value="cobrancas">
              <ProcessesTable 
                processes={cobrancasProcesses} 
                title="Cobranças" 
              />
            </TabsContent>

            <TabsContent value="compensacao">
              <ProcessesTable 
                processes={compensacaoProcesses} 
                title="Compensação" 
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default EasyVistaEstatisticas;
