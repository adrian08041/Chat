# STANDARDS — Padrões do Projeto

> **Plataforma WhatsApp Multi-Números**
> Documento obrigatório de validação. Toda nova feature DEVE ser validada contra este guia antes e durante a implementação.
> Última atualização: 14/04/2026

---

## Como Usar Este Documento

Antes de implementar qualquer feature:

1. Ler a seção **Checklist Rápido** (final do documento) e validar cada item.
2. Se houver dúvida sobre design, consultar a seção **Design System**.
3. Se houver dúvida sobre arquitetura, consultar a seção **Arquitetura e Código**.
4. Se houver dúvida sobre regras de negócio, voltar ao `prd-whatsapp-platform.md`.

> **Regra de ouro:** Se não está coberto aqui, siga o padrão existente no projeto. Se não existe padrão, discuta antes de implementar.

---

## 1. Design System — Emerald Ledger

### 1.1 Identidade Visual

| Atributo | Valor |
|----------|-------|
| Personalidade | Profissional, confiável, moderno |
| Cor-âncora | Verde — remete a finanças, sustentabilidade e clareza |
| Fontes | **Manrope** (headlines) + **Inter** (body/labels) |
| Modos | Claro (padrão) + Escuro |

### 1.2 Cores — Regra Absoluta

> **NUNCA** usar valores hexadecimais diretos no código de componentes.
> **SEMPRE** usar tokens do design system.

#### Paleta Principal

| Cor | Hex Base | Uso |
|-----|----------|-----|
| **Primary** | `#075E54` | Ações, CTAs, destaque principal |
| **Secondary** | `#128C7E` | Complemento, gradações, estados |
| **Tertiary** | `#607E6B` | Tags, rótulos, elementos neutros com personalidade |
| **Neutral** | `#F0F2F5` | Superfícies, fundos, textos auxiliares |
| **Danger** | `#D94F3A` | Ações destrutivas, erros |

#### Stops de Cada Cor

**Primary — #075E54**

| Stop | Hex | Uso |
|------|-----|-----|
| 900 | `#02211e` | Texto sobre fundo claro |
| 800 | `#043d36` | Bordas fortes |
| **600** | **`#075E54`** | **Cor principal** |
| 400 | `#0e8070` | Hover, estados ativos |
| 200 | `#17a893` | Ícones secundários |
| 100 | `#5fd0c4` | Fundos suaves |
| 50 | `#e6f4f2` | Background de destaque leve |

**Secondary — #128C7E**

| Stop | Hex | Uso |
|------|-----|-----|
| 900 | `#042e28` | Texto sobre claro |
| 800 | `#095c52` | Bordas |
| **600** | **`#128C7E`** | **Cor secundária** |
| 400 | `#1bb4a2` | Hover |
| 200 | `#42d4c3` | Ícones |
| 100 | `#8ee8de` | Fundos suaves |
| 50 | `#e8f5f3` | Background de destaque |

**Tertiary — #607E6B**

| Stop | Hex | Uso |
|------|-----|-----|
| 800 | `#1a2b20` | Texto |
| 600 | `#354d3c` | Bordas |
| **400** | **`#607E6B`** | **Cor terciária** |
| 200 | `#82a18c` | Ícones |
| 100 | `#a8c2b0` | Fundos |
| 50 | `#edf2ee` | Background leve |

**Neutral — #F0F2F5**

| Stop | Hex | Uso |
|------|-----|-----|
| 900 | `#1a1d20` | Texto primário |
| 800 | `#2e3338` | Texto secundário |
| 600 | `#4f5a63` | Texto terciário / ícones |
| 400 | `#8a96a3` | Placeholders |
| 200 | `#c5cdd6` | Bordas |
| 100 | `#dde2e8` | Bordas sutis |
| 50 | `#eef0f3` | Superfície elevada |
| 0 | `#F0F2F5` | Background de página |

**Semânticas**

| Cor | Hex | Uso |
|-----|-----|-----|
| Danger | `#D94F3A` | Ações destrutivas, erros |
| Danger Light | `#fdecea` | Background de alertas |

#### Regras de Uso de Cor

- Cor de identificação dos números WhatsApp vem de um **conjunto controlado de tokens** — nunca valores arbitrários.
- Cores de marca (`primary`, `secondary`, `tertiary`) para **elementos interativos e de destaque**.
- Tokens de superfície (`surface-bg`, `surface-card`) para **estrutura e layout**.
- Tokens de texto (`txt-primary`, `txt-secondary`, `txt-muted`) para **toda tipografia**.
- Tokens de borda para **separações e contornos**.

#### Superfícies

| Token | Claro | Escuro |
|-------|-------|--------|
| `surface-bg` | `#eef0f3` | `#111614` |
| `surface-card` | `#ffffff` | `#1c2320` |
| `surface-elevated` | `#f7f8fa` | `#222c28` |

#### Texto

| Token | Claro | Escuro |
|-------|-------|--------|
| Primário | `#1a1a1a` | `#e8ede9` |
| Secundário | `#5a6472` | `#8fa898` |
| Muted / Placeholder | `#8a96a3` | `#5c7066` |
| Sobre primário (botões) | `#ffffff` | `#ffffff` |

#### Bordas

| Token | Claro | Escuro |
|-------|-------|--------|
| Default | `#dde2e8` | `#2a3830` |
| Sutil | `#eef0f3` | `#1e2b25` |

#### Combinações Aprovadas

| Elemento | Background | Texto |
|----------|------------|-------|
| Botão primário | `#075E54` | `#ffffff` |
| Botão outlined | Transparente | `#075E54` |
| Chip ativo | `#e6f4f2` | `#075E54` |
| Card | `surface-card` | `txt-primary` |
| Input placeholder | — | `#8a96a3` |
| Ícone ativo | `#075E54` | `#ffffff` |
| Badge de tag | `#edf2ee` | `#607E6B` |

### 1.3 Tipografia

| Nível | Família | Tamanho | Peso | Uso |
|-------|---------|---------|------|-----|
| Display | Manrope | 48px | 800 | Títulos de página |
| H1 | Manrope | 32px | 700 | Seções principais |
| H2 | Manrope | 24px | 700 | Subtítulos |
| H3 | Manrope | 18px | 600 | Grupos |
| H4 | Manrope | 16px | 600 | Rótulos de seção |
| Body | Inter | 14px | 400 | Corpo de texto |
| Label | Inter | 12px | 500 | Chips, tags, metadados |
| Caption | Inter | 11px | 400 | Texto auxiliar |

```
https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap
```

### 1.4 Espaçamento

Escala baseada em **múltiplos de 4px**.

| Token | Valor | Uso |
|-------|-------|-----|
| `space-1` | 4px | Gap mínimo |
| `space-2` | 8px | Gap interno de ícones |
| `space-3` | 12px | Padding de chips |
| `space-4` | 16px | Padding interno de cards |
| `space-5` | 20px | Padding de cards |
| `space-6` | 24px | Espaço entre seções |
| `space-8` | 32px | Margem de componentes |
| `space-10` | 40px | Espaço de página |

### 1.5 Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `radius-sm` | 6px | Botões pequenos, badges |
| `radius-md` | 10px | Botões, inputs |
| `radius-lg` | 14–16px | Cards, modais |
| `radius-xl` | 24px | Cards grandes |
| `radius-full` | 9999px | Chips, avatares |

### 1.6 Sombras

| Token | Valor | Uso |
|-------|-------|-----|
| `shadow-sm` | `0 1px 3px rgba(0,0,0,.08)` | Cards padrão |
| `shadow-md` | `0 4px 12px rgba(0,0,0,.10)` | Cards elevados, dropdowns |

### 1.7 Componentes Visuais — Referência Rápida

#### Botões

| Variante | Background | Texto | Borda |
|----------|------------|-------|-------|
| **Primary** | `primary-600` | `#ffffff` | `primary-600` |
| **Secondary** | Transparente | Texto primário | `border-default` |
| **Inverted** | Texto primário | Surface | Texto primário |
| **Outlined** | Transparente | `primary-600` | `primary-600` |
| **Danger** | `danger` | `#ffffff` | `danger` |

Anatomia: `padding: 8px 18px` · `border-radius: radius-md` · `font: Inter 14px 500` · `border: 1.5px`

**Tamanhos:**

| Tamanho | Padding | Font |
|---------|---------|------|
| SM | 5px 12px | 12px |
| MD (padrão) | 8px 18px | 14px |
| LG | 12px 24px | 16px |

#### Botões de Ícone (Action Group)

| Variante | Background | Ícone |
|----------|------------|-------|
| Edit | `primary-600` | Lápis |
| Hierarchy | `secondary-600` | Nós |
| Tag | `tertiary-400` | Tag |
| Delete | `danger` | Lixeira |

Anatomia: `36×36px` · `border-radius: 8px` · ícone `15×15px` branco

#### Inputs

| Estado | Borda | Sombra |
|--------|-------|--------|
| Default | `border-default` 1.5px | — |
| Hover | `neutral-200` | — |
| Focus | `primary-600` | `0 0 0 3px rgba(7,94,84,.12)` |

Anatomia: `padding: 9px 12px` · `border-radius: radius-md` · `font: Inter 13–14px`

#### Ícones de Navegação

| Estado | Background | Cor do ícone |
|--------|------------|--------------|
| Ativo | `primary-600` | `#ffffff` |
| Inativo | Transparente | `txt-secondary` |
| Hover | `primary-50` | `primary-600` |

Anatomia: `padding: 10px` · `border-radius: 10px` · ícone `16–18px`

#### Cards

Anatomia: `border-radius: radius-lg` · `padding: space-5` · `background: surface-card` · `border: 1px solid border-sutil`

Variante elevada: adicionar `shadow-md`

#### Chips / Labels

| Variante | Background | Texto | Borda |
|----------|------------|-------|-------|
| Default | `surface-elevated` | `txt-secondary` | `border-default` 1.5px |
| Primary | `primary-50` | `primary-600` | Nenhuma |

Anatomia: `padding: 4px 12px` · `border-radius: radius-full` · `font: Inter 12px 500`

#### Divisores

| Variante | Altura | Cor |
|----------|--------|-----|
| Primary | 3px | `primary-600` |
| Secondary | 2px | `secondary-600` (70% opacidade) |
| Thin | 1px | `border-default` |

Todos com `border-radius: full`.

### 1.8 Modo Escuro

- O sistema suporta **modo escuro completo**.
- Cores de marca (primary, secondary, tertiary) **permanecem as mesmas**.
- Apenas fundos e textos invertem via tokens.
- Implementação: `<html data-theme="light">` ou `data-theme="dark"`.

---

## 2. Componentes UI

### 2.1 Hierarquia de Componentes

```
shadcn/ui (base)
  └── Componentes customizados do projeto (construídos sobre shadcn)
        └── ConversationItem, MessageBubble, ContactPanel, QrCodeModal, etc.
```

### 2.2 Regras de Componente

| Regra | Descrição |
|-------|-----------|
| **shadcn primeiro** | Sempre usar componentes existentes do `shadcn/ui` antes de criar customizados |
| **Custom apenas quando necessário** | Criar componente custom apenas quando representar necessidade clara da plataforma |
| **Tokens obrigatórios** | Usar tokens de design para cores, espaçamentos, radius, bordas, sombras e estados |
| **Sem cores hardcoded** | Nunca usar hex direto em componentes |
| **Estados obrigatórios** | Toda tela principal deve ter estados de: **loading** (Skeleton), **vazio** (com orientação), **erro** |
| **Responsividade** | Componentes devem ser responsivos e preservar estabilidade de layout |
| **Ícones** | Usar `Lucide React` (já incluso no shadcn/ui) |

### 2.3 Componentes Custom do Projeto

| Componente | Base shadcn | Contexto |
|------------|-------------|----------|
| `MessageBubble` | Card + Badge + Avatar | Chat |
| `MessageInput` | Input + Button + Popover | Chat |
| `ConversationItem` | Card + Avatar + Badge + Separator | Inbox |
| `ContactPanel` | Sheet + Card + Badge + Form | Chat lateral |
| `QrCodeModal` | Dialog + Skeleton | Conexão de número |
| `KpiCard` | Card + Badge | Dashboard |
| `TransferModal` | Dialog + Command + Avatar + Textarea | Transferência |
| `QuickReplyPicker` | Command + ScrollArea | Respostas rápidas |
| `NumberColorDot` | Badge (customizado) | Indicação de número |

---

## 3. Estado e Dados

### 3.1 Stack de Gerenciamento

| Ferramenta | Responsabilidade | Exemplos |
|------------|------------------|----------|
| **TanStack React Query** | Dados remotos, cache, mutations, invalidação | Conversas, mensagens, contatos, instâncias |
| **Zustand** | Estado global de UI / estado operacional local | Conversa selecionada, filtros da inbox, sidebar, modais, notificações |
| **Socket.io** | Eventos em tempo real | Nova mensagem, status de conversa, status de conexão |

### 3.2 Regras de Estado

- **NUNCA** duplicar server state dentro do Zustand.
- **SEMPRE** revalidar ou invalidar queries após mutations relevantes.
- **Server Components** por padrão; **Client Components** apenas quando necessário (interatividade).
- Eventos em tempo real devem atualizar **apenas dados necessários**, não recarregar tudo.

### 3.3 Padrões de Hook

- `use-conversations.ts` — React Query para conversas
- `use-messages.ts` — Mensagens com real-time
- `use-socket.ts` — Hook do Socket.io
- `use-contacts.ts` — Contatos
- `use-instances.ts` — Instâncias/números
- `use-debounce.ts` — Debounce para busca

---

## 4. Forms e Validação

| Regra | Detalhe |
|-------|---------|
| **Validação com Zod** | Backend E formulários |
| **react-hook-form** | Com resolvers do Zod para formulários complexos |
| **Mensagens de erro** | Claras e específicas — nunca genéricas |
| **Backend é verdade** | Nunca confiar apenas na validação do frontend |

---

## 5. Backend e API

### 5.1 Estrutura de API Routes

```
API Route (fina)
  1. Autenticar usuário
  2. Validar input (Zod)
  3. Chamar service
  4. Retornar resposta padronizada
```

### 5.2 Regras de Backend

| Regra | Detalhe |
|-------|---------|
| **Services separados** | Regras de negócio ficam em services, nunca nas routes |
| **Prisma como padrão** | SQL manual apenas quando houver necessidade clara de performance |
| **Formato consistente** | `{ success: boolean, data?: T, error?: string }` |
| **Permissões no backend** | Backend é fonte da verdade para permissões |
| **Filtro por workspace** | Dados **sempre** filtrados por `workspaceId` |
| **Frontend não decide permissão** | Frontend pode esconder UI, mas backend valida |

### 5.3 Regras de Permissão (Papéis)

| Ação | ADMIN | SUPERVISOR | AGENT |
|------|-------|------------|-------|
| Configurar workspace | ✅ | ❌ | ❌ |
| Gerenciar usuários | ✅ | ❌ | ❌ |
| Conectar/remover números | ✅ | ❌ | ❌ |
| Ver todas as conversas | ✅ | ✅ | ❌ |
| Assumir conversa não atribuída | ✅ | ✅ | ✅ (se permitido) |
| Transferir conversas | ✅ | ✅ | ❌ |
| Responder conversa atribuída a ele | ✅ | ✅ | ✅ |
| Responder conversa de outro | ✅ | ✅ | ❌ |
| Gerenciar tags e respostas rápidas | ✅ | ✅ (se permitido) | ❌ |
| Ver dashboard geral | ✅ | ✅ | ❌ |
| Aplicar tags | ✅ | ✅ | ✅ |
| Adicionar notas internas | ✅ | ✅ | ✅ |

### 5.4 Status de Conversa

| Status | Significado |
|--------|-------------|
| `UNASSIGNED` | Não atribuída |
| `OPEN` | Em atendimento |
| `WAITING_CUSTOMER` | Aguardando cliente |
| `RESOLVED` | Resolvida |
| `REOPENED` | Reaberta |

---

## 6. Integração com Evolution API

| Regra | Detalhe |
|-------|---------|
| **Cliente dedicado** | Centralizar chamadas em `lib/evolution.ts` |
| **Validação de webhook** | Verificar segredo antes de processar |
| **Idempotência** | Processamento de webhook deve ser idempotente |
| **Rastreabilidade** | Salvar IDs externos (`whatsappMessageId`, `evolutionInstanceName`) |
| **Falhas visíveis** | Erros de envio/processamento geram logs E estado visível na UI |
| **Rota sem auth** | Webhook é rota pública — proteger por chave secreta no header |

---

## 7. Banco de Dados

### 7.1 Regras Gerais

| Regra | Detalhe |
|-------|---------|
| **Migrations do Prisma** | Sempre usar migrations, nunca alterar schema manual |
| **Timestamps em UTC** | Todas as datas em UTC |
| **Soft delete** | Usar `deletedAt` onde fizer sentido operacional |
| **workspaceId obrigatório** | Toda entidade operacional deve ter `workspaceId` |
| **Paginação cursor-based** | Para mensagens e listas longas |

### 7.2 Índices Obrigatórios

Criar índices para buscas frequentes:

- `workspaceId`
- `phone`
- `conversationId`
- `instanceId`
- `assignedUserId`
- `lastMessageAt`
- `whatsappMessageId`
- `email`

### 7.3 Entidades Principais

```
Workspace → User, WhatsAppInstance, Contact, Conversation, Tag, QuickReply
WhatsAppInstance → Conversation (muitas)
Contact → Conversation (muitas), Tag (N:N)
Conversation → Message (muitas), ConversationNote (muitas), Tag (N:N)
```

---

## 8. Segurança

| Regra | Detalhe |
|-------|---------|
| **APIs protegidas** | Todas as APIs (exceto webhook) exigem usuário autenticado |
| **Filtro por workspace** | Dados sempre filtrados por `workspaceId` |
| **Validação com Zod** | Inputs validados no backend com Zod |
| **Hash de senhas** | Senhas armazenadas com hash seguro (bcryptjs) |
| **Webhook protegido** | Rota pública protegida por segredo no header |
| **Middleware de auth** | Protege todas as rotas do grupo `(dashboard)` |
| **Rate limiting** | Implementar em rotas sensíveis |

---

## 9. Qualidade

| Regra | Detalhe |
|-------|---------|
| **Critérios de aceite** | Toda funcionalidade crítica deve ter critério de aceite definido no PRD |
| **Testabilidade** | Fluxos de webhook, envio, permissão e atribuição devem ser testáveis |
| **Sem refatoração ampla** | Evitar refatorações que não se relacionem com a entrega atual |
| **Seguir padrões existentes** | Antes de introduzir nova abstração, seguir o que já existe |
| **Comentários úteis** | Explicar decisões não óbvias — não repetir o que o código já mostra |
| **Estados de UI** | Loading, vazio, erro — sempre presentes em telas principais |

---

## 10. Convenções de Código

| Aspecto | Padrão |
|---------|--------|
| **Commits** | Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`) |
| **Branches** | `main`, `develop`, `feature/*`, `fix/*` |
| **Variáveis** | `camelCase` |
| **Componentes** | `PascalCase` |
| **Arquivos** | `kebab-case` |
| **API responses** | `{ success: boolean, data?: T, error?: string }` |
| **CSS** | Tailwind CSS (requisito do shadcn/ui) com tokens do Emerald Ledger |

---

## 11. Real-time (Socket.io)

### Eventos do Servidor → Cliente

| Evento | Dispara quando |
|--------|---------------|
| `new_message` | Nova mensagem recebida |
| `message_status` | Status atualizado (enviado, entregue, lido) |
| `conversation_updated` | Conversa atribuída, transferida ou resolvida |
| `instance_status` | Número conectou/desconectou |
| `agent_status` | Vendedor ficou online/offline |
| `notification` | Notificação genérica |

### Eventos do Cliente → Servidor

| Evento | Dispara quando |
|--------|---------------|
| `join_conversation` | Entrar na sala da conversa |
| `leave_conversation` | Sair da sala |
| `typing` | Vendedor está digitando |
| `mark_read` | Marcar mensagens como lidas |

---

## 12. Performance

| Regra | Detalhe |
|-------|---------|
| **Paginação** | Inbox, mensagens, contatos — nunca buscar tudo de uma vez |
| **Cursor-based** | Mensagens usam paginação por cursor |
| **Eventos granulares** | Real-time atualiza apenas dados necessários |
| **Índices** | Campos de busca frequente devem ter índice (ver seção 7.2) |
| **Prisma singleton** | Evitar múltiplas conexões em dev (hot reload) |

---

## 13. Escopo do MVP — O Que Está Fora

> Consultar antes de implementar algo que pareça "avançado demais":

- ❌ Round-robin automático entre atendentes
- ❌ Regras avançadas de distribuição
- ❌ Chatbot / IA
- ❌ Campanhas e disparos em massa
- ❌ Billing SaaS, planos, checkout
- ❌ Multi-workspace selecionável
- ❌ API pública para clientes
- ❌ Integrações CRM/ERP/Google Sheets
- ❌ White-label
- ❌ Auditoria avançada
- ❌ Import/export avançado de contatos

---

## Checklist Rápido — Validação de Feature

Copie e use este checklist para cada feature antes de dar como pronta:

### Design

- [ ] Usa tokens do Emerald Ledger (cores, espaçamento, radius, sombras)
- [ ] Nenhuma cor hexadecimal hardcoded nos componentes
- [ ] Fontes corretas: Manrope (headlines) + Inter (body)
- [ ] Escala tipográfica respeitada
- [ ] Espaçamento em múltiplos de 4px
- [ ] Suporta modo claro e modo escuro
- [ ] Responsivo e com layout estável

### Componentes

- [ ] Usa shadcn/ui antes de criar custom
- [ ] Componente custom justificado (se aplicável)
- [ ] Estado de loading (Skeleton)
- [ ] Estado vazio com orientação ao usuário
- [ ] Estado de erro com mensagem clara
- [ ] Ícones do Lucide React

### Estado e Dados

- [ ] Dados remotos via TanStack React Query
- [ ] Estado de UI via Zustand (se necessário)
- [ ] Não duplica server state no Zustand
- [ ] Invalidação de cache após mutations
- [ ] Paginação implementada para listas

### Forms

- [ ] Validação com Zod (backend + frontend)
- [ ] react-hook-form para formulários complexos
- [ ] Mensagens de erro claras e específicas

### Backend

- [ ] API route fina (auth → validate → service → response)
- [ ] Regra de negócio no service
- [ ] Permissões validadas no backend
- [ ] Dados filtrados por `workspaceId`
- [ ] Formato de resposta: `{ success, data?, error? }`

### Banco de Dados

- [ ] Migration criada com Prisma
- [ ] Índices para campos de busca frequente
- [ ] Timestamps em UTC
- [ ] `workspaceId` presente na entidade (direta ou indiretamente)

### Segurança

- [ ] Rota protegida por autenticação (exceto webhook)
- [ ] Inputs validados com Zod no backend
- [ ] Sem leak de dados entre workspaces

### Qualidade

- [ ] Critérios de aceite do PRD atendidos
- [ ] Fluxo principal testável
- [ ] Segue padrões existentes do projeto
- [ ] Commit segue Conventional Commits
- [ ] Código comentado onde decisão não é óbvia

### Escopo

- [ ] Feature está dentro do escopo do MVP (ver seção 13)
- [ ] Se fora do escopo, foi discutida e aprovada

---

*STANDARDS v1.0 — Plataforma WhatsApp Multi-Números*
