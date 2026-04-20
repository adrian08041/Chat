"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type {
  DashboardOverview,
  DashboardRange,
  ReportStats,
} from "@/types/reports-api";

// Re-export dos tipos usados pelas páginas — consumidores importam daqui
// sem precisar saber que o shape é compartilhado com o service.
export type {
  AgentPerformance,
  ConversationsByInstancePoint,
  ConversationsByStatusBucket,
  ConversationsByStatusPoint,
  DashboardChartPoint,
  DashboardKpi,
  DashboardKpiKey,
  DashboardOverview,
  DashboardRange,
  MessageVolumePoint,
  ReportKpi,
  ReportKpiKey,
  ReportKpiUnit,
  ReportStats,
  TopPerformer,
} from "@/types/reports-api";

export function useDashboardOverview(range: DashboardRange) {
  return useQuery({
    queryKey: ["reports", "overview", range],
    queryFn: () =>
      apiFetch<DashboardOverview>(`/api/reports/overview?range=${range}`),
  });
}

export function useReportStats(range: DashboardRange) {
  return useQuery({
    queryKey: ["reports", "stats", range],
    queryFn: () => apiFetch<ReportStats>(`/api/reports/stats?range=${range}`),
  });
}
