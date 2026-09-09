import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

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

const SERIES = [
  { key: 'salario', label: 'Salário', color: '#f59f0a' },
  { key: 'cobrancas', label: 'Cobranças', color: '#3b82f6' },
  { key: 'compensacao', label: 'Compensação', color: '#16a249' },
  { key: 'outros', label: 'Outros', color: '#64748b' },
] as const;

const AXIS = 'hsl(var(--muted-foreground))';

interface TooltipEntry {
  dataKey: string;
  value: number;
  color: string;
}
interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

const ProcessesBarChart: React.FC<ProcessesChartProps> = ({ data, title = 'Processamentos por mês' }) => {
  const isMobile = useIsMobile();

  const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (!active || !payload?.length) return null;
    const rows = payload.filter((e) => e.value);
    return (
      <div className="rounded-md border border-border bg-popover px-3 py-2 text-popover-foreground shadow-lg">
        <p className="mb-1 text-xs font-medium">{label}</p>
        {rows.map((e) => (
          <div key={e.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: e.color }} />
              {SERIES.find((s) => s.key === e.dataKey)?.label ?? e.dataKey}
            </span>
            <span className="font-medium tabular-nums">{e.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-72 items-center justify-center">
          <p className="text-muted-foreground">
            Sem processamentos no período selecionado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[360px] lg:h-[440px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 16, right: isMobile ? 8 : 24, left: isMobile ? -8 : 8, bottom: 8 }}
              barGap={4}
              barSize={isMobile ? 12 : 22}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: isMobile ? 10 : 12, fill: AXIS }}
                tickLine={{ stroke: AXIS }}
                axisLine={{ stroke: AXIS }}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: isMobile ? 10 : 12, fill: AXIS }}
                tickLine={{ stroke: AXIS }}
                axisLine={{ stroke: AXIS }}
                width={isMobile ? 28 : 44}
                allowDecimals={false}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
              <Legend
                verticalAlign="bottom"
                height={32}
                iconType="circle"
                iconSize={9}
                wrapperStyle={{ fontSize: isMobile ? 10 : 12, color: AXIS }}
              />
              {SERIES.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessesBarChart;
