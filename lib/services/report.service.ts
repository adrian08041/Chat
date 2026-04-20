// Report service — passo 17 do Backend Plan.
// Agregações pra dashboard + relatórios. Todas workspace-scoped; acesso
// manager-only no layer da rota.
//
// Métricas intencionalmente omitidas no MVP:
//   - avgResponseTime (requer join OUTBOUND-INBOUND por conversation com
//     delta temporal + agregação; custo alto, valor marginal agora)
//   - satisfaction (schema não tem survey/rating post-RESOLVED)
//   UI renderiza "—" nos dois casos.
//
// Limitação conhecida (passo 17.x): "atendimentos do agent X" usa
// `Conversation.assignedUserId` (atual). Se conversa foi transferida de A→B,
// B leva crédito por todas as mensagens — inclusive as que A respondeu.
// Fix correto exige replay de `ConversationEvent` timeline, fora do MVP.

import { prisma } from "@/lib/prisma";
import type {
  AgentPerformance,
  ConversationsByInstancePoint,
  ConversationsByStatusBucket,
  ConversationsByStatusPoint,
  DashboardChartPoint,
  DashboardKpi,
  DashboardOverview,
  DashboardRange,
  MessageVolumePoint,
  ReportKpi,
  ReportStats,
  TopPerformer,
} from "@/types/reports-api";

// Workspace TZ fixo no MVP — bucketing de data no Postgres respeita esse offset.
// Passo futuro: `Workspace.timezone` como default + override por usuário.
const WORKSPACE_TZ = "America/Sao_Paulo";

// ----------------------------------------------------------------------------
// Helpers de range — janelas rolling de duração igual (P2.1 fix).
// "today" = últimas 24h; "7d" = últimas 7×24h; "30d" = últimas 30×24h.
// Previous = mesma duração imediatamente antes de current.
// ----------------------------------------------------------------------------

type Period = { from: Date; to: Date };

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function daysAgoFromStartOfDay(base: Date, days: number): Date {
  const d = startOfDay(base);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

function rangeDays(range: DashboardRange): number {
  return range === "today" ? 1 : range === "7d" ? 7 : 30;
}

function resolveRange(
  range: DashboardRange,
  now: Date = new Date(),
): { current: Period; previous: Period } {
  const ms = rangeDays(range) * 86_400_000;
  const from = new Date(now.getTime() - ms);
  const prevFrom = new Date(from.getTime() - ms);
  return {
    current: { from, to: now },
    previous: { from: prevFrom, to: from },
  };
}

function trendPercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

// ----------------------------------------------------------------------------
// KPIs do /dashboard
// ----------------------------------------------------------------------------

async function countOpenedConversations(
  workspaceId: string,
  period: Period,
): Promise<number> {
  return prisma.conversation.count({
    where: {
      workspaceId,
      createdAt: { gte: period.from, lt: period.to },
    },
  });
}

async function countAtendimentos(
  workspaceId: string,
  period: Period,
): Promise<number> {
  // COUNT(DISTINCT) em raw SQL evita trazer todos os conversationIds à memória
  // (P3.5 fix). Parametrizado via tagged template — sem injection.
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(DISTINCT m."conversationId") AS count
    FROM "Message" m
    JOIN "Conversation" c ON c.id = m."conversationId"
    WHERE c."workspaceId" = ${workspaceId}
      AND m.direction = 'OUTBOUND'
      AND m."createdAt" >= ${period.from}
      AND m."createdAt" < ${period.to}
  `;
  return Number(rows[0]?.count ?? 0);
}

async function countNewLeads(
  workspaceId: string,
  period: Period,
): Promise<number> {
  return prisma.contact.count({
    where: {
      workspaceId,
      createdAt: { gte: period.from, lt: period.to },
    },
  });
}

async function buildDashboardKpis(
  workspaceId: string,
  range: DashboardRange,
): Promise<DashboardKpi[]> {
  const { current, previous } = resolveRange(range);

  const [
    openedCurrent,
    openedPrev,
    atendimentosCurrent,
    atendimentosPrev,
    leadsCurrent,
    leadsPrev,
  ] = await Promise.all([
    countOpenedConversations(workspaceId, current),
    countOpenedConversations(workspaceId, previous),
    countAtendimentos(workspaceId, current),
    countAtendimentos(workspaceId, previous),
    countNewLeads(workspaceId, current),
    countNewLeads(workspaceId, previous),
  ]);

  return [
    {
      key: "openedConversations",
      value: openedCurrent,
      changePercent: trendPercent(openedCurrent, openedPrev),
    },
    { key: "avgResponseTime", value: null, changePercent: null },
    {
      key: "atendimentos",
      value: atendimentosCurrent,
      changePercent: trendPercent(atendimentosCurrent, atendimentosPrev),
    },
    {
      key: "newLeads",
      value: leadsCurrent,
      changePercent: trendPercent(leadsCurrent, leadsPrev),
    },
  ];
}

// ----------------------------------------------------------------------------
// Chart — conversas por dia (últimos 30 dias, bucket por dia local BR)
// ----------------------------------------------------------------------------

type RawDayBucket = { day: Date; count: bigint };

async function getConversationsPerDay(
  workspaceId: string,
  days: number = 30,
): Promise<DashboardChartPoint[]> {
  // Bucket pelo dia no fuso BR (P3.1 fix) — usuário vê "dia 15" como o dia 15
  // local, não UTC-shifted. `from` continua em UTC mas a classificação usa TZ.
  const from = daysAgoFromStartOfDay(new Date(), days - 1);
  const rows = await prisma.$queryRaw<RawDayBucket[]>`
    SELECT DATE_TRUNC('day', "createdAt" AT TIME ZONE ${WORKSPACE_TZ}) AS day,
           COUNT(*) AS count
    FROM "Conversation"
    WHERE "workspaceId" = ${workspaceId}
      AND "createdAt" >= ${from}
    GROUP BY day
    ORDER BY day ASC
  `;

  const byIso = new Map(
    rows.map((r) => [r.day.toISOString().slice(0, 10), Number(r.count)]),
  );
  const out: DashboardChartPoint[] = [];
  for (let i = 0; i < days; i += 1) {
    const d = daysAgoFromStartOfDay(new Date(), days - 1 - i);
    const iso = d.toISOString().slice(0, 10);
    out.push({ date: iso, count: byIso.get(iso) ?? 0 });
  }
  return out;
}

// ----------------------------------------------------------------------------
// Agent performance
// ----------------------------------------------------------------------------

async function getAgentPerformance(
  workspaceId: string,
  range: DashboardRange,
): Promise<AgentPerformance[]> {
  const { current } = resolveRange(range);

  const [atendimentosRows, resolvedRows] = await Promise.all([
    prisma.conversation.groupBy({
      by: ["assignedUserId"],
      where: {
        workspaceId,
        assignedUserId: { not: null },
        lastMessageAt: { gte: current.from, lt: current.to },
      },
      _count: { _all: true },
    }),
    prisma.conversation.groupBy({
      by: ["assignedUserId"],
      where: {
        workspaceId,
        assignedUserId: { not: null },
        status: "RESOLVED",
        resolvedAt: { gte: current.from, lt: current.to },
      },
      _count: { _all: true },
    }),
  ]);

  const byUser = new Map<string, { atendimentos: number; conversoes: number }>();
  for (const row of atendimentosRows) {
    if (!row.assignedUserId) continue;
    byUser.set(row.assignedUserId, {
      atendimentos: row._count._all,
      conversoes: 0,
    });
  }
  for (const row of resolvedRows) {
    if (!row.assignedUserId) continue;
    const entry = byUser.get(row.assignedUserId) ?? {
      atendimentos: 0,
      conversoes: 0,
    };
    entry.conversoes = row._count._all;
    byUser.set(row.assignedUserId, entry);
  }

  if (byUser.size === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: [...byUser.keys()] } },
    select: { id: true, name: true },
  });
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  return [...byUser.entries()]
    .map(([userId, counts]) => ({
      userId,
      userName: nameById.get(userId) ?? "—",
      atendimentos: counts.atendimentos,
      conversoes: counts.conversoes,
      taxa:
        counts.atendimentos === 0
          ? 0
          : Math.round((counts.conversoes / counts.atendimentos) * 100),
      tempoMedio: null,
    }))
    .sort((a, b) => b.atendimentos - a.atendimentos);
}

// ----------------------------------------------------------------------------
// /dashboard entrypoint
// ----------------------------------------------------------------------------

export async function getDashboardOverview(params: {
  workspaceId: string;
  range: DashboardRange;
}): Promise<DashboardOverview> {
  const [kpis, conversationsPerDay, agents] = await Promise.all([
    buildDashboardKpis(params.workspaceId, params.range),
    getConversationsPerDay(params.workspaceId, 30),
    getAgentPerformance(params.workspaceId, params.range),
  ]);
  return { kpis, conversationsPerDay, agents };
}

// ============================================================================
// /relatorios (17.2)
// ============================================================================

async function countResolved(
  workspaceId: string,
  period: Period,
): Promise<number> {
  return prisma.conversation.count({
    where: {
      workspaceId,
      status: "RESOLVED",
      resolvedAt: { gte: period.from, lt: period.to },
    },
  });
}

async function buildReportKpis(
  workspaceId: string,
  range: DashboardRange,
): Promise<ReportKpi[]> {
  const { current, previous } = resolveRange(range);
  const [totalCurrent, totalPrev, resolvedCurrent, resolvedPrev] =
    await Promise.all([
      countOpenedConversations(workspaceId, current),
      countOpenedConversations(workspaceId, previous),
      countResolved(workspaceId, current),
      countResolved(workspaceId, previous),
    ]);

  const resolutionRateCurrent =
    totalCurrent === 0 ? 0 : Math.round((resolvedCurrent / totalCurrent) * 100);
  const resolutionRatePrev =
    totalPrev === 0 ? 0 : Math.round((resolvedPrev / totalPrev) * 100);

  return [
    {
      key: "totalConversations",
      value: totalCurrent,
      unit: "count",
      changePercent: trendPercent(totalCurrent, totalPrev),
    },
    { key: "avgResponseTime", value: null, unit: "duration", changePercent: null },
    {
      key: "resolutionRate",
      value: resolutionRateCurrent,
      unit: "percent",
      changePercent: trendPercent(resolutionRateCurrent, resolutionRatePrev),
    },
    { key: "satisfaction", value: null, unit: "rating", changePercent: null },
  ];
}

async function getConversationsByInstance(
  workspaceId: string,
  range: DashboardRange,
): Promise<ConversationsByInstancePoint[]> {
  const { current } = resolveRange(range);

  const rows = await prisma.conversation.groupBy({
    by: ["instanceId"],
    where: {
      workspaceId,
      createdAt: { gte: current.from, lt: current.to },
    },
    _count: { _all: true },
  });

  if (rows.length === 0) return [];

  const instances = await prisma.instance.findMany({
    where: { id: { in: rows.map((r) => r.instanceId) } },
    select: { id: true, name: true, color: true },
  });
  const byId = new Map(instances.map((i) => [i.id, i]));

  return rows
    .map((r) => {
      const inst = byId.get(r.instanceId);
      return {
        instanceId: r.instanceId,
        instanceName: inst?.name ?? "Instância removida",
        instanceColor: inst?.color ?? "#94a3b8",
        conversations: r._count._all,
      };
    })
    .sort((a, b) => b.conversations - a.conversations);
}

type RawVolume = { day: Date; direction: "INBOUND" | "OUTBOUND"; count: bigint };

async function getMessageVolume(
  workspaceId: string,
  days: number,
): Promise<MessageVolumePoint[]> {
  // P3.2: range=today (days=1) rende 1 ponto só — LineChart não desenha linha.
  // Expandindo pra min 2 dias garante segmento visível; dia extra é "ontem"
  // sem mentir sobre o dado.
  const effectiveDays = Math.max(days, 2);
  const from = daysAgoFromStartOfDay(new Date(), effectiveDays - 1);

  const rows = await prisma.$queryRaw<RawVolume[]>`
    SELECT DATE_TRUNC('day', m."createdAt" AT TIME ZONE ${WORKSPACE_TZ}) AS day,
           m.direction AS direction,
           COUNT(*) AS count
    FROM "Message" m
    JOIN "Conversation" c ON c.id = m."conversationId"
    WHERE c."workspaceId" = ${workspaceId}
      AND m."createdAt" >= ${from}
    GROUP BY day, m.direction
    ORDER BY day ASC
  `;

  type Bucket = { received: number; sent: number };
  const byIso = new Map<string, Bucket>();
  for (const row of rows) {
    const iso = row.day.toISOString().slice(0, 10);
    const bucket = byIso.get(iso) ?? { received: 0, sent: 0 };
    if (row.direction === "INBOUND") bucket.received = Number(row.count);
    else bucket.sent = Number(row.count);
    byIso.set(iso, bucket);
  }

  const out: MessageVolumePoint[] = [];
  for (let i = 0; i < effectiveDays; i += 1) {
    const d = daysAgoFromStartOfDay(new Date(), effectiveDays - 1 - i);
    const iso = d.toISOString().slice(0, 10);
    const bucket = byIso.get(iso) ?? { received: 0, sent: 0 };
    out.push({ date: iso, received: bucket.received, sent: bucket.sent });
  }
  return out;
}

async function getConversationsByStatus(
  workspaceId: string,
  range: DashboardRange,
): Promise<ConversationsByStatusPoint[]> {
  const { current } = resolveRange(range);

  const rows = await prisma.conversation.groupBy({
    by: ["status"],
    where: {
      workspaceId,
      createdAt: { gte: current.from, lt: current.to },
    },
    _count: { _all: true },
  });

  const buckets: Record<ConversationsByStatusBucket, number> = {
    open: 0,
    resolved: 0,
    unassigned: 0,
  };
  for (const row of rows) {
    if (row.status === "RESOLVED") buckets.resolved += row._count._all;
    else if (row.status === "UNASSIGNED") buckets.unassigned += row._count._all;
    else buckets.open += row._count._all; // OPEN + REOPENED
  }

  return [
    { bucket: "open", count: buckets.open },
    { bucket: "resolved", count: buckets.resolved },
    { bucket: "unassigned", count: buckets.unassigned },
  ];
}

async function getTopPerformers(
  workspaceId: string,
  range: DashboardRange,
): Promise<TopPerformer[]> {
  const agents = await getAgentPerformance(workspaceId, range);
  return agents.slice(0, 5).map((a) => ({
    userId: a.userId,
    userName: a.userName,
    conversations: a.atendimentos,
    resolutionRate: a.taxa,
    avgResponseTime: a.tempoMedio,
  }));
}

export async function getReportStats(params: {
  workspaceId: string;
  range: DashboardRange;
}): Promise<ReportStats> {
  const days = rangeDays(params.range);
  const [
    kpis,
    conversationsByInstance,
    messageVolume,
    conversationsByStatus,
    topPerformers,
  ] = await Promise.all([
    buildReportKpis(params.workspaceId, params.range),
    getConversationsByInstance(params.workspaceId, params.range),
    getMessageVolume(params.workspaceId, days),
    getConversationsByStatus(params.workspaceId, params.range),
    getTopPerformers(params.workspaceId, params.range),
  ]);

  return {
    kpis,
    conversationsByInstance,
    messageVolume,
    conversationsByStatus,
    topPerformers,
  };
}
