"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import type { ChartDataPoint } from "@/types/report";

const chartConfig = {
  conversas: {
    label: "Conversas",
    color: "var(--color-primary-600)",
  },
} satisfies ChartConfig;

interface DashboardChartProps {
  data: ChartDataPoint[];
}

export function DashboardChart({ data }: DashboardChartProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline text-base font-semibold text-txt-primary">
          Conversas por dia
        </h2>
        <Select defaultValue="30d">
          <SelectTrigger aria-label="Selecionar período">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ChartContainer config={chartConfig} className="h-[280px] w-full">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default)" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--text-muted)" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="conversas"
            stroke="var(--color-primary-600)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-primary-600)", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "var(--color-primary-600)", strokeWidth: 2, stroke: "#fff" }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
