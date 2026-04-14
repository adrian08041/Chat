import {
  MessageSquare,
  Clock,
  CheckCircle,
  UserPlus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarInitials } from "@/components/chat/avatar-initials";
import { DashboardChart } from "@/components/dashboard/dashboard-chart";
import { MOCK_KPI_CARDS, MOCK_CHART_DATA, MOCK_VENDEDORES } from "@/lib/mock-data";
import type { KpiCardData, VendedorData } from "@/types/report";

// ── Icon map ──

const ICON_MAP = {
  conversations: { Icon: MessageSquare, bg: "bg-primary-50", color: "text-primary-600" },
  clock: { Icon: Clock, bg: "bg-warning-light", color: "text-warning" },
  check: { Icon: CheckCircle, bg: "bg-success-light", color: "text-success" },
  "user-plus": { Icon: UserPlus, bg: "bg-info-light", color: "text-info" },
} as const;

// ── Components ──

function KpiCard({ label, value, change, trend, trendIsPositive, icon }: KpiCardData) {
  const { Icon, bg, color } = ICON_MAP[icon];
  return (
    <Card className="border-border-default">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              trendIsPositive ? "text-success" : "text-danger"
            }`}
          >
            {trend === "up" ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {change}
          </span>
        </div>
        <div>
          <p className="font-headline text-2xl font-bold text-txt-primary">{value}</p>
          <p className="text-sm text-txt-muted mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function VendedorRow({
  rank,
  vendedor,
}: {
  rank: number;
  vendedor: VendedorData;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border-subtle last:border-b-0">
      <span className="w-5 text-center text-sm text-txt-muted font-medium">{rank}</span>
      <AvatarInitials name={vendedor.nome} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-txt-primary truncate">{vendedor.nome}</p>
        <p className="text-xs text-txt-muted">{vendedor.atendimentos} atendimentos</p>
      </div>
      <div className="text-right hidden lg:block">
        <p className="text-sm text-txt-primary">{vendedor.tempoMedio}</p>
        <p className="text-xs text-txt-muted">Tempo médio</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-primary-600">{vendedor.conversoes}</p>
        <p className="text-xs text-txt-muted">Conversões</p>
      </div>
      <div className="flex items-center gap-2 w-20">
        <div className="flex-1 h-2 rounded-full bg-neutral-50 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-600"
            style={{ width: `${vendedor.taxa}%` }}
          />
        </div>
        <span className="text-xs text-txt-secondary font-medium w-11 text-right">
          {vendedor.taxa}%
        </span>
      </div>
    </div>
  );
}

// ── Page ──

export default function DashboardPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {MOCK_KPI_CARDS.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Conversas por dia */}
        <Card className="xl:col-span-3 border-border-default">
          <CardContent>
            <DashboardChart data={MOCK_CHART_DATA} />
          </CardContent>
        </Card>

        {/* Performance dos Vendedores */}
        <Card className="xl:col-span-2 border-border-default">
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-headline text-base font-semibold text-txt-primary">
                Performance dos Vendedores
              </h2>
              <button className="text-sm font-medium text-primary-600 hover:text-primary-400 transition-colors">
                Ver todos
              </button>
            </div>
            <div>
              {MOCK_VENDEDORES.map((v, i) => (
                <VendedorRow key={v.nome} rank={i + 1} vendedor={v} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
