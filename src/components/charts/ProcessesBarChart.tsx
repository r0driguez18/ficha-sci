
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from '@/hooks/use-theme';

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
  const { isDarkMode } = useTheme();
  
  // Updated color configuration with better contrast for dark mode
  const chartConfig = React.useMemo(() => ({
    salary: {
      color: isDarkMode ? "#FF9B5E" : "#FF8042",
      label: "Salários"
    },
    ga_processes: {
      color: isDarkMode ? "#54A9FF" : "#0088FE",
      label: "GA"
    },
    im_processes: {
      color: isDarkMode ? "#22DDAA" : "#00C49F",
      label: "IM"
    },
    ena_processes: {
      color: isDarkMode ? "#FFDD4A" : "#FFBB28",
      label: "ENA"
    },
    inp_processes: {
      color: isDarkMode ? "#FF8A8A" : "#FF6B6B",
      label: "INP"
    },
    bn_processes: {
      color: isDarkMode ? "#6ECD6E" : "#4CAF50",
      label: "BN"
    },
    fcvt_processes: {
      color: isDarkMode ? "#C167D9" : "#9C27B0",
      label: "FCVT"
    },
    other: {
      color: isDarkMode ? "#8EA5B4" : "#607D8B",
      label: "Outros"
    }
  }), [isDarkMode]);

  const isMobile = useIsMobile();

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
                  { top: 20, right: 30, left: 40, bottom: 60 }
                }
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ 
                    fontSize: isMobile ? 10 : 12,
                    dx: isMobile ? -5 : 0,
                    fill: isDarkMode ? '#e5e7eb' : '#374151'
                  }}
                />
                <YAxis 
                  tick={{ 
                    fontSize: isMobile ? 10 : 12,
                    fill: isDarkMode ? '#e5e7eb' : '#374151'
                  }}
                  width={isMobile ? 35 : 60}
                  label={{ 
                    value: 'Quantidade', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { 
                      textAnchor: 'middle',
                      fontSize: isMobile ? 10 : 12,
                      dy: isMobile ? 0 : 50,
                      fill: isDarkMode ? '#e5e7eb' : '#374151'
                    }
                  }}
                />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className={`p-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded shadow-lg w-auto min-w-32`}>
                          <p className={`text-xs font-medium text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{label}</p>
                          {payload.map((entry, index) => {
                            if (entry.value && entry.value !== 0) {
                              return (
                                <div key={index} className="flex justify-between items-center mt-1">
                                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={{ color: entry.color }}>
                                    {chartConfig[entry.dataKey as keyof typeof chartConfig]?.label || entry.dataKey}:
                                  </span>
                                  <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
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
                    color: isDarkMode ? '#e5e7eb' : '#374151'
                  }}
                />
                <Bar 
                  dataKey="salary" 
                  fill={chartConfig.salary.color} 
                  name={chartConfig.salary.label}
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="ga_processes" 
                  fill={chartConfig.ga_processes.color} 
                  name={chartConfig.ga_processes.label}
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="im_processes" 
                  fill={chartConfig.im_processes.color} 
                  name={chartConfig.im_processes.label}
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="ena_processes" 
                  fill={chartConfig.ena_processes.color}
                  name={chartConfig.ena_processes.label} 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="inp_processes" 
                  fill={chartConfig.inp_processes.color}
                  name={chartConfig.inp_processes.label} 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="bn_processes" 
                  fill={chartConfig.bn_processes.color}
                  name={chartConfig.bn_processes.label} 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="fcvt_processes" 
                  fill={chartConfig.fcvt_processes.color}
                  name={chartConfig.fcvt_processes.label} 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="other" 
                  fill={chartConfig.other.color}
                  name={chartConfig.other.label} 
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
