import {
  MessageSquare,
  Clock,
  CheckCircle,
  Star,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ReportKpiCardData, ReportKpiIcon } from "@/types/report";

const ICON_MAP: Record<
  ReportKpiIcon,
  { Icon: typeof MessageSquare; bg: string; color: string }
> = {
  conversations: { Icon: MessageSquare, bg: "bg-info-light", color: "text-info" },
  clock: { Icon: Clock, bg: "bg-warning-light", color: "text-warning" },
  check: { Icon: CheckCircle, bg: "bg-success-light", color: "text-success" },
  star: { Icon: Star, bg: "bg-secondary-50", color: "text-secondary-600" },
};

export function ReportKpiCard({
  label,
  value,
  valueSuffix,
  change,
  trend,
  trendIsPositive,
  icon,
}: ReportKpiCardData) {
  const { Icon, bg, color } = ICON_MAP[icon];
  return (
    <Card className="border-border-default">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div
            className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}
          >
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <span
            className={`flex items-center gap-1 text-xs font-bold ${
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
          <p className="font-headline text-3xl font-bold text-txt-primary flex items-baseline gap-1">
            {value}
            {valueSuffix && (
              <span className="text-base font-normal text-txt-muted">
                {valueSuffix}
              </span>
            )}
          </p>
          <p className="text-sm text-txt-muted mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
