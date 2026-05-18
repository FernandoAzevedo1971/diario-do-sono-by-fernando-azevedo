# Handoff · Diário do Sono — Redesign do Today

## Visão geral

Este pacote contém o redesign da tela **Today** (e telas adjacentes — Diário, Histórico, IGI, Aparência) do app **Diário do Sono**. A direção definitiva é **Nocturne V2** — tema wellness escuro premium com paleta navy/lavanda, ambientação atmosférica (lua, estrelas, aurora difusa), e tipografia de display em serifa.

Duas direções alternativas (**Sereno V2** cream e **Editorial** dark) também acompanham o pacote como referência — não são o foco da implementação, mas servem de comparação.

## Sobre os arquivos deste bundle

Os arquivos `.html` e `.jsx` deste pacote são **referências de design feitas em HTML/React** — protótipos que mostram o visual e o comportamento desejados. **Não são código de produção pra ser copiado direto.**

A tarefa é **recriar esses designs no ambiente do repositório `diario-do-sono`** usando as bibliotecas, convenções e o sistema de design já existentes nele (React/React Native/Vue/SwiftUI/Compose — o que estiver lá). Se ainda não existir uma stack escolhida, escolha a mais apropriada e implemente a partir daí.

Componentes de scaffolding do protótipo (`design-canvas.jsx`, `android-frame.jsx`, `tweaks-panel.jsx`) servem apenas pra apresentar os designs lado a lado dentro de um frame Android. **Não devem ser portados.**

## Fidelidade

**Alta fidelidade (hifi).** Cores, tipografia, espaçamentos, raios, interações e microcopy estão definidos com precisão e devem ser reproduzidos pixel-a-pixel usando os componentes/tokens disponíveis no codebase de destino.

---

## Arquitetura do protótipo

Ponto de entrada: `Today Redesign.html`.
Carrega React 18 + Babel standalone e os seguintes scripts (nessa ordem):

1. `design-canvas.jsx` — frame de apresentação (descartar)
2. `android-frame.jsx` — bezel de Android (descartar)
3. `tweaks-panel.jsx` — painel de tweaks (descartar)
4. `data.jsx` — dados mock + formatadores
5. `shared-ui.jsx` — ícones e átomos compartilhados
6. `appearance-settings.jsx` — tela de aparência (porta os 3 temas)
7. `today-nocturne.jsx` (V1, deprecated) — *não incluso*
8. `today-sereno.jsx` (V1, deprecated) — *não incluso*
9. `today-sereno-v2.jsx` — direção alternativa cream
10. `today-nocturne-v2.jsx` — **direção definitiva**
11. `today-editorial.jsx` — direção alternativa data-forward
12. `app.jsx` — wiring (canvas + tweaks)

### Tokens globais expostos via `window`

`data.jsx` expõe:
- `SLEEP_DATA` — 14 noites de dados sintéticos
- `TODAY`, `LAST7`, `PREV7`, `AVG7`, `AVG_PREV7`
- `STREAK`, `ISI_SCORE`, `ISI_LABEL`, `ISI_LAST_DAYS`, `NEXT_ISI_IN_DAYS`
- `fmtH(min)` → `"7h 26"`, `fmtHShort(min)`, `fmtMin(min)`, `weekdayLabels()`, `WEEKDAYS_PT`

`app.jsx` expõe:
- `HERO_FONTS` — mapa de fontes do número grande do hero
- `heroFontStack(key)` — resolve a chave em font stack CSS

---

## Tema definitivo: Nocturne V2

Arquivo: `today-nocturne-v2.jsx`

### Paleta (objeto `N2`)

| Token            | Valor                          | Uso                                       |
|------------------|--------------------------------|-------------------------------------------|
| `bg`             | `#070914`                      | Fundo geral                               |
| `bgDeep`         | `#050715`                      | Fundo mais profundo (bottom sheets)       |
| `surface`        | `rgba(255,255,255,0.04)`       | Cards                                     |
| `surfaceStrong`  | `rgba(255,255,255,0.06)`       | Cards de destaque                         |
| `stroke`         | `rgba(255,255,255,0.08)`       | Borda padrão                              |
| `strokeStrong`   | `rgba(255,255,255,0.16)`       | Borda em estado pressionado/ativo         |
| `ink`            | `#FAFAF7`                      | Texto principal                           |
| `inkSoft`        | `#F0E9FF`                      | Texto em destaque (nome do usuário)       |
| `muted`          | `rgba(255,255,255,0.58)`       | Texto secundário                          |
| `dim`            | `rgba(255,255,255,0.38)`       | Texto terciário, monos, kickers           |
| `ghost`          | `rgba(255,255,255,0.16)`       | Dividers, ticks, dots inativos            |

### Cor primária (tweak)

Padrão: **`#A76BFA`** (signature purple). Outras opções da paleta:
- `#7CC9B4` — sage teal
- `#E8A86B` — warm amber
- `#6B9CFF` — soft blue
- `#FF9FB5` — dusk rose

A primária aparece em: anel de eficiência, halo da hero, "h" italic do tempo de sono, "%" da eficiência, "min" da latência, glow da lua, estado ativo de chips, barras dos gráficos, dot ativo do carousel.

### Tipografia

| Família             | Pesos          | Uso                                                    |
|---------------------|----------------|--------------------------------------------------------|
| **Fraunces**        | 300/400/500    | Títulos, headings, hero da V1 (mantido em vários pontos) |
| **Instrument Serif**| 400 (regular/italic) | Números grandes do hero (padrão atual)            |
| **Newsreader**      | 200–700        | Opção alternativa do número grande                     |
| **Bricolage Grotesque** | 200–800    | Opção alternativa do número grande (sans humanista)    |
| **Inter**           | 300–800        | UI geral (body, botões, labels)                        |
| **JetBrains Mono**  | 400/500        | Kickers numéricos, %, deltas, IDs de noite (`D01`)     |

A fonte do número grande (TTS/eficiência/latência) é trocável via tweak `heroFont`. Stack default:

```js
heroFont: 'instrument' // → '"Instrument Serif", "Times New Roman", serif'
// outras chaves: 'newsreader', 'bricolage', 'mono', 'fraunces'
```

### Escala de tamanhos (display)

| Elemento                    | Tamanho | Peso | Letter-spacing | Line-height |
|-----------------------------|---------|------|----------------|-------------|
| TTS hero (hora + minuto)    | 84px    | 300  | -0.05em        | 0.82        |
| TTS hero "h" italic          | 46px    | 300  | -0.03em        | —           |
| Eficiência %                | 92px    | 300  | -0.05em        | 0.82        |
| Eficiência "%" italic       | 36px    | 300  | -0.02em        | —           |
| Latência min                | 96px    | 300  | -0.04em        | 0.82        |
| Latência "min" italic       | 32px    | 300  | -0.02em        | —           |
| Saudação ("Bom dia, …")     | 28px    | 400  | -0.01em        | 1.05        |
| Heading de tela ("Histórico")| 32px   | 300  | -0.015em       | —           |
| Kicker (`01 · TEMPO DE…`)   | 11px    | 500  | 0.16em uppercase | —         |
| Body                        | 13–15px | 400  | —              | 1.45        |
| Label mono                  | 10–11px | 400  | 0.06–0.14em    | —           |

---

## Telas

Todas montadas em frame Android `412 × 892` (densidade ~xxhdpi).

### 1. Today (`NocturneV2Today`)

Estrutura vertical:

1. **Header** (padding 20/24)
   - Data + saudação ("Bom dia, *Marina*.") + subtítulo italic
   - Botão de aparência (36×36 round, ícone User)

2. **Hero carousel** (3 cards, swipe + dots)
   - **Card 01 · Tempo de sono (TTS):** kicker + número grande (`7h 26`) + barra noturna mostrando 23:14–07:08 com marcadores
   - **Card 02 · Eficiência:** kicker + `94%` ao lado de mini-ring, com hint sobre "85% é bom". Long-press → bottom sheet com breakdown (latência, WASO, despertares, qualidade)
   - **Card 03 · Latência:** kicker + `11 min` + track horizontal indicando "ideal < 20 min"
   - Halo de respiração atrás do hero (radial gradient com primary, scale animado 0.85↔1.03 em 2.4s)
   - Dots: bolinha ativa expande pra 18×6 (pill); inativas 6×6

3. **CTA Preencher diário**
   - Card cheio, borda `stroke`, surface `surface`
   - Ícone à esquerda + título Fraunces 18/500 + sublinha mono 11px (`4 perguntas · cerca de 2 min`)

4. **Sua semana** (chart)
   - Heading "Sua semana" 20px + sublinha com avg de eficiência em primary
   - Chip mono "7d" arredondado 999
   - Gráfico de barras/linha/círculos (configurável via `chartStyle`)

5. **Insight do dia**
   - Barra vertical fina à esquerda (2×24, primary, glow)
   - Kicker "Padrão da semana" + frase em Fraunces 15/400 com destaque italic em primary

6. **Streak & IGI**
   - Row com streak (`{STREAK} dias`) + CTA pra IGI (próxima reavaliação)

7. **Bottom nav** (Today / Diário / Histórico / IGI / Aparência) — slide+fade entre rotas

### 2. Diário (`NocturneV2Diary`)

Wizard de 4 passos:
1. `Que horas você deitou?` → input de tempo `HH:MM` (62px Fraunces 300, italic `:` em primary)
2. `Quanto tempo levou para dormir?` → numérico + unidade (`72px primary` + `26px muted italic`)
3. `Acordou durante a noite?` → mesmo padrão
4. `Como se sente ao acordar?` → escala numérica clínica 1–5 (chips redondos 60×60, ativo com glow em primary)

- Header: botão "← Voltar" + counter mono `01 / 04`
- Progress bar 2px com glow no fill
- Pergunta em Fraunces 32/300
- Card de resposta: padding 30/20, radius 20, `surface` com borda `stroke`

### 3. Histórico (`NocturneV2History`)

- Header com voltar + título Fraunces 32/300 "Histórico"
- Sublabel mono "Últimas 14 noites"
- Lista de 14 cards (`D13 → D00`):
  - Grid `auto 1fr auto`
  - Esquerda: `D{N}` mono dim
  - Centro: TTS Fraunces 22/400 + barra fina horizontal (3px) com width = eficiência%
  - Direita: `{eff}%` mono primary

### 4. IGI (`NocturneV2IGI`)

- Header com voltar + título Fraunces 30/300 "Índice de Gravidade da Insônia"
- Card central: ring grande 150px (score/28 × 100%) + score em Fraunces 24/400 + label "Insônia {nível}"
- Lista de severidades (Nenhuma / Subliminar / Moderada / Grave) com faixa ativa destacada

### 5. Aparência (`AppearanceSettings`)

Já existe em `appearance-settings.jsx`. Renderiza miniaturas dos 3 temas (Nocturne / Sereno / Editorial), botão de seleção, e swatch da cor primária.

---

## Interações & animações

| Interação                           | Duração / Easing                            |
|-------------------------------------|---------------------------------------------|
| Entrada de blocos (stagger)         | 480ms `cubic-bezier(0.22,0.61,0.36,1)`, delays de 0/60/120/200ms |
| Transição entre rotas               | 480ms slide horizontal + 320ms fade         |
| Long-press na Eficiência            | 520ms até abrir sheet                       |
| Bottom sheet                        | 380ms slide-up                              |
| Carousel swipe                      | translateX com snap; idx muda no threshold de 50px |
| Halo de respiração no hero          | 2.4s `sin` loop, scale 0.85↔1.03            |
| Estrelas piscando                   | 2.4–5.4s por estrela, opacity 0.15↔0.85     |
| Press feedback nos cards            | 220ms scale 0.985 no `:active`              |
| Tap nos botões                      | 160ms opacity 0.7 + translateY 1px          |
| Mudança de tema (flash overlay)     | 500ms fade da primary com opacity 0.18      |

---

## Dados mock (`data.jsx`)

`TODAY` é a última noite (`d:0`):
```js
{ d: 0, tts: 446, ttc: 475, lis: 11, waso: 6, eff: 94, mood: 5 }
```

Campos:
- `tts` — sleep time (minutos)
- `ttc` — total time in bed (minutos)
- `lis` — sleep latency (minutos)
- `waso` — wake after sleep onset (minutos)
- `eff` — efficiency (%) = (tts/ttc)*100
- `mood` — escala 1–5

`STREAK = 6`. `ISI_SCORE = 8`, `ISI_LABEL = "Subliminar"`, `ISI_LAST_DAYS = 12`.

Os formatadores `fmtH(min) → "Hh MM"` e `fmtHShort(min) → "HhMM"` são chamados em vários pontos.

---

## Tweaks expostos

| Chave        | Tipo     | Default        | Valores                                              |
|--------------|----------|----------------|------------------------------------------------------|
| `primary`    | color    | `#A76BFA`      | Paleta de 5 cores                                    |
| `chartStyle` | radio    | `bars`         | `bars` / `line` / `circles`                          |
| `heroFont`   | select   | `instrument`   | `instrument` / `newsreader` / `bricolage` / `mono` / `fraunces` |

No app final, `primary` deve ser persistido em configurações do usuário; `chartStyle` e `heroFont` são experimentos da fase de design — discutir antes de implementar como settings reais.

---

## Assets

Não há imagens externas. Tudo é SVG inline:
- Ícones em `shared-ui.jsx` (`Icon.Flame`, `Icon.Chart`, `Icon.Plus`, `Icon.ArrowRight`, `Icon.Bell`, `Icon.User`, `Icon.Home`, `Icon.PDF`, `Icon.Check`, …)
- Lua, estrelas e aurora em `NocturneBackdrop` (inline no `today-nocturne-v2.jsx`)
- Ring de eficiência em `Ring` / `RingMiniN` (SVG com `feGaussianBlur` pra glow)

Fontes são carregadas do Google Fonts (ver `<link>` no `Today Redesign.html`). No app de produção, considere auto-hospedar pra controle de versão e performance.

---

## Como aplicar no repositório `diario-do-sono-by-fernando-azevedo`

O repo é monorepo Expo/React Native:
- `apps/mobile/src/screens/TodayScreen.tsx` — alvo principal do redesign
- `apps/mobile/src/screens/DiaryWizardScreen.tsx` — alvo do wizard
- `apps/mobile/src/components/` — onde criar átomos (`BigNumberHM`, `Kicker`, `NightBar`, etc.) reutilizáveis
- `apps/mobile/src/theme/tokens.ts` — onde adicionar/atualizar tokens (paleta `N2`, fontes, escala)
- `packages/core` — **não muda** (lógica clínica permanece intacta — `tts`, `ttc`, `lis`, `waso`, `eff` já existem lá)

### Passos sugeridos

1. Coloque a pasta `handoff/` deste zip em `docs/design/` do repo (junto dos outros docs).
2. Atualize `apps/mobile/src/theme/tokens.ts` com a paleta `N2`, escala tipográfica e a cor primária `#A76BFA`. Carregue Fraunces + Instrument Serif + Inter + JetBrains Mono (via `expo-font` ou `@expo-google-fonts/...`).
3. Crie átomos em `apps/mobile/src/components/`:
   - `BigNumberHM.tsx` (mapeia `BigNumberHMN`)
   - `BigPct.tsx` (mapeia `BigPctN`)
   - `Kicker.tsx`
   - `NightBar.tsx`, `LatencyTrack.tsx`
   - `RingMini.tsx`, `Ring.tsx` (com `react-native-svg`)
   - `NocturneBackdrop.tsx` (aurora + estrelas + lua com `react-native-svg`)
4. Reimplemente `TodayScreen.tsx` seguindo a estrutura do `today-nocturne-v2.jsx`:
   - Hero carousel: use `react-native-reanimated-carousel` ou `FlatList` horizontal com snap
   - Long-press na Eficiência: `Pressable` + `onLongPress` → bottom sheet (`@gorhom/bottom-sheet`)
   - Halo de respiração: `Reanimated` `useSharedValue` com `withRepeat(withTiming(...))`
   - Estrelas piscando: `Animated.View` com opacity loop por estrela
5. Reimplemente `DiaryWizardScreen.tsx` (4 passos) seguindo `NocturneV2Diary`.
6. Conecte os dados reais de `packages/core` (já tem `tts`, `ttc`, `lis`, `waso`, `eff`) no lugar do mock `data.jsx`.
7. As médias 7d / 14d podem reusar `packages/core/src/averages.ts`.

### Se usar Claude Code

Abra o repo no Claude Code e diga algo como:

> Implemente o redesign do `TodayScreen` seguindo `docs/design/handoff/README.md` e os JSX em `docs/design/handoff/`. A direção definitiva é o **Nocturne V2** (`today-nocturne-v2.jsx`). Mantenha a lógica de `packages/core` intacta. Atualize `theme/tokens.ts` e crie os átomos novos em `apps/mobile/src/components/`. Use Reanimated 3 e `react-native-svg`.

### Sobre as direções de referência

`today-sereno-v2.jsx` e `today-editorial.jsx` ficam no pacote só pra comparação visual — **não precisam ser implementados**. Eles compartilham vários átomos com Nocturne (mesma estrutura de hero carousel, mesma escala de números, mesmos kickers) mas em paletas diferentes (`#F4F1EB` cream e `#0C0C0E` data-forward respectivamente).

---

## Arquivos neste pacote

```
handoff/
├── README.md                  ← este arquivo
├── Today Redesign.html        ← ponto de entrada
├── app.jsx                    ← wiring (canvas + tweaks)
├── today-nocturne-v2.jsx      ← DEFINITIVO — Nocturne wellness escuro
├── today-sereno-v2.jsx        ← Referência — Sereno cream
├── today-editorial.jsx        ← Referência — Editorial data-forward
├── appearance-settings.jsx    ← Tela de aparência (3 temas)
├── data.jsx                   ← Mock + formatadores
├── shared-ui.jsx              ← Ícones e átomos
├── design-canvas.jsx          ← scaffolding (descartar)
├── android-frame.jsx          ← scaffolding (descartar)
└── tweaks-panel.jsx           ← scaffolding (descartar)
```
