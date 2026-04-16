"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { MessageVolumePoint } from "@/types/report";

const chartConfig = {
  recebidas: {
    label: "Recebidas",
    color: "var(--color-info)",
  },
  enviadas: {
    label: "Enviadas",
    color: "var(--color-primary-600)",
  },
} satisfies ChartConfig;

interface Props {
  data: MessageVolumePoint[];
}

export function MessageVolumeChart({ data }: Props) {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
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
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="recebidas"
          stroke="var(--color-info)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: "var(--color-info)", strokeWidth: 2, stroke: "#fff" }}
        />
        <Line
          type="monotone"
          dataKey="enviadas"
          stroke="var(--color-primary-600)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: "var(--color-primary-600)", strokeWidth: 2, stroke: "#fff" }}
        />
      </LineChart>
    </ChartContainer>
  );
}
