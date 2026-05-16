import type {
  KpiCardData,
  VendedorData,
  ChartDataPoint,
  ReportKpiCardData,
  ConversasPorNumeroPoint,
  MessageVolumePoint,
  ConversasPorStatusPoint,
  TopPerformerData,
} from "@/types/report";
import type { QuickReply } from "@/types/quick-reply";
import type { TeamMember } from "@/types/user";

export const CURRENT_USER = { id: "u1", name: "Admin User" };

// ── Dashboard ──

export const MOCK_KPI_CARDS: KpiCardData[] = [
  {
    label: "Conversas Abertas",
    value: "142",
    change: "+12%",
    trend: "up",
    trendIsPositive: true,
    icon: "conversations",
  },
  {
    label: "Tempo Médio de Resposta",
    value: "2m 45s",
    change: "-8%",
    trend: "down",
    trendIsPositive: true,
    icon: "clock",
  },
  {
    label: "Atendimentos Hoje",
    value: "87",
    change: "+24%",
    trend: "up",
    trendIsPositive: true,
    icon: "check",
  },
  {
    label: "Leads Novos",
    value: "34",
    change: "+18%",
    trend: "up",
    trendIsPositive: true,
    icon: "user-plus",
  },
];

export const MOCK_CHART_DATA: ChartDataPoint[] = [
  { date: "15 Mar", conversas: 35 },
  { date: "16 Mar", conversas: 42 },
  { date: "17 Mar", conversas: 50 },
  { date: "18 Mar", conversas: 48 },
  { date: "19 Mar", conversas: 55 },
  { date: "20 Mar", conversas: 52 },
  { date: "21 Mar", conversas: 60 },
  { date: "22 Mar", conversas: 58 },
  { date: "23 Mar", conversas: 65 },
  { date: "24 Mar", conversas: 70 },
  { date: "25 Mar", conversas: 68 },
  { date: "26 Mar", conversas: 75 },
  { date: "27 Mar", conversas: 80 },
  { date: "28 Mar", conversas: 78 },
  { date: "29 Mar", conversas: 85 },
  { date: "30 Mar", conversas: 82 },
  { date: "31 Mar", conversas: 90 },
  { date: "2 Abr", conversas: 88 },
  { date: "4 Abr", conversas: 95 },
  { date: "6 Abr", conversas: 100 },
  { date: "8 Abr", conversas: 105 },
  { date: "10 Abr", conversas: 110 },
  { date: "12 Abr", conversas: 120 },
  { date: "13 Abr", conversas: 130 },
];

export const MOCK_VENDEDORES: VendedorData[] = [
  { nome: "Maria Silva", atendimentos: 142, tempoMedio: "2m 30s", conversoes: 89, taxa: 62.7 },
  { nome: "João Santos", atendimentos: 128, tempoMedio: "3m 15s", conversoes: 76, taxa: 59.4 },
  { nome: "Ana Costa", atendimentos: 115, tempoMedio: "2m 45s", conversoes: 68, taxa: 59.1 },
  { nome: "Pedro Lima", atendimentos: 98, tempoMedio: "4m 10s", conversoes: 52, taxa: 53.1 },
  { nome: "Carla Souza", atendimentos: 87, tempoMedio: "3m 30s", conversoes: 45, taxa: 51.7 },
];

// ── Relatórios ──

export const MOCK_REPORT_KPIS: ReportKpiCardData[] = [
  {
    label: "Total de Conversas",
    value: "1.247",
    change: "+24%",
    trend: "up",
    trendIsPositive: true,
    icon: "conversations",
  },
  {
    label: "Tempo Médio de Resposta",
    value: "3m 12s",
    change: "-12%",
    trend: "down",
    trendIsPositive: true,
    icon: "clock",
  },
  {
    label: "Taxa de Resolução",
    value: "89,2%",
    change: "+8%",
    trend: "up",
    trendIsPositive: true,
    icon: "check",
  },
  {
    label: "Satisfação do Cliente",
    value: "4,7",
    valueSuffix: "/5",
    change: "+5%",
    trend: "up",
    trendIsPositive: true,
    icon: "star",
  },
];

export const MOCK_CONVERSAS_POR_NUMERO: ConversasPorNumeroPoint[] = [
  { id: "n1", name: "Vendas SP", conversas: 142, color: "var(--color-info)" },
  { id: "n2", name: "Suporte RJ", conversas: 87, color: "var(--color-warning)" },
  { id: "n3", name: "Marketing CE", conversas: 56, color: "var(--color-danger)" },
  { id: "n4", name: "Financeiro SC", conversas: 34, color: "var(--color-success)" },
  { id: "n5", name: "Parcerias DF", conversas: 23, color: "var(--color-secondary-600)" },
];

export const MOCK_MESSAGE_VOLUME: MessageVolumePoint[] = [
  { date: "15 Mar", recebidas: 145, enviadas: 178 },
  { date: "16 Mar", recebidas: 152, enviadas: 189 },
  { date: "17 Mar", recebidas: 148, enviadas: 165 },
  { date: "18 Mar", recebidas: 161, enviadas: 201 },
  { date: "19 Mar", recebidas: 155, enviadas: 188 },
  { date: "20 Mar", recebidas: 167, enviadas: 212 },
  { date: "21 Mar", recebidas: 172, enviadas: 225 },
  { date: "22 Mar", recebidas: 168, enviadas: 198 },
  { date: "23 Mar", recebidas: 175, enviadas: 234 },
  { date: "24 Mar", recebidas: 181, enviadas: 241 },
  { date: "25 Mar", recebidas: 178, enviadas: 229 },
  { date: "26 Mar", recebidas: 185, enviadas: 248 },
  { date: "27 Mar", recebidas: 192, enviadas: 267 },
  { date: "28 Mar", recebidas: 188, enviadas: 251 },
  { date: "29 Mar", recebidas: 195, enviadas: 278 },
  { date: "30 Mar", recebidas: 202, enviadas: 289 },
  { date: "31 Mar", recebidas: 198, enviadas: 271 },
  { date: "1 Abr", recebidas: 205, enviadas: 298 },
  { date: "2 Abr", recebidas: 212, enviadas: 312 },
  { date: "3 Abr", recebidas: 208, enviadas: 294 },
  { date: "4 Abr", recebidas: 215, enviadas: 321 },
  { date: "5 Abr", recebidas: 222, enviadas: 335 },
  { date: "6 Abr", recebidas: 218, enviadas: 318 },
  { date: "7 Abr", recebidas: 225, enviadas: 342 },
  { date: "8 Abr", recebidas: 232, enviadas: 356 },
  { date: "9 Abr", recebidas: 228, enviadas: 339 },
  { date: "10 Abr", recebidas: 235, enviadas: 365 },
  { date: "11 Abr", recebidas: 242, enviadas: 379 },
  { date: "12 Abr", recebidas: 238, enviadas: 362 },
  { date: "13 Abr", recebidas: 245, enviadas: 388 },
];

export const MOCK_CONVERSAS_POR_STATUS: ConversasPorStatusPoint[] = [
  { id: "s1", name: "Abertas", value: 142, color: "var(--color-info)" },
  { id: "s2", name: "Resolvidas", value: 289, color: "var(--color-success)" },
  { id: "s3", name: "Pendentes", value: 56, color: "var(--color-warning)" },
];

export const MOCK_TOP_PERFORMERS: TopPerformerData[] = [
  { nome: "Maria Silva", conversas: 142, tempoMedio: "2m 30s", taxaResolucao: 94.3 },
  { nome: "João Santos", conversas: 128, tempoMedio: "3m 15s", taxaResolucao: 91.2 },
  { nome: "Ana Costa", conversas: 115, tempoMedio: "2m 45s", taxaResolucao: 88.7 },
  { nome: "Pedro Lima", conversas: 98, tempoMedio: "4m 10s", taxaResolucao: 85.4 },
  { nome: "Carla Souza", conversas: 87, tempoMedio: "3m 30s", taxaResolucao: 82.1 },
];

// ── Atendentes (mock legado — chat/conversas ainda usam; números/contatos já usam backend real) ──

export const MOCK_AGENTS = [
  { id: "a1", name: "Mariana S." },
  { id: "a2", name: "João S." },
  { id: "a3", name: "Ana C." },
  { id: "a4", name: "Pedro L." },
  { id: "a5", name: "Carlos S." },
  { id: "a6", name: "Rafael A." },
  { id: "a7", name: "Beatriz M." },
  { id: "a8", name: "Lucas F." },
];

// ── Respostas Rápidas ──

export const MOCK_QUICK_REPLIES: QuickReply[] = [
  {
    id: "qr1",
    workspaceId: "w1",
    shortcut: "saudacao",
    category: "boas-vindas",
    title: "Saudação Inicial",
    content: "Olá {{nome_cliente}}! Seja bem-vindo(a) à nossa plataforma. Como posso ajudá-lo(a) hoje?",
    mediaUrl: null,
    mediaType: null,
    createdAt: "2026-03-10T10:00:00Z",
  },
  {
    id: "qr2",
    workspaceId: "w1",
    shortcut: "preco",
    category: "vendas",
    title: "Tabela de Preços",
    content: "Olá! Nossos planos começam em R$ 99/mês para até 3 usuários. Temos também planos Profissional (R$ 299/mês) e Empresarial (R$ 699/mês). Qual atenderia melhor suas necessidades?",
    mediaUrl: "/placeholder-precos.png",
    mediaType: "image/png",
    createdAt: "2026-03-12T14:00:00Z",
  },
  {
    id: "qr3",
    workspaceId: "w1",
    shortcut: "horario",
    category: "suporte",
    title: "Horário de Atendimento",
    content: "Nosso horário de atendimento é de segunda a sexta, das 9h às 18h. Aos sábados atendemos das 9h às 13h. Estamos fechados aos domingos e feriados.",
    mediaUrl: null,
    mediaType: null,
    createdAt: "2026-03-14T09:30:00Z",
  },
  {
    id: "qr4",
    workspaceId: "w1",
    shortcut: "demo",
    category: "vendas",
    title: "Agendar Demonstração",
    content: "Que ótimo que você tem interesse em conhecer melhor nossa plataforma, {{nome_cliente}}! Podemos agendar uma demonstração gratuita de 30 minutos. Qual seria o melhor dia e horário para você?",
    mediaUrl: null,
    mediaType: null,
    createdAt: "2026-03-16T11:00:00Z",
  },
  {
    id: "qr5",
    workspaceId: "w1",
    shortcut: "obrigado",
    category: "boas-vindas",
    title: "Agradecimento",
    content: "Muito obrigado pelo contato, {{nome_cliente}}! Ficamos à disposição para qualquer outra dúvida. Tenha um ótimo dia!",
    mediaUrl: null,
    mediaType: null,
    createdAt: "2026-03-18T16:00:00Z",
  },
  {
    id: "qr6",
    workspaceId: "w1",
    shortcut: "suporte-tecnico",
    category: "suporte",
    title: "Suporte Técnico",
    content: "Olá {{nome_cliente}}, entendi sua dificuldade. Para agilizar o atendimento, pode me informar: (1) qual dispositivo está usando, (2) qual navegador e versão, (3) uma descrição detalhada do erro?",
    mediaUrl: null,
    mediaType: null,
    createdAt: "2026-03-20T08:00:00Z",
  },
  {
    id: "qr7",
    workspaceId: "w1",
    shortcut: "orcamento",
    category: "vendas",
    title: "Envio de Orçamento",
    content: "Olá {{nome_cliente}}, conforme combinado, segue o orçamento personalizado para o seu negócio. Fico à disposição para esclarecer qualquer dúvida e seguir com os próximos passos.",
    mediaUrl: "/placeholder-orcamento.png",
    mediaType: "application/pdf",
    createdAt: "2026-03-22T15:00:00Z",
  },
];

// ── Equipe ──

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "u1",
    workspaceId: "w1",
    name: "Admin User",
    email: "admin@plataforma.com",
    role: "ADMIN",
    memberStatus: "ACTIVE",
    avatarUrl: null,
    joinedAt: "2026-01-01T00:00:00Z",
    lastActiveAt: "2026-04-16T09:30:00Z",
  },
  {
    id: "u2",
    workspaceId: "w1",
    name: "Maria Silva",
    email: "maria.silva@plataforma.com",
    role: "SUPERVISOR",
    memberStatus: "ACTIVE",
    avatarUrl: null,
    joinedAt: "2026-01-08T10:00:00Z",
    lastActiveAt: "2026-04-16T08:15:00Z",
  },
  {
    id: "u3",
    workspaceId: "w1",
    name: "João Santos",
    email: "joao.santos@plataforma.com",
    role: "AGENT",
    memberStatus: "ACTIVE",
    avatarUrl: null,
    joinedAt: "2026-01-15T09:00:00Z",
    lastActiveAt: "2026-04-15T18:45:00Z",
  },
  {
    id: "u4",
    workspaceId: "w1",
    name: "Ana Costa",
    email: "ana.costa@plataforma.com",
    role: "AGENT",
    memberStatus: "ACTIVE",
    avatarUrl: null,
    joinedAt: "2026-02-01T14:00:00Z",
    lastActiveAt: "2026-04-16T07:20:00Z",
  },
  {
    id: "u5",
    workspaceId: "w1",
    name: "Pedro Lima",
    email: "pedro.lima@plataforma.com",
    role: "SUPERVISOR",
    memberStatus: "ACTIVE",
    avatarUrl: null,
    joinedAt: "2026-02-10T11:30:00Z",
    lastActiveAt: "2026-04-14T16:00:00Z",
  },
  {
    id: "u6",
    workspaceId: "w1",
    name: "Carla Souza",
    email: "carla.souza@plataforma.com",
    role: "AGENT",
    memberStatus: "INACTIVE",
    avatarUrl: null,
    joinedAt: "2026-02-20T08:00:00Z",
    lastActiveAt: "2026-03-28T12:00:00Z",
  },
  {
    id: "u7",
    workspaceId: "w1",
    name: "Rafael Almeida",
    email: "rafael.almeida@plataforma.com",
    role: "AGENT",
    memberStatus: "PENDING",
    avatarUrl: null,
    joinedAt: "2026-04-14T10:00:00Z",
    lastActiveAt: null,
  },
  {
    id: "u8",
    workspaceId: "w1",
    name: "Beatriz Mendes",
    email: "beatriz.mendes@plataforma.com",
    role: "AGENT",
    memberStatus: "PENDING",
    avatarUrl: null,
    joinedAt: "2026-04-15T15:30:00Z",
    lastActiveAt: null,
  },
];

