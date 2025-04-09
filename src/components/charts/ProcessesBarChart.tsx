
import React, { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface ProcessesChartProps {
  data: Array<{
    month: string;
    salary: number;
    normal: number;
  }>;
  title?: string;
}

const ProcessesBarChart: React.FC<ProcessesChartProps> = ({ data, title = "Processos por Mês" }) => {
  const chartConfig = {
    salary: {
      label: "Salários (SA)",
      color: "#FF8042"
    },
    normal: {
      label: "Outros Processos",
      color: "#0088FE"
    }
  };

  // Debug para verificar os dados que estão chegando
  useEffect(() => {
    console.log("ProcessesBarChart - Dados recebidos:", data);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <p className="text-gray-500">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  // Exemplo de dados para quando não há dados suficientes
  const exampleData = data.length > 0 ? data : [
    { month: "1/2025", salary: 10, normal: 20 },
    { month: "2/2025", salary: 15, normal: 25 },
    { month: "3/2025", salary: 20, normal: 30 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={exampleData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
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
                <Legend />
                <Bar dataKey="salary" fill={chartConfig.salary.color} name={chartConfig.salary.label} />
                <Bar dataKey="normal" fill={chartConfig.normal.color} name={chartConfig.normal.label} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessesBarChart;
