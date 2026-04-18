import type { Contact, ContactTableRow, ConversaHistorico, NotaInterna } from "@/types/contact";
import type { Tag } from "@/types/tag";
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
import type { Notification } from "@/types/notification";

export const CURRENT_USER = { id: "u1", name: "Admin User" };

export const MOCK_TAGS: Tag[] = [
  { id: "t1", workspaceId: "w1", name: "Lead Quente", color: "#D94F3A" },
  { id: "t2", workspaceId: "w1", name: "Vendas", color: "#4f5a63" },
  { id: "t3", workspaceId: "w1", name: "Cliente", color: "#4CAF50" },
  { id: "t4", workspaceId: "w1", name: "Demonstração", color: "#F59E0B" },
  { id: "t5", workspaceId: "w1", name: "VIP", color: "#7C3AED" },
  { id: "t6", workspaceId: "w1", name: "Suporte", color: "#4CAF50" },
  { id: "t7", workspaceId: "w1", name: "Lead Frio", color: "#8a96a3" },
  { id: "t8", workspaceId: "w1", name: "Retorno", color: "#128C7E" },
  { id: "t9", workspaceId: "w1", name: "Orçamento", color: "#F59E0B" },
];

export const MOCK_CONTACTS: Contact[] = [
  {
    id: "c1",
    workspaceId: "w1",
    name: "Ana Silva",
    phone: "+55 34 9 9999-1234",
    email: "ana.silva@empresa.com",
    avatarUrl: null,
    source: null,
    assignedUserId: "u1",
    createdAt: "2026-04-10T14:30:00Z",
    updatedAt: "2026-04-15T08:00:00Z",
    tags: [MOCK_TAGS[0], MOCK_TAGS[1]],
  },
  {
    id: "c2",
    workspaceId: "w1",
    name: "Carlos Mendes",
    phone: "+55 21 9 8888-2345",
    email: "carlos.mendes@tech.com",
    avatarUrl: null,
    source: null,
    assignedUserId: "u2",
    createdAt: "2026-04-12T09:00:00Z",
    updatedAt: "2026-04-14T10:00:00Z",
    tags: [MOCK_TAGS[2]],
  },
  {
    id: "c3",
    workspaceId: "w1",
    name: "Beatriz Costa",
    phone: "+55 11 9 7777-3456",
    email: "beatriz@startup.io",
    avatarUrl: null,
    source: null,
    assignedUserId: "u3",
    createdAt: "2026-04-13T08:00:00Z",
    updatedAt: "2026-04-15T07:00:00Z",
    tags: [MOCK_TAGS[0], MOCK_TAGS[3]],
  },
  {
    id: "c4",
    workspaceId: "w1",
    name: "Pedro Santos",
    phone: "+55 47 9 6666-4567",
    email: "pedro.santos@corp.com.br",
    avatarUrl: null,
    source: null,
    assignedUserId: "u4",
    createdAt: "2026-04-09T10:00:00Z",
    updatedAt: "2026-04-10T10:00:00Z",
    tags: [MOCK_TAGS[2], MOCK_TAGS[4]],
  },
  {
    id: "c5",
    workspaceId: "w1",
    name: "Mariana Lima",
    phone: "+55 85 9 5555-5678",
    email: "mariana.lima@gmail.com",
    avatarUrl: null,
    source: null,
    assignedUserId: "u5",
    createdAt: "2026-04-11T15:00:00Z",
    updatedAt: "2026-04-15T09:30:00Z",
    tags: [MOCK_TAGS[5]],
  },
  {
    id: "c6",
    workspaceId: "w1",
    name: "Roberto Alves",
    phone: "+55 61 9 4444-6789",
    email: "roberto@consultoria.com",
    avatarUrl: null,
    source: null,
    assignedUserId: "u6",
    createdAt: "2026-04-08T12:00:00Z",
    updatedAt: "2026-04-01T10:00:00Z",
    tags: [MOCK_TAGS[6]],
  },
  {
    id: "c7",
    workspaceId: "w1",
    name: "Julia Mendes",
    phone: "+55 19 9 3333-7890",
    email: "julia.mendes@design.studio",
    avatarUrl: null,
    source: null,
    assignedUserId: "u3",
    createdAt: "2026-04-07T11:00:00Z",
    updatedAt: "2026-04-15T09:00:00Z",
    tags: [MOCK_TAGS[2], MOCK_TAGS[7]],
  },
  {
    id: "c8",
    workspaceId: "w1",
    name: "Fernando Dias",
    phone: "+55 27 9 2222-8901",
    email: "fernando.dias@industria.com.br",
    avatarUrl: null,
    source: null,
    assignedUserId: "u7",
    createdAt: "2026-04-06T09:00:00Z",
    updatedAt: "2026-04-15T06:00:00Z",
    tags: [MOCK_TAGS[0], MOCK_TAGS[8]],
  },
];

// Dados enriquecidos para a tabela de contatos (simula JOIN com conversas e usuários)
export const MOCK_CONTACTS_TABLE: ContactTableRow[] = [
  { contact: MOCK_CONTACTS[0], responsavel: "Maria Silva", conversasCount: 8, ultimoContato: "2026-04-15T08:00:00Z" },
  { contact: MOCK_CONTACTS[1], responsavel: "João Santos", conversasCount: 24, ultimoContato: "2026-04-14T10:00:00Z" },
  { contact: MOCK_CONTACTS[2], responsavel: "Ana Costa", conversasCount: 5, ultimoContato: "2026-04-15T07:00:00Z" },
  { contact: MOCK_CONTACTS[3], responsavel: "Pedro Lima", conversasCount: 42, ultimoContato: "2026-04-10T10:00:00Z" },
  { contact: MOCK_CONTACTS[4], responsavel: "Carla Souza", conversasCount: 12, ultimoContato: "2026-04-15T09:30:00Z" },
  { contact: MOCK_CONTACTS[5], responsavel: "Roberto Alves", conversasCount: 2, ultimoContato: "2026-04-01T10:00:00Z" },
  { contact: MOCK_CONTACTS[6], responsavel: "Beatriz Costa", conversasCount: 18, ultimoContato: "2026-04-15T09:00:00Z" },
  { contact: MOCK_CONTACTS[7], responsavel: "Lucas Ferreira", conversasCount: 6, ultimoContato: "2026-04-15T06:00:00Z" },
];


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

// ── Contatos: Histórico de conversas ──

export const MOCK_HISTORICO: Record<string, ConversaHistorico[]> = {
  c1: [
    { id: "h1", data: "2026-04-15T08:00:00Z", descricao: "Solicitou informações sobre plano empresarial", atendidoPor: "Maria Silva", duracao: "15 min" },
    { id: "h2", data: "2026-04-12T14:20:00Z", descricao: "Follow-up sobre proposta comercial enviada", atendidoPor: "Maria Silva", duracao: "20 min" },
    { id: "h3", data: "2026-04-10T14:30:00Z", descricao: "Primeiro contato via indicação", atendidoPor: "Sistema", duracao: "" },
  ],
  c2: [
    { id: "h4", data: "2026-04-14T10:45:00Z", descricao: "Cliente solicitou informações sobre plano empresarial", atendidoPor: "Maria Silva", duracao: "15 min" },
    { id: "h5", data: "2026-04-12T14:20:00Z", descricao: "Demonstração do produto realizada com sucesso", atendidoPor: "Maria Silva", duracao: "45 min" },
    { id: "h6", data: "2026-04-10T14:30:00Z", descricao: "Primeiro contato via formulário do site", atendidoPor: "Sistema", duracao: "" },
  ],
  c3: [
    { id: "h7", data: "2026-04-15T07:00:00Z", descricao: "Agendamento de demonstração confirmado", atendidoPor: "Ana Costa", duracao: "10 min" },
    { id: "h8", data: "2026-04-13T09:00:00Z", descricao: "Lead qualificado via campanha de marketing", atendidoPor: "Sistema", duracao: "" },
  ],
  c4: [
    { id: "h9", data: "2026-04-10T10:00:00Z", descricao: "Renovação de contrato discutida", atendidoPor: "Pedro Lima", duracao: "30 min" },
    { id: "h10", data: "2026-04-05T16:00:00Z", descricao: "Suporte técnico para integração de API", atendidoPor: "Pedro Lima", duracao: "1h 20 min" },
    { id: "h11", data: "2026-03-20T11:00:00Z", descricao: "Onboarding do cliente VIP concluído", atendidoPor: "Maria Silva", duracao: "2h" },
  ],
  c5: [
    { id: "h12", data: "2026-04-15T09:30:00Z", descricao: "Ticket de suporte resolvido", atendidoPor: "Carla Souza", duracao: "25 min" },
    { id: "h13", data: "2026-04-14T08:00:00Z", descricao: "Reportou erro na plataforma", atendidoPor: "Carla Souza", duracao: "15 min" },
  ],
  c6: [
    { id: "h14", data: "2026-04-01T10:00:00Z", descricao: "Email de follow-up enviado sem resposta", atendidoPor: "Roberto Alves", duracao: "5 min" },
    { id: "h15", data: "2026-03-15T14:00:00Z", descricao: "Primeiro contato via LinkedIn", atendidoPor: "Sistema", duracao: "" },
  ],
  c7: [
    { id: "h16", data: "2026-04-15T09:00:00Z", descricao: "Retorno sobre proposta de design", atendidoPor: "Beatriz Costa", duracao: "35 min" },
    { id: "h17", data: "2026-04-13T11:00:00Z", descricao: "Apresentação de portfólio de serviços", atendidoPor: "Beatriz Costa", duracao: "50 min" },
    { id: "h18", data: "2026-04-07T11:00:00Z", descricao: "Cliente indicada por parceiro", atendidoPor: "Sistema", duracao: "" },
  ],
  c8: [
    { id: "h19", data: "2026-04-15T06:00:00Z", descricao: "Orçamento detalhado enviado por email", atendidoPor: "Lucas Ferreira", duracao: "20 min" },
    { id: "h20", data: "2026-04-12T10:00:00Z", descricao: "Reunião para levantamento de requisitos", atendidoPor: "Lucas Ferreira", duracao: "1h" },
    { id: "h21", data: "2026-04-06T09:00:00Z", descricao: "Lead captado em evento do setor", atendidoPor: "Sistema", duracao: "" },
  ],
};

// ── Contatos: Notas internas ──

export const MOCK_CONTACT_NOTAS: Record<string, NotaInterna[]> = {
  c1: [
    { id: "n1", autor: "Maria Silva", data: "2026-04-14T11:00:00Z", conteudo: "Cliente muito interessado no plano empresarial. Enviar proposta até sexta." },
    { id: "n2", autor: "João Santos", data: "2026-04-12T15:30:00Z", conteudo: "Indicado por parceiro estratégico. Tratar com prioridade." },
  ],
  c2: [
    { id: "n3", autor: "Maria Silva", data: "2026-04-14T11:00:00Z", conteudo: "Cliente muito interessado. Agendar follow-up na próxima semana." },
    { id: "n4", autor: "João Santos", data: "2026-04-12T15:30:00Z", conteudo: "Empresa de médio porte com cerca de 50 funcionários. Budget aprovado." },
  ],
  c3: [
    { id: "n5", autor: "Ana Costa", data: "2026-04-15T07:30:00Z", conteudo: "Demonstração agendada para amanhã às 14h. Preparar ambiente de testes." },
  ],
  c4: [
    { id: "n6", autor: "Pedro Lima", data: "2026-04-10T11:00:00Z", conteudo: "Cliente VIP — conta corporativa com 3 anos de relacionamento." },
    { id: "n7", autor: "Maria Silva", data: "2026-04-05T17:00:00Z", conteudo: "Negociação de renovação em andamento. Desconto de 15% autorizado." },
  ],
  c5: [
    { id: "n8", autor: "Carla Souza", data: "2026-04-15T09:45:00Z", conteudo: "Bug reportado resolvido na versão 2.3.1. Cliente satisfeito." },
  ],
  c6: [],
  c7: [
    { id: "n9", autor: "Beatriz Costa", data: "2026-04-15T09:15:00Z", conteudo: "Interessada em pacote de design + desenvolvimento. Enviar portfólio completo." },
  ],
  c8: [
    { id: "n10", autor: "Lucas Ferreira", data: "2026-04-15T06:30:00Z", conteudo: "Orçamento de R$ 45.000 enviado. Aguardando aprovação da diretoria." },
  ],
};

// ── Contatos: Origens ──

export const MOCK_CONTACT_ORIGENS: Record<string, string> = {
  c1: "Indicação",
  c2: "Formulário do site",
  c3: "Campanha de marketing",
  c4: "Indicação",
  c5: "Orgânico",
  c6: "LinkedIn",
  c7: "Parceiro",
  c8: "Evento",
};

// ── Atendentes (mock legado — chat/contacts/conversas ainda usam; números já usa backend real) ──

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

// ── Notificações ──

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "ntf1",
    type: "CONVERSATION_ASSIGNED",
    title: "Nova conversa atribuída",
    description: "Ana Silva foi atribuída a você",
    createdAt: "2026-04-16T09:15:00Z",
    read: false,
    actionUrl: "/conversas?contact=c1",
    actorName: "Ana Silva",
  },
  {
    id: "ntf2",
    type: "MENTION",
    title: "João Santos mencionou você",
    description: "\"@admin pode dar uma olhada neste caso?\"",
    createdAt: "2026-04-16T08:45:00Z",
    read: false,
    actionUrl: "/conversas?contact=c2",
    actorName: "João Santos",
  },
  {
    id: "ntf3",
    type: "NUMBER_DISCONNECTED",
    title: "Número desconectado",
    description: "Atendimento MG perdeu conexão com o WhatsApp",
    createdAt: "2026-04-16T07:30:00Z",
    read: false,
    actionUrl: "/numeros",
    actorName: null,
  },
  {
    id: "ntf4",
    type: "TEAM_INVITE_ACCEPTED",
    title: "Convite aceito",
    description: "Rafael Almeida entrou na equipe como Atendente",
    createdAt: "2026-04-15T16:20:00Z",
    read: true,
    actionUrl: "/configuracoes",
    actorName: "Rafael Almeida",
  },
  {
    id: "ntf5",
    type: "NEW_CONTACT",
    title: "Novo contato capturado",
    description: "Beatriz Costa adicionada via campanha de marketing",
    createdAt: "2026-04-15T11:00:00Z",
    read: true,
    actionUrl: "/contatos",
    actorName: "Beatriz Costa",
  },
  {
    id: "ntf6",
    type: "CONVERSATION_ASSIGNED",
    title: "Nova conversa atribuída",
    description: "Pedro Santos foi atribuído a você",
    createdAt: "2026-04-14T14:05:00Z",
    read: true,
    actionUrl: "/conversas?contact=c4",
    actorName: "Pedro Santos",
  },
];
