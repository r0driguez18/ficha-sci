
import React, { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface ProcessesChartProps {
  data: Array<{
    month: string;
    salary: number;
    debit_credit: number;
    other: number;
  }>;
  title?: string;
}

const ProcessesBarChart: React.FC<ProcessesChartProps> = ({ data, title = "Processos por Mês" }) => {
  const chartConfig = {
    salary: {
      label: "Salários (SA)",
      color: "#FF8042"
    },
    debit_credit: {
      label: "Processamentos de Empresas",
      color: "#0088FE"
    },
    other: {
      label: "Outros Processamentos",
      color: "#00C49F"
    }
  };

  // Format month names for better display
  const formattedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => {
      // Extract month and year from the "month" string (format: "MM/YYYY")
      const [month, year] = item.month.split('/');
      
      // Get month name
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

  useEffect(() => {
    console.log("ProcessesBarChart - Dados formatados:", formattedData);
  }, [formattedData]);

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
    <Card className="w-full mb-6 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[350px] w-full">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={formattedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="formattedMonth" 
                  padding={{ left: 20, right: 20 }}
                  tick={{ fontSize: 12 }}
                  height={50}
                  tickMargin={10}
                  angle={0}
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  label={{ value: 'Quantidade', angle: -90, position: 'insideLeft', offset: -5 }}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <ChartTooltipContent
                          className="w-56"
                          payload={payload}
                        />
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: 15, fontSize: 12 }} 
                  verticalAlign="bottom"
                  height={36}
                />
                <Bar 
                  dataKey="salary" 
                  fill={chartConfig.salary.color} 
                  name={chartConfig.salary.label}
                  animationDuration={800}
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="debit_credit" 
                  fill={chartConfig.debit_credit.color} 
                  name={chartConfig.debit_credit.label}
                  animationDuration={800}
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="other" 
                  fill={chartConfig.other.color} 
                  name={chartConfig.other.label}
                  animationDuration={800}
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
