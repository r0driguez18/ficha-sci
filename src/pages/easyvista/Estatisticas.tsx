
import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFileProcesses, getSalaryProcesses, getDebitCreditProcesses, getProcessesStatsByMonth } from '@/services/fileProcessService';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import ProcessesTable from '@/components/charts/ProcessesTable';
import ProcessesBarChart from '@/components/charts/ProcessesBarChart';

const EasyVistaEstatisticas = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [processesData, setProcessesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allProcesses, setAllProcesses] = useState<any[]>([]);
  const [salaryProcesses, setSalaryProcesses] = useState<any[]>([]);
  const [debitCreditProcesses, setDebitCreditProcesses] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar estatísticas agrupadas por mês
      const stats = await getProcessesStatsByMonth();
      console.log("Estatísticas carregadas (página Estatisticas):", stats);
      setProcessesData(stats);
      
      // Carregar todos os processos
      const processes = await getFileProcesses();
      console.log("Processos carregados (página Estatisticas):", processes);
      setAllProcesses(processes);
      
      // Carregar processos de salário
      const salaries = await getSalaryProcesses();
      console.log("Processos de salário carregados (página Estatisticas):", salaries);
      setSalaryProcesses(salaries);

      // Carregar processos de débito e crédito
      const debitCredits = await getDebitCreditProcesses();
      console.log("Processos de débito e crédito carregados:", debitCredits);
      setDebitCreditProcesses(debitCredits);
      
      if (stats.length === 0 && processes.length === 0) {
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

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Processamentos - Estatísticas" 
          subtitle="Visualização detalhada dos dados de processamento"
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
          <ProcessesBarChart 
            data={processesData} 
            title="Processamentos por Mês (Salários vs Processamentos de Empresas)" 
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Processamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <CardTitle className="text-lg">Processamentos de Salário</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{salaryProcesses.length}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Processamentos de Empresas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{debitCreditProcesses.length}</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <TabsTrigger value="all">Todos os Processamentos</TabsTrigger>
              <TabsTrigger value="salary">Processamentos de Salário</TabsTrigger>
              <TabsTrigger value="debit_credit">Processamentos de Empresas</TabsTrigger>
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

            <TabsContent value="debit_credit">
              <ProcessesTable 
                processes={debitCreditProcesses} 
                title="Processamentos de Empresas" 
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default EasyVistaEstatisticas;
