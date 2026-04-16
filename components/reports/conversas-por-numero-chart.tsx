"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ConversasPorNumeroPoint } from "@/types/report";

const chartConfig = {
  conversas: {
    label: "Conversas",
  },
} satisfies ChartConfig;

interface Props {
  data: ConversasPorNumeroPoint[];
}

export function ConversasPorNumeroChart({ data }: Props) {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default)" />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--text-muted)" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--text-muted)" }}
        />
        <ChartTooltip cursor={{ fill: "var(--color-neutral-50)" }} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="conversas" radius={[8, 8, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.id} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
