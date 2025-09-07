
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from '@/hooks/use-theme';

interface ProcessesChartProps {
  data: Array<{
    month: string;
    salario: number;
    cobrancas: number;
    compensacao: number;
    outros: number;
  }>;
  title?: string;
}

const ProcessesBarChart: React.FC<ProcessesChartProps> = ({ data, title = "Processos por Mês" }) => {
  // Remove dark mode dependency
  // const { isDarkMode } = useTheme();
  
  // Updated color configuration - Always light mode
  const chartConfig = React.useMemo(() => ({
    salario: {
      color: "#FF8042",
      label: "Salário"
    },
    cobrancas: {
      color: "#0088FE",
      label: "Cobranças"
    },
    compensacao: {
      color: "#00C49F",
      label: "Compensação"
    },
    outros: {
      color: "#607D8B",
      label: "Outros"
    }
  }), []);

  const isMobile = useIsMobile();
  
  // Format month labels to be more readable
  const formatXAxis = (tickItem: string) => {
    // If it's already in MM/YY format, return it as is
    if (/^\d{1,2}\/\d{2}$/.test(tickItem)) {
      return tickItem;
    }
    
    // Try to parse it as a date if needed
    try {
      // This is a simple formatting function, for more complex use cases we could use date-fns
      const [month, year] = tickItem.split('/');
      return `${month}/${year.slice(-2)}`;
    } catch (error) {
      console.log('Error formatting date:', tickItem);
      return tickItem;
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <p className="text-muted-foreground">Nenhum dado disponível. Adicione alguns processos para visualizá-los aqui.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mb-6">
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[400px] lg:h-[500px] w-full">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={isMobile ? 
                  { top: 20, right: 10, left: 0, bottom: 80 } : 
                  { top: 20, right: 30, left: 60, bottom: 60 }
                }
                barGap={4}
                barSize={isMobile ? 12 : 24}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="month" 
                  angle={0}
                  textAnchor="middle"
                  height={50}
                  tickFormatter={formatXAxis}
                  interval={0}
                  tick={{ 
                    fontSize: isMobile ? 10 : 12,
                    fill: '#374151'
                  }}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis 
                  tick={{ 
                    fontSize: isMobile ? 10 : 12,
                    fill: '#374151'
                  }}
                  width={isMobile ? 30 : 50}
                  tickCount={7}
                  domain={[0, 'auto']}
                  allowDecimals={false}
                  label={{ 
                    value: 'Quantidade', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { 
                      textAnchor: 'middle',
                      fontSize: isMobile ? 10 : 12,
                      fill: '#374151',
                      dy: isMobile ? 10 : 50
                    }
                  }}
                />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2 bg-white border-gray-200 border rounded shadow-lg w-auto min-w-32">
                          <p className="text-xs font-medium text-center text-gray-800">{label}</p>
                          {payload.map((entry, index) => {
                            if (entry.value && entry.value !== 0) {
                              return (
                                <div key={index} className="flex justify-between items-center mt-1">
                                  <span className="text-xs text-gray-500" style={{ color: entry.color }}>
                                    {chartConfig[entry.dataKey as keyof typeof chartConfig]?.label || entry.dataKey}:
                                  </span>
                                  <span className="text-xs font-medium text-gray-800">
                                    {entry.value}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  wrapperStyle={{ 
                    bottom: isMobile ? -10 : 0,
                    fontSize: isMobile ? 10 : 12,
                    color: '#374151'
                  }}
                  layout="horizontal"
                  align="center"
                  iconSize={10}
                  iconType="circle"
                />
                <Bar 
                  dataKey="salario" 
                  fill={chartConfig.salario.color} 
                  name={chartConfig.salario.label}
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="cobrancas" 
                  fill={chartConfig.cobrancas.color} 
                  name={chartConfig.cobrancas.label}
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="compensacao" 
                  fill={chartConfig.compensacao.color} 
                  name={chartConfig.compensacao.label}
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="outros" 
                  fill={chartConfig.outros.color}
                  name={chartConfig.outros.label} 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessesBarChart;
