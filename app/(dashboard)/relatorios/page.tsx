"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportKpiCard } from "@/components/reports/report-kpi-card";
import { ConversasPorNumeroChart } from "@/components/reports/conversas-por-numero-chart";
import { MessageVolumeChart } from "@/components/reports/message-volume-chart";
import { ConversasPorStatusChart } from "@/components/reports/conversas-por-status-chart";
import { TopPerformersList } from "@/components/reports/top-performers-list";
import {
  MOCK_REPORT_KPIS,
  MOCK_CONVERSAS_POR_NUMERO,
  MOCK_MESSAGE_VOLUME,
  MOCK_CONVERSAS_POR_STATUS,
  MOCK_TOP_PERFORMERS,
} from "@/lib/mock-data";

const DATE_RANGE_OPTIONS = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "custom", label: "Personalizado" },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("30d");

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="px-6 py-6 bg-surface-card border-b border-border-default">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold text-txt-primary">
              Relatórios
            </h1>
            <p className="mt-1 text-sm text-txt-secondary">
              Análises e métricas de desempenho da plataforma
            </p>
          </div>
          <Select
            value={dateRange}
            onValueChange={(value) => value && setDateRange(value)}
          >
            <SelectTrigger
              aria-label="Selecionar período"
              className="min-w-[160px] h-10"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {MOCK_REPORT_KPIS.map((kpi) => (
            <ReportKpiCard key={kpi.label} {...kpi} />
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-border-default">
            <CardContent>
              <h2 className="font-headline text-base font-semibold text-txt-primary mb-4">
                Conversas por Número
              </h2>
              <ConversasPorNumeroChart data={MOCK_CONVERSAS_POR_NUMERO} />
            </CardContent>
          </Card>

          <Card className="border-border-default">
            <CardContent>
              <h2 className="font-headline text-base font-semibold text-txt-primary mb-4">
                Volume de Mensagens
              </h2>
              <MessageVolumeChart data={MOCK_MESSAGE_VOLUME} />
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-border-default">
            <CardContent>
              <h2 className="font-headline text-base font-semibold text-txt-primary mb-4">
                Conversas por Status
              </h2>
              <ConversasPorStatusChart data={MOCK_CONVERSAS_POR_STATUS} />
            </CardContent>
          </Card>

          <Card className="border-border-default">
            <CardContent>
              <h2 className="font-headline text-base font-semibold text-txt-primary mb-4">
                Top Vendedores
              </h2>
              <TopPerformersList data={MOCK_TOP_PERFORMERS} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
