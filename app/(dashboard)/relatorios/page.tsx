"use client";

import { useMemo, useState } from "react";

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
  useReportStats,
  type DashboardRange,
  type ReportKpi,
  type ReportKpiKey,
} from "@/lib/hooks/use-reports";
import type {
  ConversasPorNumeroPoint,
  ConversasPorStatusPoint,
  MessageVolumePoint,
  ReportKpiCardData,
  ReportKpiIcon,
  TopPerformerData,
} from "@/types/report";

const RANGE_OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
];

// ── KPI metadata ──

type KpiMeta = {
  label: string;
  icon: ReportKpiIcon;
  // `true` quando diminuir é bom. Default: aumentar é bom.
  preferLow?: boolean;
};

const KPI_META: Record<ReportKpiKey, KpiMeta> = {
  totalConversations: { label: "Total de Conversas", icon: "conversations" },
  avgResponseTime: { label: "Tempo Médio de Resposta", icon: "clock", preferLow: true },
  resolutionRate: { label: "Taxa de Resolução", icon: "check" },
  satisfaction: { label: "Satisfação do Cliente", icon: "star" },
};

function formatKpiValue(kpi: ReportKpi): { value: string; valueSuffix?: string } {
  if (kpi.value === null) return { value: "—" };
  switch (kpi.unit) {
    case "count":
      return { value: kpi.value.toLocaleString("pt-BR") };
    case "percent":
      return { value: `${kpi.value}%` };
    case "rating":
      return { value: kpi.value.toString(), valueSuffix: "/5" };
    case "duration":
      return { value: "—" };
    default:
      return { value: String(kpi.value) };
  }
}

function toReportKpiCard(kpi: ReportKpi): ReportKpiCardData {
  const meta = KPI_META[kpi.key];
  const { value, valueSuffix } = formatKpiValue(kpi);
  const base: ReportKpiCardData = {
    label: meta.label,
    value,
    icon: meta.icon,
  };
  if (valueSuffix) base.valueSuffix = valueSuffix;
  if (kpi.changePercent !== null) {
    const pct = kpi.changePercent;
    base.change = `${pct >= 0 ? "+" : ""}${pct}%`;
    base.trend = pct >= 0 ? "up" : "down";
    // Polaridade por KPI (P2.3) — preferLow inverte o sinal pro chip verde.
    base.trendIsPositive = meta.preferLow ? pct <= 0 : pct >= 0;
  }
  return base;
}

// ── Status bucket labels ──

const STATUS_LABELS: Record<"open" | "resolved" | "unassigned", string> = {
  open: "Abertas",
  resolved: "Resolvidas",
  unassigned: "Pendentes",
};

const STATUS_COLORS: Record<"open" | "resolved" | "unassigned", string> = {
  open: "var(--color-info)",
  resolved: "var(--color-success)",
  unassigned: "var(--color-warning)",
};

// ── Date formatting ──

const MONTH_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function formatChartDate(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${Number(day)} ${MONTH_SHORT[Number(month) - 1]}`;
}

// ── Skeletons ──

function KpiCardSkeleton() {
  return (
    <Card className="border-border-default">
      <CardContent className="flex flex-col gap-3">
        <div className="w-12 h-12 rounded-xl bg-surface-elevated animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 w-20 bg-surface-elevated rounded animate-pulse" />
          <div className="h-4 w-32 bg-surface-elevated rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="bg-surface-elevated rounded animate-pulse w-full"
      style={{ height }}
    />
  );
}

// ── Page ──

export default function ReportsPage() {
  const [range, setRange] = useState<DashboardRange>("30d");
  const { data, isLoading, error } = useReportStats(range);

  const kpiCards = useMemo(
    () => (data?.kpis ?? []).map(toReportKpiCard),
    [data?.kpis],
  );

  const conversasPorNumeroData: ConversasPorNumeroPoint[] = useMemo(
    () =>
      (data?.conversationsByInstance ?? []).map((p) => ({
        id: p.instanceId,
        name: p.instanceName,
        conversas: p.conversations,
        color: p.instanceColor,
      })),
    [data?.conversationsByInstance],
  );

  const messageVolumeData: MessageVolumePoint[] = useMemo(
    () =>
      (data?.messageVolume ?? []).map((p) => ({
        date: formatChartDate(p.date),
        recebidas: p.received,
        enviadas: p.sent,
      })),
    [data?.messageVolume],
  );

  const conversasPorStatusData: ConversasPorStatusPoint[] = useMemo(
    () =>
      (data?.conversationsByStatus ?? []).map((p) => ({
        id: p.bucket,
        name: STATUS_LABELS[p.bucket],
        value: p.count,
        color: STATUS_COLORS[p.bucket],
      })),
    [data?.conversationsByStatus],
  );

  const topPerformersData: TopPerformerData[] = useMemo(
    () =>
      (data?.topPerformers ?? []).map((p) => ({
        nome: p.userName,
        conversas: p.conversations,
        tempoMedio: p.avgResponseTime ?? "—",
        taxaResolucao: p.resolutionRate,
      })),
    [data?.topPerformers],
  );

  const hasConversasPorNumero = conversasPorNumeroData.length > 0;
  const hasMessageVolume = messageVolumeData.some(
    (p) => p.recebidas > 0 || p.enviadas > 0,
  );
  const hasStatus = conversasPorStatusData.some((p) => p.value > 0);
  const hasPerformers = topPerformersData.length > 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-headline text-2xl font-bold text-txt-primary">
            Relatórios
          </h2>
          <p className="text-sm text-txt-muted mt-1">
            Análises e métricas de desempenho da plataforma
          </p>
        </div>
        <Select
          value={range}
          onValueChange={(value) => value && setRange(value as DashboardRange)}
        >
          <SelectTrigger
            aria-label="Selecionar período"
            className="min-w-[160px] h-10"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Card className="border-danger">
          <CardContent>
            <p className="text-sm text-danger">
              Erro ao carregar relatórios:{" "}
              {error instanceof Error ? error.message : "desconhecido"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading || !data
          ? Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
          : kpiCards.map((kpi) => <ReportKpiCard key={kpi.label} {...kpi} />)}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-border-default">
          <CardContent>
            <h3 className="font-headline text-base font-semibold text-txt-primary mb-4">
              Conversas por Número
            </h3>
            {isLoading || !data ? (
              <ChartSkeleton />
            ) : hasConversasPorNumero ? (
              <ConversasPorNumeroChart data={conversasPorNumeroData} />
            ) : (
              <p className="text-sm text-txt-muted py-12 text-center">
                Sem conversas no período.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border-default">
          <CardContent>
            <h3 className="font-headline text-base font-semibold text-txt-primary mb-4">
              Volume de Mensagens
            </h3>
            {isLoading || !data ? (
              <ChartSkeleton />
            ) : hasMessageVolume ? (
              <MessageVolumeChart data={messageVolumeData} />
            ) : (
              <p className="text-sm text-txt-muted py-12 text-center">
                Sem mensagens no período.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-border-default">
          <CardContent>
            <h3 className="font-headline text-base font-semibold text-txt-primary mb-4">
              Conversas por Status
            </h3>
            {isLoading || !data ? (
              <ChartSkeleton height={260} />
            ) : hasStatus ? (
              <ConversasPorStatusChart data={conversasPorStatusData} />
            ) : (
              <p className="text-sm text-txt-muted py-12 text-center">
                Sem dados de status no período.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border-default">
          <CardContent>
            <h3 className="font-headline text-base font-semibold text-txt-primary mb-4">
              Top Vendedores
            </h3>
            {isLoading || !data ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 bg-surface-elevated rounded animate-pulse"
                  />
                ))}
              </div>
            ) : hasPerformers ? (
              <TopPerformersList data={topPerformersData} />
            ) : (
              <p className="text-sm text-txt-muted py-12 text-center">
                Sem dados de atendimento no período.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
