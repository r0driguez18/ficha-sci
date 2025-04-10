
import React, { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Loader2 } from 'lucide-react';

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

  useEffect(() => {
    console.log("ProcessesBarChart - Dados recebidos:", data);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
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
      <CardContent>
        <div className="h-[250px]">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" padding={{ left: 10, right: 10 }} />
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
                <Legend wrapperStyle={{ paddingTop: 10 }} />
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
