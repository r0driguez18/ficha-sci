import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, LineChart, PieChart, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, Line, Pie, Area, Cell } from 'recharts';
import ProcessesBarChart from '@/components/charts/ProcessesBarChart';
import ProcessesTable from '@/components/charts/ProcessesTable';
import { getFileProcesses, getSalaryProcesses, getProcessesStatsByMonth, cleanupDuplicateProcesses } from '@/services/fileProcessService';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const EasyVistaDashboards = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [processesData, setProcessesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentProcesses, setRecentProcesses] = useState<any[]>([]);
  const [salaryProcesses, setSalaryProcesses] = useState<any[]>([]);
  const [cleaningData, setCleaningData] = useState(false);
  
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const stats = await getProcessesStatsByMonth();
      console.log("Estatísticas carregadas (Dashboard):", stats);
      setProcessesData(stats);
      
      const processes = await getFileProcesses();
      console.log("Processos carregados (Dashboard):", processes);
      setRecentProcesses(processes.slice(0, 10));
      
      const salaries = await getSalaryProcesses();
      console.log("Processos de salário carregados (Dashboard):", salaries);
      setSalaryProcesses(salaries.slice(0, 10));
      
      if (stats.length === 0 && processes.length === 0) {
        toast.info("Nenhum dado de processamento disponível. Adicione alguns processos para visualizá-los aqui.");
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleRefresh = () => {
    toast.info("Atualizando dados...");
    loadData();
  };

  const handleCleanupData = async () => {
    setCleaningData(true);
    toast.info("Iniciando limpeza dos dados duplicados...");
    
    try {
      const { removed } = await cleanupDuplicateProcesses();
      toast.success(`Limpeza concluída! ${removed} registros duplicados foram removidos.`);
      loadData(); // Recarregar dados após a limpeza
    } catch (error) {
      console.error("Erro ao limpar dados:", error);
      toast.error("Erro ao limpar dados duplicados. Por favor, tente novamente.");
    } finally {
      setCleaningData(false);
    }
  };
  
  const incidentData = [
    { name: 'Jan', planned: 65, actual: 78 },
    { name: 'Fev', planned: 59, actual: 63 },
    { name: 'Mar', planned: 80, actual: 80 },
    { name: 'Abr', planned: 81, actual: 75 },
    { name: 'Mai', planned: 56, actual: 60 },
    { name: 'Jun', planned: 55, actual: 58 },
    { name: 'Jul', planned: 40, actual: 45 },
  ];
  
  const categoryData = [
    { name: 'Hardware', value: 400 },
    { name: 'Software', value: 300 },
    { name: 'Network', value: 300 },
    { name: 'User Access', value: 200 },
    { name: 'Others', value: 100 },
  ];
  
  const statusData = [
    { name: 'Resolvido', value: 540 },
    { name: 'Pendente', value: 210 },
    { name: 'Em Progresso', value: 170 },
    { name: 'Fechado', value: 320 },
  ];
  
  const timeData = [
    { name: '00:00', value: 10 },
    { name: '03:00', value: 5 },
    { name: '06:00', value: 15 },
    { name: '09:00', value: 45 },
    { name: '12:00', value: 50 },
    { name: '15:00', value: 40 },
    { name: '18:00', value: 20 },
    { name: '21:00', value: 15 },
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="EasyVista - Dashboards" 
        subtitle="Visualização de métricas e indicadores"
      />

      <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-2">
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="incidents">Incidentes</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="processes">Processamentos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Incidentes por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statusData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="incidents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Incidentes Planejados vs Reais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={incidentData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="planned" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="actual" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendências por Hora do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={timeData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="processes" className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold">Dados de Processamento</h3>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> 
                Atualizar Dados
              </Button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Carregando dados...</span>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="w-full">
                <ProcessesBarChart 
                  data={processesData} 
                  title="Processamentos por Mês (Salários vs Outros)" 
                />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ProcessesTable 
                  processes={recentProcesses} 
                  title="Processamentos Recentes" 
                />
                
                <ProcessesTable 
                  processes={salaryProcesses} 
                  title="Processamentos de Salários (SA)" 
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EasyVistaDashboards;
