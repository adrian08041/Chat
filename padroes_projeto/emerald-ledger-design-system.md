# Emerald Ledger — Design System

> Sistema de design extraído da interface Emerald Ledger. Suporta modo claro e escuro.

---

## Identidade

**Produto:** Emerald Ledger  
**Personalidade:** Profissional, confiável, moderno. Verde como cor-âncora remete a finanças, sustentabilidade e clareza.

---

## Paleta de Cores

### Primary — #075E54
Verde-azulado escuro. Cor principal de ação e destaque.

| Stop | Hex | Uso |
|------|-----|-----|
| 900 | `#02211e` | Texto sobre fundo claro |
| 800 | `#043d36` | Bordas fortes |
| **600** | **`#075E54`** | **Cor principal** |
| 400 | `#0e8070` | Hover, estados ativos |
| 200 | `#17a893` | Ícones secundários |
| 100 | `#5fd0c4` | Fondos suaves |
| 50  | `#e6f4f2` | Background de destaque leve |

### Secondary — #128C7E
Teal médio. Complementa o primary em gradações e estados.

| Stop | Hex | Uso |
|------|-----|-----|
| 900 | `#042e28` | Texto sobre claro |
| 800 | `#095c52` | Bordas |
| **600** | **`#128C7E`** | **Cor secundária** |
| 400 | `#1bb4a2` | Hover |
| 200 | `#42d4c3` | Ícones |
| 100 | `#8ee8de` | Fundos suaves |
| 50  | `#e8f5f3` | Background de destaque |

### Tertiary — #607E6B
Sage esmaecido. Uso em tags, rótulos e elementos neutros com personalidade.

| Stop | Hex | Uso |
|------|-----|-----|
| 800 | `#1a2b20` | Texto |
| 600 | `#354d3c` | Bordas |
| **400** | **`#607E6B`** | **Cor terciária** |
| 200 | `#82a18c` | Ícones |
| 100 | `#a8c2b0` | Fundos |
| 50  | `#edf2ee` | Background leve |

### Neutral — #F0F2F5
Cinza frio. Superfícies, fundos e textos auxiliares.

| Stop | Hex | Uso |
|------|-----|-----|
| 900 | `#1a1d20` | Texto primário |
| 800 | `#2e3338` | Texto secundário |
| 600 | `#4f5a63` | Texto terciário / ícones |
| 400 | `#8a96a3` | Placeholders |
| 200 | `#c5cdd6` | Bordas |
| 100 | `#dde2e8` | Bordas sutis |
| 50  | `#eef0f3` | Superfície elevada |
| 0   | `#F0F2F5` | Background de página |

### Semânticas

| Cor | Hex | Uso |
|-----|-----|-----|
| Danger | `#D94F3A` | Ações destrutivas, erros |
| Danger Light | `#fdecea` | Background de alertas |

---

## Tokens de Superfície

### Modo Claro

| Token | Valor | Descrição |
|-------|-------|-----------|
| `surface-bg` | `#eef0f3` | Background da página |
| `surface-card` | `#ffffff` | Cards e painéis |
| `surface-elevated` | `#f7f8fa` | Inputs, dropdowns |

### Modo Escuro

| Token | Valor | Descrição |
|-------|-------|-----------|
| `surface-bg` | `#111614` | Background da página |
| `surface-card` | `#1c2320` | Cards e painéis |
| `surface-elevated` | `#222c28` | Inputs, dropdowns |

---

## Tokens de Texto

| Token | Claro | Escuro |
|-------|-------|--------|
| Primário | `#1a1a1a` | `#e8ede9` |
| Secundário | `#5a6472` | `#8fa898` |
| Muted / Placeholder | `#8a96a3` | `#5c7066` |
| Sobre primário (botões) | `#ffffff` | `#ffffff` |

---

## Tokens de Borda

| Token | Claro | Escuro |
|-------|-------|--------|
| Default | `#dde2e8` | `#2a3830` |
| Sutil | `#eef0f3` | `#1e2b25` |

---

## Tipografia

### Fontes

| Papel | Família | Importação |
|-------|---------|------------|
| **Headline** | Manrope | `Google Fonts` |
| **Body** | Inter | `Google Fonts` |
| **Label** | Inter | `Google Fonts` |

```
https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap
```

### Escala Tipográfica

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

---

## Espaçamento

Escala baseada em múltiplos de 4px.

| Token | Valor | Uso típico |
|-------|-------|------------|
| `space-1` | 4px | Gap mínimo |
| `space-2` | 8px | Gap interno de ícones |
| `space-3` | 12px | Padding de chips |
| `space-4` | 16px | Padding interno de cards |
| `space-5` | 20px | Padding de cards |
| `space-6` | 24px | Espaço entre seções |
| `space-8` | 32px | Margem de componentes |
| `space-10` | 40px | Espaço de página |

---

## Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `radius-sm` | 6px | Botões pequenos, badges |
| `radius-md` | 10px | Botões, inputs |
| `radius-lg` | 14–16px | Cards, modais |
| `radius-xl` | 24px | Cards grandes |
| `radius-full` | 9999px | Chips, avatares |

---

## Sombras

| Token | Valor | Uso |
|-------|-------|-----|
| `shadow-sm` | `0 1px 3px rgba(0,0,0,.08)` | Cards padrão |
| `shadow-md` | `0 4px 12px rgba(0,0,0,.10)` | Cards elevados, dropdowns |

---

## Componentes

### Botões

Quatro variantes principais, mais versão ícone.

| Variante | Background | Texto | Borda |
|----------|------------|-------|-------|
| **Primary** | `#075E54` | `#ffffff` | `#075E54` |
| **Secondary** | Transparente | Texto primário | `#dde2e8` |
| **Inverted** | Texto primário | Surface | Texto primário |
| **Outlined** | Transparente | `#075E54` | `#075E54` |
| **Danger** | `#D94F3A` | `#ffffff` | `#D94F3A` |

**Anatomia:**  
`padding: 7–9px 16–18px` · `border-radius: radius-md` · `font: Inter 14px 500` · `border: 1.5px`

**Tamanhos:**

| Tamanho | Padding | Font |
|---------|---------|------|
| SM | 5px 12px | 12px |
| MD (padrão) | 8px 18px | 14px |
| LG | 12px 24px | 16px |

---

### Botões de Ícone (Action Group)

Usados agrupados para ações rápidas sobre um item.

| Variante | Background | Ícone |
|----------|------------|-------|
| Edit | `#075E54` (primary) | Lápis |
| Hierarchy / Tree | `#128C7E` (secondary) | Nós |
| Tag | `#607E6B` (tertiary) | Tag |
| Delete | `#D94F3A` (danger) | Lixeira |

**Anatomia:** `36×36px` · `border-radius: 8px` · ícone `15×15px` branco

---

### Input / Search

| Estado | Borda | Sombra |
|--------|-------|--------|
| Default | `#dde2e8` 1.5px | — |
| Hover | `#c5cdd6` | — |
| Focus | `#075E54` | `0 0 0 3px rgba(7,94,84,.12)` |

**Anatomia:** `padding: 9px 12px` · `border-radius: radius-md` · `font: Inter 13–14px` · ícone de busca à esquerda com 34px de padding-left

---

### Ícones de Navegação

Três estados: ativo (fundo primary), inativo (transparente), hover (fundo suave).

| Estado | Background | Cor do ícone |
|--------|------------|--------------|
| Ativo | `#075E54` | `#ffffff` |
| Inativo | Transparente | `#5a6472` |
| Hover | `#e6f4f2` | `#075E54` |

**Anatomia:** `padding: 10px` · `border-radius: 10px` · ícone `16–18px`

---

### Cards

| Variante | Background | Borda | Sombra |
|----------|------------|-------|--------|
| Padrão | `surface-card` | `1px solid border-sutil` | — |
| Elevado | `surface-card` | `1px solid border-sutil` | `shadow-md` |

**Anatomia:** `border-radius: radius-lg` · `padding: space-5`

---

### Chips / Labels

| Variante | Background | Texto | Borda |
|----------|------------|-------|-------|
| Default | `surface-elevated` | `txt-secondary` | `border-default` 1.5px |
| Primary | `#e6f4f2` | `#075E54` | Nenhuma |

**Anatomia:** `padding: 4px 12px` · `border-radius: radius-full` · `font: Inter 12px 500`

---

### Divisores

| Variante | Altura | Cor |
|----------|--------|-----|
| Primary | 3px | `#075E54` |
| Secondary | 2px | `#128C7E` (70% opacidade) |
| Thin | 1px | `border-default` |

Todos com `border-radius: full`.

---

## Modo Escuro

O sistema suporta modo escuro completo. Todos os tokens de superfície, texto e borda possuem valor alternativo. As cores de marca (primary, secondary, tertiary) permanecem as mesmas — apenas os fundos e textos invertem.

**Implementação sugerida:**

```html
<!-- Claro (padrão) -->
<html data-theme="light">

<!-- Escuro -->
<html data-theme="dark">
```

Ou via preferência do sistema:

```css
@media (prefers-color-scheme: dark) {
  /* aplicar tokens escuros */
}
```

---

## Uso dos Tokens

### Hierarquia de uso recomendada

1. Sempre use tokens, nunca valores hexadecimais diretos no código de componentes
2. Cores de marca (`primary`, `secondary`, `tertiary`) para elementos interativos e de destaque
3. Tokens de superfície (`surface-bg`, `surface-card`) para estrutura e layout
4. Tokens de texto (`txt-primary`, `txt-secondary`, `txt-muted`) para toda tipografia
5. Tokens de borda para separações e contornos

### Combinações aprovadas

| Elemento | Background | Texto |
|----------|------------|-------|
| Botão primário | `#075E54` | `#ffffff` |
| Botão outlined | Transparente | `#075E54` |
| Chip ativo | `#e6f4f2` | `#075E54` |
| Card | `surface-card` | `txt-primary` |
| Input placeholder | — | `#8a96a3` |
| Ícone ativo | `#075E54` | `#ffffff` |
| Badge de tag | `#edf2ee` | `#607E6B` |

---

*Emerald Ledger Design System — v1.0*
