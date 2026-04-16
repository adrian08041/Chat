"use client";

import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ConversasPorStatusPoint } from "@/types/report";

const chartConfig = {
  value: {
    label: "Conversas",
  },
} satisfies ChartConfig;

interface Props {
  data: ConversasPorStatusPoint[];
}

export function ConversasPorStatusChart({ data }: Props) {
  return (
    <div className="flex flex-col items-center">
      <ChartContainer config={chartConfig} className="h-[260px] w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.id} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-2">
        {data.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-txt-secondary">
              {item.name} ({item.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
