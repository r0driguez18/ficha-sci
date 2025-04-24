
import React, { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProcessesChartProps {
  data: Array<{
    month: string;
    salary: number;
    ga_processes: number;
    im_processes: number;
    ena_processes: number;
    inp_processes: number;
    bn_processes: number;
    fcvt_processes: number;
    other: number;
  }>;
  title?: string;
}

const ProcessesBarChart: React.FC<ProcessesChartProps> = ({ data, title = "Processos por Mês" }) => {
  const chartConfig = {
    salary: {
      color: "#FF8042"
    },
    ga_processes: {
      color: "#0088FE"
    },
    im_processes: {
      color: "#00C49F"
    },
    ena_processes: {
      color: "#FFBB28"
    },
    inp_processes: {
      color: "#FF6B6B"
    },
    bn_processes: {
      color: "#4CAF50"
    },
    fcvt_processes: {
      color: "#9C27B0"
    },
    other: {
      color: "#607D8B"
    }
  };

  const formattedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => {
      const [month, year] = item.month.split('/');
      const monthNames = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];
      const monthName = monthNames[parseInt(month) - 1];
      const formattedMonth = `${monthName}/${year}`;
      
      return {
        ...item,
        formattedMonth
      };
    });
  }, [data]);

  const isMobile = useIsMobile();

  if (!data || data.length === 0) {
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <p className="text-gray-500">Nenhum dado disponível. Adicione alguns processos para visualizá-los aqui.</p>
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
                data={formattedData}
                margin={isMobile ? 
                  { top: 20, right: 10, left: 0, bottom: 80 } : 
                  { top: 20, right: 30, left: 40, bottom: 60 }
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="formattedMonth" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ 
                    fontSize: isMobile ? 10 : 12,
                    dx: isMobile ? -5 : 0
                  }}
                />
                <YAxis 
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  width={isMobile ? 35 : 60}
                  label={{ 
                    value: 'Quantidade de Processos', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { 
                      textAnchor: 'middle',
                      fontSize: isMobile ? 10 : 12,
                      dy: isMobile ? 0 : 50
                    }
                  }}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className={`p-2 bg-white border rounded shadow ${isMobile ? "w-24" : "w-32"}`}>
                          <p className="text-xs font-medium text-center">{payload[0]?.payload.formattedMonth}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-muted-foreground">Valor:</span>
                            <span className="text-xs font-medium">{payload[0]?.value?.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="salary" 
                  fill={chartConfig.salary.color} 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="ga_processes" 
                  fill={chartConfig.ga_processes.color} 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="im_processes" 
                  fill={chartConfig.im_processes.color} 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="ena_processes" 
                  fill={chartConfig.ena_processes.color} 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="inp_processes" 
                  fill={chartConfig.inp_processes.color} 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="bn_processes" 
                  fill={chartConfig.bn_processes.color} 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="fcvt_processes" 
                  fill={chartConfig.fcvt_processes.color} 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="other" 
                  fill={chartConfig.other.color} 
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
