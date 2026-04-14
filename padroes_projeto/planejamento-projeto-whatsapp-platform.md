# Planejamento do Projeto — Plataforma WhatsApp Multi-Números

> **Documento de Planejamento Técnico e Funcional**
> Última atualização: 14/04/2026

---

## 1. Visão Geral

### 1.1 O que é
Plataforma web que centraliza conversas de múltiplos números de WhatsApp em uma única interface, permitindo que vendedores/atendentes gerenciem todos os atendimentos de forma organizada, com distribuição de leads, histórico unificado e métricas de performance.

### 1.2 Problema que resolve
- Vendedores usando múltiplos celulares/números sem controle
- Mensagens perdidas e leads sem resposta
- Gestor sem visibilidade da performance da equipe
- Sem histórico centralizado das conversas
- Impossibilidade de transferir atendimentos entre vendedores

### 1.3 Público-alvo
Empresas com equipe de vendas/suporte que utilizam WhatsApp como canal principal de comunicação com clientes.

---

## 2. Stack Tecnológica

| Camada          | Tecnologia                        | Justificativa                                      |
|-----------------|-----------------------------------|-----------------------------------------------------|
| Framework       | Next.js 14+ (App Router)          | Front + Back acoplados, SSR, API Routes             |
| Linguagem       | TypeScript                        | Tipagem, produtividade, menos bugs                  |
| Banco de Dados  | PostgreSQL                        | Robusto, relacional, bom com Prisma                 |
| ORM             | Prisma                            | Migrações, tipagem automática, query builder         |
| WhatsApp        | Evolution API                     | Gratuita, self-hosted, suporte a múltiplas instâncias|
| Autenticação    | NextAuth.js                       | Integrado ao Next.js, sessões no banco               |
| Real-time       | Socket.io                         | WebSocket para mensagens em tempo real               |
| Estado Global   | Zustand                           | Leve, simples, sem boilerplate                       |
| Data Fetching   | TanStack React Query              | Cache, mutations, invalidação automática             |
| Estilos         | Tailwind CSS                      | Produtividade, consistência, responsivo              |
| UI Components   | shadcn/ui                         | Componentes acessíveis, customizáveis, copy-paste    |
| Validação       | Zod                               | Validação de input nas API routes e formulários      |
| Gráficos        | Recharts                          | Dashboard de métricas e relatórios                   |
| Ícones          | Lucide React                      | Já incluso no shadcn/ui, consistente                 |
| Deploy          | VPS (Hostinger/DigitalOcean)      | Self-hosted junto com Evolution API                  |
| Containers      | Docker + Docker Compose           | Padronização do ambiente                             |

---

## 3. Funcionalidades

### 3.1 MVP (Fase 1) — Essencial para lançar

#### Autenticação e Usuários
- [ ] Login com email e senha
- [ ] Recuperação de senha por email
- [ ] Papéis: Admin, Supervisor, Vendedor
- [ ] Convite de novos membros por link/email
- [ ] Perfil do usuário (nome, avatar, status online/offline/pausado)

#### Gestão de Números (Instâncias)
- [ ] Conectar número via QR Code (Evolution API)
- [ ] Desconectar número
- [ ] Listar números conectados com status (online/offline)
- [ ] Atribuir alias/label ao número (ex: "Vendas SP", "Suporte")
- [ ] Atribuir cor identificadora ao número (visível no inbox)
- [ ] Atribuir vendedores responsáveis por número

#### Inbox (Tela Principal)
- [ ] Lista de conversas com busca e filtros
- [ ] Filtros: Todas, Minhas, Não atribuídas, Resolvidas
- [ ] Indicador visual de qual número originou a conversa (cor)
- [ ] Badge de mensagens não lidas
- [ ] Preview da última mensagem e timestamp
- [ ] Área de chat com balões estilo WhatsApp
- [ ] Suporte a tipos de mensagem: texto, imagem, áudio, vídeo, documento
- [ ] Input de mensagem com emoji picker e anexo
- [ ] Painel lateral com dados do contato
- [ ] Notas internas (visíveis apenas para a equipe)
- [ ] Atribuir conversa a um vendedor
- [ ] Transferir conversa entre vendedores
- [ ] Marcar conversa como resolvida/reabrir
- [ ] Notificação sonora + visual de nova mensagem
- [ ] Atualização em tempo real (Socket.io)

#### Contatos
- [ ] Lista de contatos com busca
- [ ] Criar/editar contato (nome, email, telefone, notas)
- [ ] Sistema de tags (Lead Quente, Cliente, Suporte, etc.)
- [ ] Histórico de conversas por contato
- [ ] Atribuir contato a um vendedor

#### Respostas Rápidas
- [ ] CRUD de templates de mensagem
- [ ] Atalho por shortcut (ex: digitar "/preco" no chat)
- [ ] Categorização (Boas-vindas, Vendas, Suporte)
- [ ] Suporte a variáveis ({{nome_cliente}}, {{numero}})
- [ ] Suporte a anexar mídia no template

#### Webhook da Evolution API
- [ ] Receber eventos: mensagem recebida, status de mensagem, conexão/desconexão
- [ ] Processar e salvar mensagens no banco
- [ ] Criar contato automaticamente se novo
- [ ] Criar conversa automaticamente se nova
- [ ] Disparar evento Socket.io para o frontend

---

### 3.2 Fase 2 — Crescimento

#### Dashboard e Relatórios
- [ ] KPIs: conversas abertas, tempo médio de resposta, atendimentos do dia, leads novos
- [ ] Gráfico de conversas por dia (últimos 30 dias)
- [ ] Gráfico de conversas por número
- [ ] Ranking de performance dos vendedores
- [ ] Filtro por período (hoje, 7 dias, 30 dias, custom)
- [ ] Exportar relatório em CSV/PDF

#### Distribuição Automática de Leads
- [ ] Round-robin entre vendedores online
- [ ] Distribuição por número (vendedor X atende número Y)
- [ ] Regra de capacidade máxima (máx. conversas simultâneas por vendedor)
- [ ] Fila de espera quando todos ocupados

#### Melhorias no Chat
- [ ] Responder mensagem específica (reply/quote)
- [ ] Encaminhar mensagem
- [ ] Visualizar status de leitura (enviado, entregue, lido)
- [ ] Digitando... indicador
- [ ] Busca dentro da conversa

#### Melhorias em Contatos
- [ ] Campos customizados (empresa, cargo, etc.)
- [ ] Importar contatos via CSV
- [ ] Exportar contatos
- [ ] Merge de contatos duplicados

---

### 3.3 Fase 3 — Avançado

#### Automações
- [ ] Mensagem automática de boas-vindas por número
- [ ] Mensagem de ausência (fora do horário)
- [ ] Chatbot simples baseado em palavras-chave
- [ ] Integração com IA (Claude/GPT) para sugestão de respostas

#### Campanhas (Disparo em Massa)
- [ ] Criar campanha com template
- [ ] Selecionar lista de contatos/tags
- [ ] Agendar envio
- [ ] Relatório de entrega/leitura

#### Integrações
- [ ] Webhook de saída (notificar sistemas externos)
- [ ] API pública para integração com CRM/ERP
- [ ] Integração com Google Sheets
- [ ] Integração com calendário (agendar follow-ups)

#### Multi-tenant (se virar SaaS)
- [ ] Cada empresa com workspace isolado
- [ ] Planos e limites (números, vendedores, mensagens)
- [ ] Billing com Stripe
- [ ] Onboarding guiado

---

## 4. Modelagem do Banco de Dados (Prisma Schema)

### Diagrama de Entidades

```
User ──────────── Team/Workspace
 │                      │
 ├── Conversation ──────┤
 │       │              │
 │       ├── Message    │
 │       └── Note       │
 │                      │
 ├── Contact ───────────┤
 │                      │
 ├── Instance ──────────┤
 │   (número WhatsApp)  │
 │                      │
 └── QuickReply ────────┘
```

### Tabelas Principais

**User** (vendedor/admin)
- id, name, email, password, role (ADMIN/SUPERVISOR/AGENT)
- avatar, status (ONLINE/OFFLINE/AWAY), createdAt

**Instance** (número de WhatsApp conectado)
- id, name, phone, evolutionInstanceName, color
- status (CONNECTED/DISCONNECTED), qrCode
- userId (quem conectou), createdAt

**Contact** (cliente/lead)
- id, name, phone (unique), email, avatarUrl
- tags (relation), notes, customFields (JSON)
- assignedUserId, createdAt

**Conversation** (conversa)
- id, contactId, instanceId
- assignedUserId (vendedor responsável)
- status (OPEN/PENDING/RESOLVED)
- lastMessageAt, unreadCount
- createdAt, resolvedAt

**Message** (mensagem)
- id, conversationId, contactId
- direction (INBOUND/OUTBOUND)
- type (TEXT/IMAGE/AUDIO/VIDEO/DOCUMENT)
- content, mediaUrl, mediaType
- status (SENDING/SENT/DELIVERED/READ/FAILED)
- whatsappMessageId (ID da Evolution)
- sentByUserId (se outbound), createdAt

**Note** (nota interna)
- id, conversationId, userId
- content, createdAt

**QuickReply** (resposta rápida)
- id, shortcut, category, content
- mediaUrl, mediaType, createdAt

**Tag**
- id, name, color

**ContactTag** (relação N:N)
- contactId, tagId

---

## 5. Endpoints da API

### Autenticação
```
POST   /api/auth/[...nextauth]     → NextAuth handlers
```

### Instâncias (Números WhatsApp)
```
GET    /api/instances               → Listar números conectados
POST   /api/instances               → Criar nova instância
GET    /api/instances/:id           → Detalhes da instância
DELETE /api/instances/:id           → Remover instância
POST   /api/instances/:id/connect   → Gerar QR Code
POST   /api/instances/:id/disconnect → Desconectar
GET    /api/instances/:id/status    → Status da conexão
```

### Conversas
```
GET    /api/conversations                → Listar (com filtros e paginação)
GET    /api/conversations/:id            → Detalhes da conversa
PATCH  /api/conversations/:id            → Atualizar (atribuir, resolver)
POST   /api/conversations/:id/transfer   → Transferir para outro vendedor
```

### Mensagens
```
GET    /api/conversations/:id/messages   → Listar mensagens (paginado)
POST   /api/conversations/:id/messages   → Enviar mensagem
```

### Notas Internas
```
GET    /api/conversations/:id/notes      → Listar notas
POST   /api/conversations/:id/notes      → Criar nota
```

### Contatos
```
GET    /api/contacts                     → Listar (busca, filtros, paginação)
POST   /api/contacts                     → Criar contato
GET    /api/contacts/:id                 → Detalhes + histórico
PATCH  /api/contacts/:id                 → Atualizar
DELETE /api/contacts/:id                 → Remover
POST   /api/contacts/import              → Importar CSV (Fase 2)
```

### Equipe
```
GET    /api/team                         → Listar membros
POST   /api/team                         → Convidar membro
PATCH  /api/team/:id                     → Atualizar papel/permissões
DELETE /api/team/:id                     → Remover membro
```

### Respostas Rápidas
```
GET    /api/quick-replies                → Listar
POST   /api/quick-replies                → Criar
PATCH  /api/quick-replies/:id            → Atualizar
DELETE /api/quick-replies/:id            → Remover
```

### Relatórios (Fase 2)
```
GET    /api/reports/overview             → KPIs gerais
GET    /api/reports/agents               → Performance por vendedor
GET    /api/reports/instances            → Volume por número
GET    /api/reports/export               → Exportar CSV/PDF
```

### Webhooks
```
POST   /api/webhooks/evolution           → Recebe eventos da Evolution API
```

---

## 6. Eventos Real-time (Socket.io)

### Servidor emite para o cliente
```
new_message          → Nova mensagem recebida
message_status       → Status atualizado (enviado, entregue, lido)
conversation_updated → Conversa atribuída, transferida ou resolvida
instance_status      → Número conectou/desconectou
agent_status         → Vendedor ficou online/offline
notification         → Notificação genérica
```

### Cliente emite para o servidor
```
join_conversation    → Entrar na sala da conversa (receber updates)
leave_conversation   → Sair da sala
typing               → Vendedor está digitando
mark_read            → Marcar mensagens como lidas
```

---

## 7. Estrutura de Telas

### Páginas Públicas (sem auth)
| Rota                  | Tela                      |
|-----------------------|---------------------------|
| /login                | Login                     |
| /esqueci-senha        | Recuperação de senha      |
| /convite/:token       | Aceitar convite da equipe |

### Páginas Protegidas (com auth)
| Rota                  | Tela                      | Descrição                              |
|-----------------------|---------------------------|----------------------------------------|
| /dashboard            | Dashboard                 | KPIs, gráficos, ranking               |
| /conversas            | Inbox                     | Tela principal 3 colunas               |
| /conversas/:id        | Conversa (mobile)         | Chat individual (responsivo)           |
| /contatos             | Contatos                  | Lista CRM com tags                     |
| /contatos/:id         | Perfil do Contato         | Detalhes + histórico                   |
| /numeros              | Números WhatsApp          | Cards dos números conectados           |
| /equipe               | Equipe                    | Tabela de vendedores                   |
| /respostas-rapidas    | Respostas Rápidas         | Templates de mensagem                  |
| /relatorios           | Relatórios                | Métricas e gráficos                    |
| /configuracoes        | Configurações             | Config geral da plataforma             |
| /configuracoes/perfil | Perfil                    | Dados e senha do usuário               |

---

## 8. Cronograma Estimado

### Fase 1 — MVP (6-8 semanas)

| Semana  | Entrega                                               |
|---------|--------------------------------------------------------|
| 1       | Setup projeto, Docker, Prisma schema, auth (login)    |
| 2       | Integração Evolution API (conectar número, QR Code)   |
| 3       | Webhook + processamento de mensagens recebidas         |
| 4       | Inbox: lista de conversas + chat + envio de mensagens  |
| 5       | Socket.io (real-time), notificações, contatos          |
| 6       | Atribuição, transferência, notas internas              |
| 7       | Respostas rápidas, gestão de equipe, ajustes de UI     |
| 8       | Testes, correções, deploy em VPS                       |

### Fase 2 — Crescimento (4-6 semanas)
- Dashboard + relatórios
- Distribuição automática de leads
- Melhorias no chat (reply, status, busca)
- Import/export de contatos

### Fase 3 — Avançado (4-6 semanas)
- Automações e chatbot
- Campanhas em massa
- API pública
- Integrações externas

---

## 9. Custos Estimados (Mensal)

| Item                        | Custo estimado       |
|-----------------------------|----------------------|
| VPS 4-8GB RAM               | R$ 80 – 150/mês     |
| Domínio                     | R$ 40 – 60/ano      |
| SSL (Let's Encrypt)         | Gratuito             |
| Evolution API               | Gratuito (open source)|
| PostgreSQL                  | Gratuito (self-hosted)|
| Next.js                     | Gratuito             |
| **Total infraestrutura**    | **~R$ 100 – 160/mês** |

> Comparativo: plataformas prontas como Intercom, Respond.io ou Zenvia
> cobram a partir de R$ 200-500+/mês com limites de agentes e mensagens.

---

## 10. Riscos e Mitigações

| Risco                                    | Impacto | Mitigação                                           |
|------------------------------------------|---------|------------------------------------------------------|
| Banimento do número pela Evolution API   | Alto    | Não usar para spam; ter números reserva; migrar para API oficial futuramente |
| Evolution API fora do ar / instável      | Médio   | Monitoramento, auto-restart com Docker, webhooks de status |
| Perda de mensagens por falha no webhook  | Alto    | Fila de processamento (Bull/Redis), retry automático, logs |
| Servidor sobrecarregado com muitas msgs  | Médio   | Otimizar queries, paginação, índices no banco, escalar VPS |
| Segurança (acesso não autorizado)        | Alto    | Middleware de auth, rate limiting, HTTPS, validação com Zod |
| Vendedor acessando dados de outro        | Médio   | Row-level security, filtros por userId em todas as queries |

---

## 11. Checklist de Setup Inicial

- [ ] Criar repositório Git
- [ ] `npx create-next-app@latest` com TypeScript + Tailwind + App Router
- [ ] Inicializar shadcn/ui: `npx shadcn@latest init`
- [ ] Instalar componentes shadcn/ui (ver seção 13)
- [ ] Instalar dependências extras (prisma, next-auth, socket.io, zustand, react-query, zod, recharts)
- [ ] Configurar Docker Compose (PostgreSQL + Evolution API)
- [ ] Criar schema Prisma e rodar primeira migração
- [ ] Configurar NextAuth com credentials provider
- [ ] Criar middleware de proteção de rotas
- [ ] Criar layout base (sidebar + topbar) com componentes shadcn
- [ ] Criar cliente HTTP para Evolution API (`lib/evolution.ts`)
- [ ] Configurar endpoint de webhook (`/api/webhooks/evolution`)
- [ ] Configurar Socket.io server
- [ ] Criar seed com usuário admin inicial
- [ ] Testar fluxo: conectar número → receber mensagem → responder

---

## 12. Padrões e Convenções

### Código
- **Commits**: Conventional Commits (feat:, fix:, chore:, docs:)
- **Branches**: main, develop, feature/*, fix/*
- **Naming**: camelCase para variáveis, PascalCase para componentes, kebab-case para arquivos
- **API responses**: `{ success: boolean, data?: T, error?: string }`

### Banco de Dados
- Timestamps em UTC
- Soft delete onde aplicável (deletedAt)
- Índices em campos de busca frequente (phone, email, conversationId)
- Paginação cursor-based para mensagens

### Frontend
- Server Components por padrão, Client Components apenas quando necessário (interatividade)
- Loading states com Skeleton (shadcn/ui)
- Error boundaries por seção
- Mobile-first no CSS
- Componentes shadcn/ui como base, customizações em cima

---

## 13. Componentes shadcn/ui — Mapeamento por Tela

### Instalação inicial (todos de uma vez)
```bash
npx shadcn@latest init
npx shadcn@latest add button input label card badge avatar \
  dropdown-menu dialog sheet table tabs tooltip separator \
  select textarea popover command scroll-area skeleton \
  toast sonner switch checkbox radio-group form \
  sidebar breadcrumb collapsible chart
```

### Mapeamento: Componente → Onde usar

#### Layout Global
| Componente shadcn     | Uso na plataforma                                      |
|-----------------------|---------------------------------------------------------|
| `Sidebar`             | Menu lateral principal com navegação                    |
| `Breadcrumb`          | Navegação hierárquica no topo das páginas               |
| `Collapsible`         | Submenus na sidebar (ex: Configurações)                 |
| `Avatar`              | Foto do vendedor no topbar e listas                     |
| `DropdownMenu`        | Menu do perfil (topbar), ações em tabelas               |
| `Tooltip`             | Dicas nos ícones da sidebar quando colapsada            |
| `Separator`           | Divisores visuais entre seções                          |
| `Sonner` / `Toast`    | Notificações de nova mensagem, erros, sucesso           |
| `Skeleton`            | Loading state em todas as telas                         |

#### Tela: Login
| Componente shadcn     | Uso                                                     |
|-----------------------|---------------------------------------------------------|
| `Card`                | Container do formulário de login                        |
| `Input`               | Campos email e senha                                    |
| `Label`               | Labels dos campos                                       |
| `Button`              | Botão "Entrar"                                          |
| `Form`                | Wrapper com validação (react-hook-form + zod)           |

#### Tela: Inbox (Conversas)
| Componente shadcn     | Uso                                                     |
|-----------------------|---------------------------------------------------------|
| `ScrollArea`          | Lista de conversas e área de mensagens (scroll suave)   |
| `Badge`               | Contador de não lidas, status da conversa, tags         |
| `Avatar`              | Foto do contato na lista e no chat                      |
| `Tabs`                | Filtros "Todas / Minhas / Não atribuídas / Resolvidas"  |
| `Input`               | Busca de conversas e campo de mensagem                  |
| `Button`              | Enviar mensagem, anexar arquivo                         |
| `Popover`             | Emoji picker, seletor de respostas rápidas              |
| `Sheet`               | Painel lateral do contato (mobile: abre como drawer)    |
| `Command`             | Busca rápida de respostas rápidas (cmd+k style)         |
| `Dialog`              | Modal de transferir conversa                            |
| `Select`              | Selecionar vendedor na transferência                    |
| `Textarea`            | Nota para o próximo atendente                           |
| `Separator`           | Divisores entre mensagens de datas diferentes           |

#### Tela: Dashboard
| Componente shadcn     | Uso                                                     |
|-----------------------|---------------------------------------------------------|
| `Card`                | KPI cards (conversas abertas, tempo médio, etc.)        |
| `Chart`               | Gráficos de volume, performance (wrapper do Recharts)   |
| `Table`               | Ranking de vendedores                                   |
| `Badge`               | Indicadores de tendência (↑ +12%, ↓ -5%)               |
| `Select`              | Filtro de período (7 dias, 30 dias, custom)             |

#### Tela: Contatos
| Componente shadcn     | Uso                                                     |
|-----------------------|---------------------------------------------------------|
| `Table`               | Lista principal de contatos                             |
| `Badge`               | Tags dos contatos (Lead Quente, Cliente, etc.)          |
| `Dialog`              | Modal de criar/editar contato                           |
| `Form`                | Formulário do contato com validação                     |
| `Input`               | Campos nome, telefone, email                            |
| `Select`              | Atribuir vendedor, selecionar tags                      |
| `Sheet`               | Slide-over com perfil completo do contato               |
| `Checkbox`            | Seleção múltipla para ações em lote                     |

#### Tela: Números (Instâncias)
| Componente shadcn     | Uso                                                     |
|-----------------------|---------------------------------------------------------|
| `Card`                | Card de cada número conectado                           |
| `Badge`               | Status "Conectado" / "Desconectado"                     |
| `Button`              | Conectar, desconectar, editar                           |
| `Dialog`              | Modal com QR Code para conectar                         |
| `Input`               | Alias/label do número                                   |
| `Avatar`              | Stack de vendedores atribuídos                          |

#### Tela: Equipe
| Componente shadcn     | Uso                                                     |
|-----------------------|---------------------------------------------------------|
| `Table`               | Lista de membros da equipe                              |
| `Badge`               | Status online/offline, papel (Admin, Vendedor)          |
| `Dialog`              | Modal de convidar novo membro                           |
| `Select`              | Selecionar papel do membro                              |
| `DropdownMenu`        | Menu de ações (editar, remover)                         |
| `Switch`              | Ativar/desativar membro                                 |

#### Tela: Respostas Rápidas
| Componente shadcn     | Uso                                                     |
|-----------------------|---------------------------------------------------------|
| `Card`                | Card de cada template                                   |
| `Badge`               | Shortcut ("/preco"), categoria                          |
| `Dialog`              | Modal de criar/editar resposta                          |
| `Textarea`            | Corpo da mensagem com variáveis                         |
| `Input`               | Campo shortcut e busca                                  |
| `Select`              | Categoria da resposta                                   |
| `Tabs`                | Filtro por categoria                                    |

#### Tela: Relatórios
| Componente shadcn     | Uso                                                     |
|-----------------------|---------------------------------------------------------|
| `Card`                | Cards de KPIs                                           |
| `Chart`               | Todos os gráficos (bar, line, pie)                      |
| `Table`               | Tabela de performance detalhada                         |
| `Select`              | Filtro de período, número, vendedor                     |
| `Button`              | Exportar CSV/PDF                                        |
| `Tabs`                | Abas entre tipos de relatório                           |

#### Tela: Configurações
| Componente shadcn     | Uso                                                     |
|-----------------------|---------------------------------------------------------|
| `Form`                | Formulário de configurações                             |
| `Input`               | Nome da empresa, URL do webhook                         |
| `Switch`              | Toggles (notificações, som, horário de funcionamento)   |
| `Select`              | Fuso horário, idioma                                    |
| `Tabs`                | Seções de configuração (Geral, Notificações, API)       |
| `Card`                | Agrupamento visual das seções                           |

### Componentes Custom (construir em cima do shadcn)
Esses não existem no shadcn e precisam ser criados do zero, mas usando os primitivos acima:

| Componente Custom         | Base shadcn utilizada                   |
|---------------------------|-----------------------------------------|
| `MessageBubble`           | Card + Badge + Avatar                   |
| `MessageInput`            | Input + Button + Popover                |
| `ConversationItem`        | Card + Avatar + Badge + Separator       |
| `ContactPanel`            | Sheet + Card + Badge + Form             |
| `QrCodeModal`             | Dialog + Skeleton                       |
| `KpiCard`                 | Card + Badge                            |
| `AgentLeaderboard`        | Table + Avatar + Badge                  |
| `NumberColorDot`          | Badge (customizado)                     |
| `TransferModal`           | Dialog + Command + Avatar + Textarea    |
| `QuickReplyPicker`        | Command + ScrollArea                    |
