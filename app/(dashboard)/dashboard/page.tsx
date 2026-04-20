"use client";

import { useMemo, useState } from "react";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  UserPlus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AvatarInitials } from "@/components/chat/avatar-initials";
import { DashboardChart } from "@/components/dashboard/dashboard-chart";
import {
  useDashboardOverview,
  type AgentPerformance,
  type DashboardKpi,
  type DashboardKpiKey,
  type DashboardRange,
} from "@/lib/hooks/use-reports";

// ── Metadata dos KPIs ──

type KpiMeta = {
  label: string;
  icon: "conversations" | "clock" | "check" | "user-plus";
  format: (value: number | null) => string;
  // `true` quando diminuir é bom (ex: tempo de resposta). Default: aumentar é bom.
  preferLow?: boolean;
};

const KPI_META: Record<DashboardKpiKey, KpiMeta> = {
  openedConversations: {
    // "Novas Conversas" — deixa explícito que é período (criadas no range).
    // Antes era "Conversas Abertas" e o user esperava snapshot.
    label: "Novas Conversas",
    icon: "conversations",
    format: (v) => (v === null ? "—" : String(v)),
  },
  avgResponseTime: {
    label: "Tempo Médio de Resposta",
    icon: "clock",
    format: () => "—", // MVP — passo 17.x
    preferLow: true,
  },
  atendimentos: {
    label: "Atendimentos",
    icon: "check",
    format: (v) => (v === null ? "—" : String(v)),
  },
  newLeads: {
    label: "Leads Novos",
    icon: "user-plus",
    format: (v) => (v === null ? "—" : String(v)),
  },
};

const ICON_MAP = {
  conversations: { Icon: MessageSquare, bg: "bg-primary-50", color: "text-primary-600" },
  clock: { Icon: Clock, bg: "bg-warning-light", color: "text-warning" },
  check: { Icon: CheckCircle, bg: "bg-success-light", color: "text-success" },
  "user-plus": { Icon: UserPlus, bg: "bg-info-light", color: "text-info" },
} as const;

const RANGE_OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
];

// ── Components ──

function KpiCard({ kpi }: { kpi: DashboardKpi }) {
  const meta = KPI_META[kpi.key];
  const { Icon, bg, color } = ICON_MAP[meta.icon];

  const trend = kpi.changePercent;
  const trendLabel =
    trend === null ? null : `${trend >= 0 ? "+" : ""}${trend}%`;
  // Polaridade por KPI: se preferLow (tempo de resposta etc.), diminuição é
  // chip verde. Default: aumento é verde.
  const trendIsPositive =
    trend !== null && (meta.preferLow ? trend <= 0 : trend >= 0);
  const TrendIcon = trend !== null && trend >= 0 ? TrendingUp : TrendingDown;

  return (
    <Card className="border-border-default">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div
            className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}
          >
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          {trendLabel !== null && (
            <span
              className={`flex items-center gap-1 text-xs font-medium ${
                trendIsPositive ? "text-success" : "text-danger"
              }`}
            >
              <TrendIcon className="w-3.5 h-3.5" />
              {trendLabel}
            </span>
          )}
        </div>
        <div>
          <p className="font-headline text-2xl font-bold text-txt-primary">
            {meta.format(kpi.value)}
          </p>
          <p className="text-sm text-txt-muted mt-0.5">{meta.label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function KpiCardSkeleton() {
  return (
    <Card className="border-border-default">
      <CardContent className="flex flex-col gap-3">
        <div className="w-11 h-11 rounded-xl bg-surface-elevated animate-pulse" />
        <div className="space-y-2">
          <div className="h-7 w-16 bg-surface-elevated rounded animate-pulse" />
          <div className="h-4 w-32 bg-surface-elevated rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

function AgentRow({ rank, agent }: { rank: number; agent: AgentPerformance }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border-subtle last:border-b-0">
      <span className="w-5 text-center text-sm text-txt-muted font-medium">
        {rank}
      </span>
      <AvatarInitials name={agent.userName} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-txt-primary truncate">
          {agent.userName}
        </p>
        <p className="text-xs text-txt-muted">
          {agent.atendimentos} atendimentos
        </p>
      </div>
      <div className="text-right hidden lg:block">
        <p className="text-sm text-txt-primary">{agent.tempoMedio ?? "—"}</p>
        <p className="text-xs text-txt-muted">Tempo médio</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-primary-600">
          {agent.conversoes}
        </p>
        <p className="text-xs text-txt-muted">Conversões</p>
      </div>
      <div className="flex items-center gap-2 w-20">
        <div className="flex-1 h-2 rounded-full bg-neutral-50 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-600"
            style={{ width: `${agent.taxa}%` }}
          />
        </div>
        <span className="text-xs text-txt-secondary font-medium w-11 text-right">
          {agent.taxa}%
        </span>
      </div>
    </div>
  );
}

// ── Page ──

function formatChartDate(iso: string): string {
  const [, month, day] = iso.split("-");
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${Number(day)} ${months[Number(month) - 1]}`;
}

export default function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>("7d");
  const { data, isLoading, error } = useDashboardOverview(range);

  const chartData = useMemo(
    () =>
      (data?.conversationsPerDay ?? []).map((p) => ({
        date: formatChartDate(p.date),
        conversas: p.count,
      })),
    [data?.conversationsPerDay],
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header + filter */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-txt-primary">
            Dashboard
          </h1>
          <p className="text-sm text-txt-muted mt-1">
            Visão geral do atendimento
          </p>
        </div>
        <Select
          value={range}
          onValueChange={(v) => setRange(v as DashboardRange)}
        >
          <SelectTrigger aria-label="Período" className="w-[180px]">
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
              Erro ao carregar dashboard:{" "}
              {error instanceof Error ? error.message : "desconhecido"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading || !data
          ? Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
          : data.kpis.map((kpi) => <KpiCard key={kpi.key} kpi={kpi} />)}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Conversas por dia */}
        <Card className="xl:col-span-3 border-border-default">
          <CardContent>
            {isLoading || !data ? (
              <div className="h-[280px] bg-surface-elevated rounded animate-pulse" />
            ) : (
              <DashboardChart data={chartData} />
            )}
          </CardContent>
        </Card>

        {/* Performance dos Vendedores */}
        <Card className="xl:col-span-2 border-border-default">
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-headline text-base font-semibold text-txt-primary">
                Performance dos Vendedores
              </h2>
            </div>
            <div>
              {isLoading || !data ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 bg-surface-elevated rounded my-2 animate-pulse"
                  />
                ))
              ) : data.agents.length === 0 ? (
                <p className="text-sm text-txt-muted py-6 text-center">
                  Sem dados de atendimento no período.
                </p>
              ) : (
                data.agents.map((agent, i) => (
                  <AgentRow key={agent.userId} rank={i + 1} agent={agent} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
