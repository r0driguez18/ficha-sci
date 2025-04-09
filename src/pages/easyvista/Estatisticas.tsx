
import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFileProcesses, getSalaryProcesses, getProcessesStatsByMonth } from '@/services/fileProcessService';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import ProcessesTable from '@/components/charts/ProcessesTable';
import ProcessesBarChart from '@/components/charts/ProcessesBarChart';

const EasyVistaEstatisticas = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [processesData, setProcessesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allProcesses, setAllProcesses] = useState<any[]>([]);
  const [salaryProcesses, setSalaryProcesses] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Carregar estatísticas agrupadas por mês
        const stats = await getProcessesStatsByMonth();
        setProcessesData(stats);
        
        // Carregar todos os processos
        const processes = await getFileProcesses();
        setAllProcesses(processes);
        
        // Carregar processos de salário
        const salaries = await getSalaryProcesses();
        setSalaryProcesses(salaries);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="EasyVista - Estatísticas" 
        subtitle="Visualização detalhada dos dados de processamento"
      />

      {loading ? (
        <div className="flex justify-center items-center h-80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando dados...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <ProcessesBarChart 
            data={processesData} 
            title="Processamentos por Mês (Salários vs Outros)" 
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
                    <CardTitle className="text-lg">Outros Processamentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{allProcesses.length - salaryProcesses.length}</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-2 md:grid-cols-2 gap-2">
              <TabsTrigger value="all">Todos os Processamentos</TabsTrigger>
              <TabsTrigger value="salary">Processamentos de Salário</TabsTrigger>
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
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default EasyVistaEstatisticas;
