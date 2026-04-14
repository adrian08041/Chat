# Arquitetura do Projeto — Plataforma WhatsApp Multi-Números
## Stack: Next.js 14+ (App Router) · Evolution API · PostgreSQL · Prisma

---

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                 │
│         Next.js App Router (React + Server Components)│
└──────────────┬──────────────────────┬────────────────┘
               │ HTTP/REST            │ WebSocket
               ▼                      ▼
┌──────────────────────┐   ┌─────────────────────┐
│   Next.js API Routes │   │   Socket.io Server   │
│   /api/*             │   │   (mensagens real-time)│
└──────────┬───────────┘   └──────────┬──────────┘
           │                          │
           ▼                          ▼
┌──────────────────────────────────────────────────────┐
│                  CAMADA DE SERVIÇOS                   │
│  AuthService · ChatService · ContactService · etc.   │
└──────────┬───────────────────────────┬───────────────┘
           │                           │
           ▼                           ▼
┌────────────────────┐     ┌────────────────────────┐
│   PostgreSQL       │     │   Evolution API         │
│   (Prisma ORM)     │     │   (WhatsApp connection) │
└────────────────────┘     └────────────────────────┘
```

---

## Estrutura de Pastas

```
whatsapp-platform/
│
├── .env                          # Variáveis de ambiente
├── .env.example                  # Template das variáveis
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── docker-compose.yml            # PostgreSQL + Evolution API local
│
├── prisma/
│   ├── schema.prisma             # Schema do banco
│   ├── migrations/               # Migrações automáticas
│   └── seed.ts                   # Dados iniciais (admin, etc.)
│
├── src/
│   │
│   ├── app/                      # ========== APP ROUTER (PÁGINAS) ==========
│   │   ├── layout.tsx            # Layout raiz (providers, sidebar)
│   │   ├── page.tsx              # Redirect para /dashboard
│   │   │
│   │   ├── (auth)/               # Grupo de rotas públicas (sem sidebar)
│   │   │   ├── layout.tsx        # Layout limpo (sem sidebar)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── esqueci-senha/
│   │   │   │   └── page.tsx
│   │   │   └── convite/[token]/
│   │   │       └── page.tsx      # Aceitar convite de equipe
│   │   │
│   │   ├── (dashboard)/          # Grupo de rotas protegidas (com sidebar)
│   │   │   ├── layout.tsx        # Layout com sidebar + topbar + auth guard
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx      # Visão geral, KPIs, gráficos
│   │   │   │
│   │   │   ├── conversas/
│   │   │   │   ├── page.tsx      # Inbox principal (3 colunas)
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Conversa específica (mobile)
│   │   │   │
│   │   │   ├── contatos/
│   │   │   │   ├── page.tsx      # Lista de contatos / CRM
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Perfil do contato
│   │   │   │
│   │   │   ├── numeros/
│   │   │   │   └── page.tsx      # Gerenciar números WhatsApp
│   │   │   │
│   │   │   ├── equipe/
│   │   │   │   └── page.tsx      # Gerenciar vendedores
│   │   │   │
│   │   │   ├── respostas-rapidas/
│   │   │   │   └── page.tsx      # Templates de mensagens
│   │   │   │
│   │   │   ├── relatorios/
│   │   │   │   └── page.tsx      # Métricas e relatórios
│   │   │   │
│   │   │   └── configuracoes/
│   │   │       ├── page.tsx      # Config geral
│   │   │       ├── perfil/
│   │   │       │   └── page.tsx
│   │   │       └── webhooks/
│   │   │           └── page.tsx
│   │   │
│   │   └── api/                  # ========== API ROUTES (BACKEND) ==========
│   │       │
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts  # NextAuth handlers
│   │       │
│   │       ├── webhooks/
│   │       │   └── evolution/
│   │       │       └── route.ts  # Recebe eventos da Evolution API
│   │       │
│   │       ├── conversations/
│   │       │   ├── route.ts      # GET lista, POST criar
│   │       │   └── [id]/
│   │       │       ├── route.ts  # GET, PATCH (atribuir, resolver)
│   │       │       ├── messages/
│   │       │       │   └── route.ts  # GET mensagens, POST enviar
│   │       │       ├── transfer/
│   │       │       │   └── route.ts  # POST transferir conversa
│   │       │       └── notes/
│   │       │           └── route.ts  # GET, POST notas internas
│   │       │
│   │       ├── contacts/
│   │       │   ├── route.ts      # GET lista, POST criar
│   │       │   └── [id]/
│   │       │       └── route.ts  # GET, PATCH, DELETE
│   │       │
│   │       ├── instances/        # Números/instâncias WhatsApp
│   │       │   ├── route.ts      # GET lista, POST criar instância
│   │       │   └── [id]/
│   │       │       ├── route.ts  # GET, DELETE
│   │       │       ├── connect/
│   │       │       │   └── route.ts  # POST gerar QR Code
│   │       │       └── disconnect/
│   │       │           └── route.ts  # POST desconectar
│   │       │
│   │       ├── team/
│   │       │   ├── route.ts      # GET lista, POST convidar
│   │       │   └── [id]/
│   │       │       └── route.ts  # PATCH, DELETE
│   │       │
│   │       ├── quick-replies/
│   │       │   ├── route.ts      # GET, POST
│   │       │   └── [id]/
│   │       │       └── route.ts  # PATCH, DELETE
│   │       │
│   │       ├── reports/
│   │       │   ├── overview/
│   │       │   │   └── route.ts  # GET KPIs gerais
│   │       │   └── agents/
│   │       │       └── route.ts  # GET performance por vendedor
│   │       │
│   │       └── socket/
│   │           └── route.ts      # Setup Socket.io (ou usar Server Actions)
│   │
│   ├── components/               # ========== COMPONENTES UI ==========
│   │   │
│   │   ├── ui/                   # shadcn/ui (gerado automaticamente)
│   │   │   ├── button.tsx        # npx shadcn@latest add button
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── command.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── form.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── sonner.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── collapsible.tsx
│   │   │   └── chart.tsx
│   │   │
│   │   ├── layout/               # Componentes de layout
│   │   │   ├── sidebar.tsx
│   │   │   ├── topbar.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── page-header.tsx
│   │   │
│   │   ├── chat/                 # Componentes do chat
│   │   │   ├── conversation-list.tsx
│   │   │   ├── conversation-item.tsx
│   │   │   ├── chat-window.tsx
│   │   │   ├── message-bubble.tsx
│   │   │   ├── message-input.tsx
│   │   │   ├── message-audio.tsx
│   │   │   ├── message-image.tsx
│   │   │   ├── contact-panel.tsx
│   │   │   ├── transfer-modal.tsx
│   │   │   └── quick-reply-picker.tsx
│   │   │
│   │   ├── dashboard/            # Componentes do dashboard
│   │   │   ├── kpi-card.tsx
│   │   │   ├── conversations-chart.tsx
│   │   │   └── agent-leaderboard.tsx
│   │   │
│   │   ├── contacts/             # Componentes de contatos
│   │   │   ├── contact-table.tsx
│   │   │   ├── contact-form.tsx
│   │   │   └── contact-slide-over.tsx
│   │   │
│   │   ├── instances/            # Componentes de números
│   │   │   ├── instance-card.tsx
│   │   │   ├── qr-code-modal.tsx
│   │   │   └── instance-form.tsx
│   │   │
│   │   └── team/                 # Componentes de equipe
│   │       ├── member-table.tsx
│   │       ├── invite-modal.tsx
│   │       └── role-select.tsx
│   │
│   ├── lib/                      # ========== UTILITÁRIOS E CONFIGS ==========
│   │   ├── prisma.ts             # Instância singleton do Prisma
│   │   ├── auth.ts               # Config NextAuth (providers, callbacks)
│   │   ├── evolution.ts          # Cliente HTTP para Evolution API
│   │   ├── socket.ts             # Config Socket.io client
│   │   ├── utils.ts              # Funções utilitárias gerais
│   │   ├── constants.ts          # Constantes (cores dos números, etc.)
│   │   └── validations.ts        # Schemas Zod para validação
│   │
│   ├── services/                 # ========== LÓGICA DE NEGÓCIO ==========
│   │   ├── conversation.service.ts
│   │   ├── message.service.ts
│   │   ├── contact.service.ts
│   │   ├── instance.service.ts   # CRUD instâncias Evolution API
│   │   ├── team.service.ts
│   │   ├── quick-reply.service.ts
│   │   ├── report.service.ts
│   │   ├── notification.service.ts
│   │   └── webhook.service.ts    # Processa eventos da Evolution
│   │
│   ├── hooks/                    # ========== REACT HOOKS ==========
│   │   ├── use-conversations.ts  # SWR/React Query para conversas
│   │   ├── use-messages.ts       # Mensagens com real-time
│   │   ├── use-socket.ts         # Hook do Socket.io
│   │   ├── use-contacts.ts
│   │   ├── use-instances.ts
│   │   └── use-debounce.ts
│   │
│   ├── stores/                   # ========== ESTADO GLOBAL ==========
│   │   ├── conversation-store.ts # Zustand — conversa selecionada, filtros
│   │   ├── ui-store.ts           # Sidebar aberta/fechada, modais
│   │   └── notification-store.ts # Notificações em tempo real
│   │
│   ├── types/                    # ========== TIPAGENS ==========
│   │   ├── conversation.ts
│   │   ├── message.ts
│   │   ├── contact.ts
│   │   ├── instance.ts
│   │   ├── user.ts
│   │   ├── quick-reply.ts
│   │   ├── report.ts
│   │   └── evolution.ts          # Tipos dos payloads da Evolution API
│   │
│   └── middleware.ts             # Auth middleware (protege rotas)
│
├── public/
│   ├── logo.svg
│   ├── favicon.ico
│   └── sounds/
│       └── notification.mp3      # Som de nova mensagem
│
└── tests/                        # Testes (opcional mas recomendado)
    ├── api/
    └── components/
```

---

## Variáveis de Ambiente (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/whatsapp_platform"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gerar-com-openssl-rand-base64-32"

# Evolution API
EVOLUTION_API_URL="http://localhost:8080"
EVOLUTION_API_KEY="sua-api-key-aqui"

# Socket.io (se usar servidor separado)
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"

# Upload de mídias (opcional)
UPLOAD_DIR="./uploads"

# App
NEXT_PUBLIC_APP_NAME="NomeDaPlataforma"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Docker Compose (Dev Local)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: whatsapp_platform
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  evolution-api:
    image: atendai/evolution-api:latest
    environment:
      - SERVER_URL=http://localhost:8080
      - AUTHENTICATION_API_KEY=sua-api-key-aqui
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://user:password@postgres:5432/evolution
    ports:
      - "8080:8080"
    depends_on:
      - postgres

volumes:
  pgdata:
```

---

## Libs Recomendadas (package.json)

```
# Core
next, react, react-dom, typescript

# Backend
prisma, @prisma/client          → ORM
next-auth                       → Autenticação
zod                             → Validação de dados
bcryptjs                        → Hash de senhas
socket.io, socket.io-client     → Real-time

# Frontend — UI
shadcn/ui                       → Componentes base (Button, Card, Dialog, Table, etc.)
tailwindcss                     → Estilos (requisito do shadcn)
lucide-react                    → Ícones (já vem com shadcn)
class-variance-authority (cva)  → Variantes de estilo (já vem com shadcn)
clsx + tailwind-merge           → Classes condicionais (já vem com shadcn)

# Frontend — Dados e Estado
zustand                         → Estado global (leve)
@tanstack/react-query           → Cache e fetching
react-hook-form + @hookform/resolvers → Formulários (integra com shadcn Form)
date-fns                        → Formatação de datas
recharts                        → Gráficos do dashboard (integra com shadcn Chart)

# Opcionais
framer-motion                   → Animações
react-dropzone                  → Upload de arquivos
emoji-mart                      → Picker de emojis
sonner                          → Toasts (integra com shadcn Sonner)
```

---

## Fluxo Principal: Mensagem Recebida

```
1. Cliente envia mensagem no WhatsApp
        ↓
2. Evolution API recebe a mensagem
        ↓
3. Evolution API dispara webhook → POST /api/webhooks/evolution
        ↓
4. webhook.service.ts processa o evento:
   - Identifica a instância (número) de origem
   - Busca ou cria o contato no banco
   - Busca ou cria a conversa
   - Salva a mensagem no banco
   - Verifica regras de atribuição automática
        ↓
5. Emite evento via Socket.io → "new_message"
        ↓
6. Frontend recebe via useSocket hook
   - Atualiza a lista de conversas
   - Mostra notificação + som
   - Se a conversa está aberta, renderiza o balão
```

---

## Fluxo: Vendedor Responde

```
1. Vendedor digita e clica "Enviar"
        ↓
2. Frontend → POST /api/conversations/[id]/messages
   body: { content: "texto", type: "text" }
        ↓
3. message.service.ts:
   - Salva mensagem no banco (status: "sending")
   - Chama Evolution API → POST /message/sendText
   - Atualiza status → "sent"
        ↓
4. Socket.io emite "message_sent" → atualiza UI
```

---

## Notas de Arquitetura

1. **Services separados das routes**: As API routes devem ser finas
   (validar input → chamar service → retornar response).
   A lógica fica nos services para ser reutilizável.

2. **Prisma singleton**: Importante no Next.js pra evitar
   múltiplas conexões em dev (hot reload).

3. **Socket.io no Next.js**: Pode rodar junto via custom server
   ou como serviço separado (recomendado em produção).

4. **Middleware**: Protege todas as rotas do grupo (dashboard).
   Redireciona para /login se não autenticado.

5. **Webhook da Evolution**: Essa rota NÃO deve ter auth.
   Use uma chave secreta no header para validar.

6. **React Query vs SWR**: Ambos funcionam. React Query tem
   mais features para mutations e cache invalidation.

7. **Zustand vs Context**: Zustand é mais simples para estado
   global como "conversa selecionada" e "filtros ativos".
```
