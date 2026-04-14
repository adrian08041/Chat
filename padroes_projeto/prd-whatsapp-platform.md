# PRD - Plataforma WhatsApp Multi-Numeros

> Produto: plataforma web para centralizar conversas de varios numeros de WhatsApp em uma unica interface operacional.
> Estrategia inicial: MVP single-workspace, com arquitetura preparada para evoluir para SaaS multiempresa.
> Data: 14/04/2026

---

## 1. Resumo Executivo

A plataforma centraliza mensagens recebidas e enviadas por multiplos numeros de WhatsApp em uma unica inbox web. O objetivo principal do MVP e acabar com a operacao fragmentada em varios celulares, numeros e atendentes, permitindo que uma empresa acompanhe todas as conversas em um so lugar, sem perder mensagens, historico ou contexto.

O primeiro lancamento deve priorizar a experiencia operacional da inbox: conectar numeros, receber mensagens, identificar o numero de origem, assumir conversas, responder clientes, transferir atendimentos, aplicar status, usar tags e consultar historico. Funcionalidades como CRM avancado, automacoes, campanhas, billing SaaS e distribuicao automatica sofisticada ficam fora do MVP.

Embora o produto comece atendendo uma empresa por ambiente, a modelagem deve nascer com `Workspace`/`workspaceId` para permitir evolucao futura para SaaS multiempresa sem uma reescrita estrutural.

---

## 2. Problema

Empresas que usam WhatsApp como canal principal de atendimento ou vendas frequentemente operam com varios numeros espalhados entre celulares, vendedores e setores. Isso cria perda de controle, retrabalho e baixa visibilidade gerencial.

Principais dores:

- Varios celulares e numeros sendo usados sem centralizacao.
- Mensagens importantes perdidas ou respondidas tarde.
- Leads e clientes sem responsavel claro.
- Gestor sem visao de volume, pendencias e performance.
- Historico de conversas preso em aparelhos individuais.
- Dificuldade de transferir atendimento entre pessoas.
- Falta de rastreabilidade sobre quem respondeu, quando respondeu e por qual numero.

---

## 3. Publico-Alvo Inicial

O cliente inicial e uma empresa pequena ou media que usa varios numeros de WhatsApp para atendimento, vendas, suporte, pos-venda ou operacoes comerciais, mas ainda nao possui uma plataforma centralizada.

Perfil ideal para o MVP:

- Empresa com 2 a 20 usuarios internos.
- Operacao com 2 ou mais numeros de WhatsApp.
- Volume diario suficiente para gerar perda de mensagens ou confusao operacional.
- Necessidade de visualizar todas as conversas em um painel unico.
- Gestor ou dono que precisa acompanhar pendencias e distribuicao de atendimentos.

Exemplos de segmentos:

- Clinicas e consultorios.
- Imobiliarias.
- Escolas e cursos.
- Agencias.
- Ecommerce e lojas locais.
- Prestadores de servico com equipe comercial.
- Empresas de suporte ou pos-venda.

---

## 4. Posicionamento do Produto

### 4.1 Proposta de Valor

Centralizar todos os atendimentos de WhatsApp da empresa em uma unica inbox, mantendo historico, responsavel, status, tags e numero de origem em cada conversa.

### 4.2 Promessa Principal do MVP

"Conecte varios numeros de WhatsApp e gerencie todas as conversas da sua equipe em um so lugar."

### 4.3 Diferenciais Esperados

- Inbox unica para multiplos numeros.
- Identificacao clara do numero de origem.
- Conversas organizadas por responsavel, status e tags.
- Historico centralizado por contato.
- Transferencia de atendimento entre usuarios.
- Permissoes basicas por papel.
- Base tecnica preparada para evoluir para SaaS multiempresa.

---

## 5. Objetivos do MVP

### 5.1 Objetivos de Produto

- Permitir que uma empresa conecte multiplos numeros de WhatsApp.
- Exibir todas as conversas recebidas em uma inbox centralizada.
- Permitir que atendentes assumam, respondam, transfiram e resolvam conversas.
- Preservar historico de mensagens por contato e por conversa.
- Dar ao gestor visibilidade operacional basica sobre pendencias e volume.
- Reduzir mensagens sem resposta causadas por fragmentacao em celulares.

### 5.2 Objetivos Tecnicos

- Integrar com Evolution API para conexao e envio/recebimento de mensagens.
- Persistir contatos, conversas, mensagens, usuarios, numeros e eventos principais.
- Atualizar a interface em tempo real para novas mensagens e mudancas de status.
- Preparar o banco com `Workspace`/`workspaceId` desde o inicio.
- Separar regras de negocio em services para facilitar manutencao e testes.

### 5.3 Nao Objetivos do MVP

- Criar um CRM completo.
- Criar campanhas de disparo em massa.
- Criar chatbot ou automacoes complexas.
- Implementar billing, planos e checkout.
- Criar marketplace ou white-label.
- Entregar multi-tenant comercial completo no primeiro lancamento.
- Implementar round-robin avancado na primeira versao.

---

## 6. Estrategia de Produto

### 6.1 Estrategia Recomendada

O MVP deve ser single-workspace na experiencia do usuario, mas SaaS-ready na arquitetura.

Na pratica:

- A primeira empresa opera em um unico workspace.
- O usuario nao precisa gerenciar multiplos workspaces no MVP.
- Todas as entidades importantes ja devem carregar `workspaceId`.
- A camada de permissao deve sempre considerar o workspace ativo.
- Billing, limites por plano, cadastro publico de empresas e painel interno SaaS ficam para fases futuras.

### 6.2 Motivo da Estrategia

Essa abordagem reduz escopo e risco do primeiro lancamento, enquanto evita uma refatoracao pesada quando o produto evoluir para multiempresa.

---

## 7. Personas

### 7.1 Administrador / Dono

Responsavel por configurar a empresa, conectar numeros, convidar usuarios e acompanhar a operacao.

Necessidades:

- Ver todos os numeros conectados.
- Saber quantas conversas estao abertas ou sem responsavel.
- Acompanhar quem esta atendendo cada cliente.
- Transferir ou assumir conversas quando necessario.
- Manter historico centralizado.

### 7.2 Supervisor

Responsavel por acompanhar a rotina dos atendentes e organizar filas, pendencias e transferencias.

Necessidades:

- Visualizar conversas de todos os atendentes.
- Filtrar por status, numero, tag e responsavel.
- Transferir conversas.
- Ver conversas sem resposta.
- Monitorar indicadores basicos.

### 7.3 Atendente / Vendedor

Usuario que responde clientes e conduz atendimentos.

Necessidades:

- Ver conversas atribuidas a ele.
- Assumir conversas nao atribuidas quando permitido.
- Responder rapidamente.
- Usar respostas rapidas.
- Adicionar tags e notas internas.
- Encerrar ou reabrir atendimentos.

---

## 8. Escopo do MVP

### 8.1 Autenticacao e Usuarios

Requisitos:

- Login com email e senha.
- Sessao autenticada para acesso as telas protegidas.
- Papeis iniciais: `ADMIN`, `SUPERVISOR`, `AGENT`.
- Convite ou criacao manual de usuarios pelo Admin.
- Edicao basica de perfil: nome, email, senha e avatar opcional.

Criterios de aceite:

- Usuario sem login nao acessa telas protegidas.
- Admin consegue criar ou convidar usuarios.
- Cada usuario possui papel definido.
- Backend valida permissoes antes de executar acoes sensiveis.

### 8.2 Workspaces

Requisitos:

- O sistema deve possuir entidade `Workspace`.
- No MVP, a interface pode operar com um unico workspace ativo.
- Usuarios, numeros, contatos, conversas, mensagens, tags e respostas rapidas devem pertencer a um workspace.

Criterios de aceite:

- Registros operacionais sao sempre associados a um `workspaceId`.
- APIs filtram dados pelo workspace ativo.
- Nenhum usuario acessa dados fora do seu workspace.

### 8.3 Gestao de Numeros de WhatsApp

Requisitos:

- Conectar numero via QR Code usando Evolution API.
- Listar numeros conectados.
- Exibir status do numero: conectado, desconectado ou com erro.
- Definir nome/alias para cada numero.
- Definir cor de identificacao para cada numero usando tokens do design system.
- Definir responsavel padrao opcional por numero.
- Desconectar ou remover numero conforme permissao.

Criterios de aceite:

- Admin consegue iniciar conexao de um numero e visualizar QR Code.
- A inbox mostra claramente o numero de origem de cada conversa.
- Uma conversa recebida em numero com responsavel padrao pode ser atribuida automaticamente a esse usuario.
- Se nao houver responsavel padrao, a conversa entra como nao atribuida.

### 8.4 Inbox Centralizada

Requisitos:

- Exibir conversas de todos os numeros conectados em uma unica lista.
- Mostrar contato, ultima mensagem, horario, numero de origem, status, responsavel e contador de nao lidas.
- Permitir filtros por:
  - minhas conversas;
  - nao atribuidas;
  - todas;
  - resolvidas;
  - numero de origem;
  - responsavel;
  - status;
  - tags.
- Permitir busca por nome, telefone e conteudo basico.
- Abrir conversa em layout de chat.
- Atualizar lista em tempo real quando nova mensagem chegar.

Criterios de aceite:

- Mensagens de qualquer numero conectado aparecem na mesma inbox.
- Usuario consegue identificar rapidamente por qual numero a conversa chegou.
- Novas mensagens atualizam a conversa sem recarregar a pagina.
- Conversas com mensagens nao lidas ficam destacadas.
- Filtros combinados funcionam sem remover dados de outros usuarios indevidamente.

### 8.5 Conversas

Requisitos:

- Criar ou atualizar conversa automaticamente quando webhook receber mensagem.
- Toda conversa deve ter:
  - contato;
  - numero de origem;
  - workspace;
  - status;
  - responsavel opcional;
  - tags opcionais;
  - timestamps de criacao, ultima mensagem e resolucao.
- Permitir assumir conversa nao atribuida.
- Permitir transferir conversa para outro usuario.
- Permitir marcar como resolvida.
- Permitir reabrir conversa.
- Permitir notas internas.

Criterios de aceite:

- Conversa nova sem responsavel padrao entra como `UNASSIGNED`.
- Ao assumir conversa, usuario vira responsavel.
- Conversa atribuida so pode ser respondida pelo responsavel, Admin ou Supervisor conforme regra de permissao.
- Transferencia registra novo responsavel.
- Notas internas nao sao enviadas ao cliente.
- Conversa resolvida pode ser reaberta quando cliente envia nova mensagem ou por acao manual.

### 8.6 Mensagens

Requisitos:

- Receber mensagens via webhook da Evolution API.
- Salvar mensagens inbound e outbound.
- Suportar no MVP:
  - texto;
  - imagem;
  - audio;
  - video;
  - documento.
- Enviar mensagem de texto pelo painel.
- Enviar anexos quando suportado pela integracao.
- Registrar status: enviando, enviada, entregue, lida, falhou, quando disponivel.
- Preservar `whatsappMessageId` para rastreabilidade.

Criterios de aceite:

- Mensagem recebida aparece na conversa correta.
- Mensagem enviada pelo painel e entregue a Evolution API.
- Falha no envio exibe estado de erro na interface.
- Historico permanece disponivel ao trocar de atendente.

### 8.7 Responsavel, Status e Tags

Este modelo e central para evitar confusao operacional.

#### Responsavel

Define quem esta cuidando da conversa agora.

Regras:

- Conversa pode estar sem responsavel.
- Atendente pode assumir conversa nao atribuida quando permitido.
- Admin/Supervisor podem transferir conversa.
- Responsavel controla quem deve responder.

#### Status

Define o estagio operacional da conversa.

Status do MVP:

- `UNASSIGNED`: nao atribuida.
- `OPEN`: em atendimento.
- `WAITING_CUSTOMER`: aguardando cliente.
- `RESOLVED`: resolvida.
- `REOPENED`: reaberta.

#### Tags

Classificam contexto, prioridade ou tipo de demanda. Tags nao devem ser usadas como regra de permissao.

Exemplos:

- Lead novo.
- Orcamento.
- Urgente.
- Suporte.
- Pos-venda.
- Financeiro.
- Reclamacao.
- Follow-up.

Criterios de aceite:

- Sistema separa claramente responsavel, status e tags.
- Tags podem ser adicionadas e removidas sem alterar permissoes.
- Filtros por tags funcionam na inbox.
- Alteracao de responsavel ou status fica refletida em tempo real para usuarios relevantes.

### 8.8 Contatos

Requisitos:

- Criar contato automaticamente ao receber primeira mensagem.
- Permitir editar nome, telefone, email e observacoes.
- Exibir historico de conversas por contato.
- Permitir associar tags ao contato.
- Permitir responsavel padrao opcional pelo contato.

Criterios de aceite:

- Novo telefone recebido gera contato se ainda nao existir.
- Contato existente e reutilizado em novas conversas.
- Historico mostra conversas vinculadas ao contato.
- Edicao de contato atualiza os paineis onde ele aparece.

### 8.9 Respostas Rapidas

Requisitos:

- Criar, editar, listar e excluir respostas rapidas.
- Cada resposta deve ter atalho, titulo/categoria e conteudo.
- Permitir uso no input da conversa por atalho, como `/preco`.
- Suportar variaveis basicas:
  - `{{nome_cliente}}`;
  - `{{nome_atendente}}`;
  - `{{numero_origem}}`.

Criterios de aceite:

- Atendente consegue inserir resposta rapida no campo de mensagem.
- Variaveis sao substituidas antes do envio.
- Respostas rapidas pertencem ao workspace.

### 8.10 Dashboard Basico

O dashboard do MVP deve ser enxuto e focado em visibilidade operacional.

Requisitos:

- Total de conversas abertas.
- Total de conversas nao atribuidas.
- Total de mensagens ou conversas do dia.
- Conversas por numero.
- Conversas por responsavel.
- Tempo medio de primeira resposta, se tecnicamente viavel no MVP.

Criterios de aceite:

- Admin/Supervisor ve indicadores gerais.
- Atendente ve indicadores restritos as suas conversas, se houver tela especifica.
- Dados respeitam workspace e permissao.

---

## 9. Fora do Escopo do MVP

Itens planejados para fases futuras:

- Round-robin automatico entre atendentes.
- Regras avancadas de distribuicao por horario, carga ou disponibilidade.
- Chatbot.
- IA para sugestao de resposta.
- Campanhas e disparos em massa.
- Importacao/exportacao avancada de contatos.
- Billing SaaS, planos, trial, checkout e invoices.
- Painel administrativo da plataforma SaaS.
- Multi-workspace selecionavel pelo usuario final.
- API publica para clientes.
- Integracoes com CRM, ERP, Google Sheets ou calendario.
- White-label.
- Auditoria avancada.

---

## 10. Jornadas Principais

### 10.1 Conectar um Numero

1. Admin acessa tela de numeros.
2. Clica em adicionar numero.
3. Define nome, cor e responsavel padrao opcional.
4. Sistema cria instancia na Evolution API.
5. Sistema exibe QR Code.
6. Admin escaneia QR Code pelo WhatsApp.
7. Numero aparece como conectado.

Resultado esperado: mensagens recebidas nesse numero passam a entrar na inbox centralizada.

### 10.2 Receber Nova Mensagem

1. Cliente envia mensagem para um numero conectado.
2. Evolution API dispara webhook.
3. Sistema identifica workspace e numero de origem.
4. Sistema busca ou cria contato.
5. Sistema busca ou cria conversa ativa.
6. Sistema salva mensagem.
7. Sistema aplica responsavel padrao do numero, se existir.
8. Sistema emite evento em tempo real.
9. Inbox exibe conversa atualizada.

Resultado esperado: a equipe ve a mensagem no painel sem depender do celular fisico.

### 10.3 Assumir e Responder Conversa

1. Atendente abre filtro de nao atribuidas.
2. Seleciona uma conversa.
3. Clica em assumir.
4. Sistema define o atendente como responsavel.
5. Atendente responde pelo painel.
6. Mensagem e enviada pela Evolution API usando o numero de origem da conversa.

Resultado esperado: a conversa passa a ter dono claro e resposta registrada no historico.

### 10.4 Transferir Atendimento

1. Responsavel, Supervisor ou Admin abre conversa.
2. Seleciona acao de transferir.
3. Escolhe novo responsavel.
4. Opcionalmente adiciona nota interna.
5. Sistema atualiza responsavel e notifica usuarios relevantes.

Resultado esperado: atendimento continua com historico preservado e novo responsavel definido.

### 10.5 Resolver e Reabrir Conversa

1. Atendente finaliza atendimento.
2. Marca conversa como resolvida.
3. Conversa sai dos filtros principais de abertas.
4. Se cliente enviar nova mensagem, conversa pode ser reaberta automaticamente.
5. Usuario tambem pode reabrir manualmente conforme permissao.

Resultado esperado: a inbox fica limpa, mas o historico continua acessivel.

---

## 11. Permissoes

### 11.1 Admin

Pode:

- Configurar workspace.
- Gerenciar usuarios.
- Conectar e remover numeros.
- Ver todas as conversas.
- Responder, assumir ou transferir conversas.
- Gerenciar tags e respostas rapidas.
- Ver dashboard geral.

### 11.2 Supervisor

Pode:

- Ver todas as conversas do workspace.
- Assumir e transferir conversas.
- Gerenciar status e tags.
- Ver dashboard operacional.
- Gerenciar respostas rapidas, se permitido pelo Admin.

Nao deve:

- Alterar configuracoes criticas do workspace sem permissao.
- Remover numeros, salvo decisao explicita futura.

### 11.3 Atendente

Pode:

- Ver conversas atribuidas a ele.
- Ver e assumir conversas nao atribuidas quando permitido.
- Responder conversas sob sua responsabilidade.
- Aplicar tags.
- Adicionar notas internas.
- Marcar conversa como resolvida.

Nao deve:

- Remover numeros.
- Gerenciar usuarios.
- Ver configuracoes administrativas.
- Responder conversas atribuidas a outro atendente, salvo permissao explicita.

---

## 12. Requisitos Nao Funcionais

### 12.1 Performance

- Inbox deve carregar rapidamente com paginacao.
- Mensagens devem usar paginacao por cursor.
- Listas de conversas, contatos e relatorios nao devem buscar tudo de uma vez.
- Eventos em tempo real devem atualizar apenas dados necessarios.

### 12.2 Confiabilidade

- Webhook da Evolution API deve validar assinatura ou chave secreta.
- Eventos recebidos devem ser idempotentes quando possivel.
- Sistema deve evitar duplicidade usando `whatsappMessageId`.
- Falhas de envio devem ser registradas e exibidas.
- Logs devem permitir rastrear recebimento, processamento e envio de mensagens.

### 12.3 Seguranca

- Todas as APIs protegidas exigem usuario autenticado.
- Backend e fonte da verdade para permissoes.
- Dados sempre filtrados por `workspaceId`.
- Inputs validados com Zod.
- Senhas armazenadas com hash seguro.
- Webhook publico deve ser protegido por segredo.

### 12.4 Usabilidade

- Inbox deve ser a tela principal do produto.
- Usuario deve identificar numero de origem sem abrir detalhes.
- Estados vazios devem orientar a proxima acao.
- Erros de conexao, envio e webhook devem ser visiveis para Admin/Supervisor.
- Interface deve funcionar bem em desktop; mobile e importante, mas nao deve atrasar o MVP.

---

## 13. Metricas de Sucesso

Metricas do MVP:

- Quantidade de numeros conectados por workspace.
- Total de conversas recebidas por dia.
- Percentual de conversas nao respondidas.
- Tempo medio de primeira resposta.
- Total de conversas nao atribuidas.
- Total de conversas resolvidas por periodo.
- Volume de conversas por numero.
- Volume de conversas por responsavel.

Sinais de sucesso:

- Empresa consegue operar sem depender de varios celulares fisicos.
- Gestor consegue saber quais conversas estao pendentes.
- Atendentes conseguem responder usando uma unica interface.
- Historico permanece acessivel mesmo apos transferencia.
- Reducao perceptivel de mensagens perdidas.

---

## 14. Modelo de Dados Conceitual

Entidades principais:

- `Workspace`: empresa/ambiente operacional.
- `User`: usuario interno.
- `WhatsAppInstance`: numero conectado.
- `Contact`: cliente ou lead.
- `Conversation`: atendimento/conversa operacional.
- `Message`: mensagem inbound ou outbound.
- `ConversationNote`: nota interna.
- `Tag`: classificacao.
- `QuickReply`: resposta rapida.

Relacionamentos principais:

- Workspace possui usuarios, numeros, contatos, conversas, tags e respostas rapidas.
- Numero possui muitas conversas.
- Contato possui muitas conversas.
- Conversa possui muitas mensagens e notas.
- Conversa pode ter um responsavel.
- Conversa pode ter varias tags.
- Contato pode ter varias tags.

Regra estrutural:

- Toda entidade operacional deve ter `workspaceId`, direta ou indiretamente.

---

## 15. Diretrizes de Implementacao para Agentes e Desenvolvedores

Estas regras devem orientar qualquer agente de IA ou desenvolvedor humano que implemente funcionalidades neste projeto.

### 15.1 UI e Design System

- Usar componentes existentes do `shadcn/ui` antes de criar componentes customizados.
- Criar componente customizado apenas quando ele representar uma necessidade clara da plataforma, como `ConversationItem`, `MessageBubble`, `ContactPanel` ou `QrCodeModal`.
- Usar tokens de design do projeto para cores, espacamentos, radius, bordas, sombras e estados.
- Evitar cores hardcoded em componentes.
- A cor de identificacao dos numeros deve vir de um conjunto controlado de tokens.
- Telas principais devem ter estados de loading, vazio e erro.
- Componentes devem ser responsivos e preservar estabilidade de layout.

### 15.2 Forms e Validacao

- Usar `Zod` para validacao de inputs no backend e nos formularios.
- Usar `react-hook-form` com resolvers do Zod para formularios complexos.
- Mensagens de erro devem ser claras e especificas.
- Nunca confiar apenas na validacao do frontend.

### 15.3 Estado e Dados

- Usar `TanStack React Query` para dados remotos, cache, mutations e invalidacao.
- Usar `Zustand` apenas para estado global de UI ou estado operacional local, como:
  - conversa selecionada;
  - filtros ativos da inbox;
  - estado da sidebar;
  - modais abertos;
  - notificacoes temporarias.
- Evitar duplicar server state dentro do Zustand.
- Revalidar ou invalidar queries apos mutations relevantes.

### 15.4 Backend e Regras de Negocio

- API routes devem ser finas: autenticar, validar input, chamar service e retornar resposta.
- Regras de negocio devem ficar em services.
- Usar Prisma como caminho padrao para acesso ao banco.
- SQL manual so deve ser usado quando houver necessidade clara de performance ou recurso especifico.
- Respostas de API devem seguir formato consistente.
- Backend deve aplicar permissoes e filtros por `workspaceId`.
- Frontend nao deve ser a fonte da verdade para regras de permissao.

### 15.5 Integracao com Evolution API

- Centralizar chamadas para Evolution API em cliente dedicado.
- Webhook deve validar segredo antes de processar evento.
- Processamento de webhook deve ser idempotente.
- Salvar IDs externos relevantes para rastreabilidade.
- Falhas de envio ou processamento devem gerar logs e estado visivel.

### 15.6 Banco de Dados

- Usar migrations do Prisma.
- Criar indices para buscas frequentes:
  - `workspaceId`;
  - `phone`;
  - `conversationId`;
  - `instanceId`;
  - `assignedUserId`;
  - `lastMessageAt`;
  - `whatsappMessageId`.
- Usar timestamps em UTC.
- Usar soft delete onde fizer sentido operacional.
- Preparar entidades com `workspaceId` desde o MVP.

### 15.7 Qualidade

- Toda funcionalidade critica deve ter criterio de aceite.
- Fluxos de webhook, envio de mensagem, permissao e atribuicao devem ser testaveis.
- Evitar refatoracoes amplas sem relacao com a entrega atual.
- Seguir padroes existentes do projeto antes de introduzir nova abstracao.
- Comentarios devem explicar decisoes nao obvias, nao repetir o que o codigo ja mostra.

---

## 16. Riscos e Mitigacoes

| Risco | Impacto | Mitigacao |
|---|---:|---|
| Instabilidade da Evolution API | Alto | Logs, monitoramento, retries, status visivel dos numeros |
| Banimento de numero por uso indevido | Alto | Evitar spam, orientar uso responsavel, nao priorizar disparo em massa no MVP |
| Perda de mensagens por falha no webhook | Alto | Idempotencia, logs, possivel fila em fase futura |
| Complexidade prematura de SaaS | Medio | MVP single-workspace com `workspaceId`, sem billing inicial |
| Atendentes respondendo a mesma conversa | Medio | Responsavel claro por conversa e permissoes no backend |
| Vazamento de dados entre workspaces no futuro | Alto | Filtro obrigatorio por `workspaceId` desde o MVP |
| Performance ruim em conversas longas | Medio | Paginacao por cursor e indices adequados |

---

## 17. Roadmap Sugerido

### Fase 1 - MVP Operacional

- Auth e usuarios.
- Workspace base.
- Conexao de numeros via Evolution API.
- Webhook de mensagens.
- Inbox centralizada.
- Chat e envio de mensagens.
- Responsavel, status e tags.
- Transferencia de conversa.
- Contatos e historico.
- Respostas rapidas.
- Dashboard basico.

### Fase 2 - Operacao Mais Inteligente

- Distribuicao automatica simples.
- Regras por horario ou disponibilidade.
- Melhorias em relatorios.
- Busca dentro da conversa.
- Importacao/exportacao de contatos.
- Campos customizados em contatos.
- Auditoria basica.

### Fase 3 - SaaS Multiempresa Completo

- Cadastro publico de empresas.
- Trial e onboarding.
- Planos e limites.
- Billing.
- Painel admin da plataforma.
- Multi-workspace completo.
- API publica.
- Integracoes externas.

### Fase 4 - Automacoes e Escala

- Chatbot.
- Sugestao de respostas com IA.
- Campanhas.
- Webhooks de saida.
- White-label.

---

## 18. Decisoes Confirmadas

- O foco principal do MVP e centralizar mensagens de varios numeros em uma unica inbox.
- O produto comeca como single-workspace, mas com arquitetura preparada para SaaS.
- Conversas novas entram como nao atribuidas quando nao houver responsavel padrao.
- Numero pode ter responsavel padrao opcional.
- Round-robin automatico fica fora do MVP.
- Responsavel, status e tags sao conceitos separados.
- Tags classificam contexto, prioridade ou tipo de demanda; nao controlam permissao.
- Somente responsavel, Admin ou Supervisor podem responder uma conversa atribuida, conforme regra final de permissao.
- PRD deve orientar produto e tambem conter diretrizes tecnicas essenciais para agentes/desenvolvedores.

---

## 19. Questao Aberta para Validacao Posterior

A permissao exata para atendentes visualizarem conversas de outros atendentes deve ser validada com o cliente inicial. A recomendacao inicial e:

- Atendente ve suas conversas e conversas nao atribuidas.
- Supervisor e Admin veem todas.
- Atendente nao responde conversa atribuida a outro atendente.

Essa regra reduz risco de respostas duplicadas e mantem a operacao simples no MVP.
