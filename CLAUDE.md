# DIÁRIO DO SONO — Contexto para o Claude

## O que é

App mobile-first de diário clínico do sono para pacientes, criado pelo Dr. Fernando Azevedo (pneumologista/somnologista). Registra dados subjetivos do sono pela manhã, calcula métricas automaticamente e gera PDF para o médico.

## Stack

- **App**: React Native + Expo (pasta `apps/mobile`)
- **Backend**: Firebase (Auth + Firestore + Cloud Functions)
- **Lógica compartilhada**: `packages/core` (TypeScript puro, testável)
- **Monorepo**: npm workspaces
- **Node**: 20.x

## Comandos principais

```bash
npm run mobile          # inicia o app Expo
npm run mobile:android  # abre no Android
npm run core:test       # roda testes unitários do core
npm run core:build      # compila o pacote core
npm run typecheck       # TypeScript em todos os workspaces
```

## Estrutura de pastas

```
apps/
  mobile/src/
    screens/     # telas do app
    components/  # componentes reutilizáveis
    services/    # firebase.ts, authService.ts, notificationService.ts
    storage/     # diaryRepository.ts (Firestore), localDiaryRepository.ts (offline)
    theme/       # tokens.ts (design system)
    types.ts     # tipos do app
  functions/src/
    index.ts     # Cloud Functions (PDF, email, cortesia)
packages/
  core/src/
    types.ts       # tipos compartilhados
    sleepDiary.ts  # cálculos clínicos
    averages.ts    # médias
    isi.ts         # Índice de Gravidade de Insônia
    time.ts        # utilitários de tempo (HH:mm → minutos)
docs/
  MVP.md                  # especificação completa do produto
  IMPLEMENTATION_PLAN.md  # fases técnicas de desenvolvimento
  MONETIZATION_AND_ACCESS.md
```

## Telas implementadas (apps/mobile/src/screens/)

- `WelcomeScreen` — boas-vindas
- `AuthScreen` — cadastro/login
- `InstructionsScreen` — instruções do diário
- `IsiPromptScreen` — convite para preencher o IGI
- `DiaryWizardScreen` — questionário diário passo a passo
- `TodayScreen` — tela principal do dia
- `ResultScreen` — resultado e métricas do dia
- `ProfileScreen` — perfil do paciente

## Métricas clínicas calculadas em `packages/core`

| Sigla | Significado | Fórmula |
|-------|-------------|---------|
| LIS | Latência de início do sono | tempo para dormir |
| TTC | Tempo total na cama | hora de deitar → hora de sair da cama |
| WASO | Wake After Sleep Onset | tempo acordado durante a noite |
| TTS calculado | Tempo total de sono | TTC − LIS − WASO − Inércia |
| TTS percebido | Estimativa do paciente | resposta direta |
| Eficiência | % de sono útil | TTS calculado / TTC × 100 |
| Inércia | Tempo para sair da cama | resposta direta |

## IGI — Índice de Gravidade de Insônia

7 itens, pontuação 0–4 cada, total 0–28.

| Pontuação | Classificação |
|-----------|---------------|
| 0–7 | Ausência de insônia clinicamente significativa |
| 8–14 | Insônia subclínica |
| 15–21 | Insônia clínica moderada |
| 22–28 | Insônia clínica grave |

Oferecido no primeiro cadastro e reoferecido a cada 14 dias.

## Regras de negócio importantes

- **Acesso gratuito**: apenas 2 primeiros dias de preenchimento
- **Após isso**: assinatura (R$ 19,90/4 semanas via Google Play / App Store) ou código de cortesia
- **Código de cortesia**: gerado pelo admin (`fazevedopneumosono@gmail.com`), vinculado ao email do paciente, uso único, válido por 4 semanas
- **Admin**: identificado por email, privilégio via Firebase Custom Claims
- **Offline-first**: Firestore com persistência local; sincroniza ao reconectar; última edição vence

## Fases do plano técnico

| Fase | Status | Descrição |
|------|--------|-----------|
| 0 | ✅ | Estrutura e setup |
| 1 | ✅ | Base mobile (navegação, tema, componentes) |
| 2 | Pendente | Firebase + offline (prova técnica) |
| 3 | Parcial | Auth + perfil |
| 4 | Parcial | Motor clínico (`packages/core`) |
| 5 | Parcial | Diário diário |
| 5.5 | Pendente | Assinatura, paywall e cortesia |
| 6 | Pendente | Resultados, médias e histórico |
| 7 | Parcial | IGI |
| 8 | Pendente | Notificações locais |
| 9 | Pendente | PDF e email |
| 10 | Pendente | Segurança e LGPD |
| 11–12 | Pendente | QA e publicação Android |

## Decisões pendentes

- Provedor de email (Resend, SendGrid ou outro)
- Biblioteca de compras in-app (RevenueCat vs integração direta)
- Produto de assinatura: mensal vs ciclo de 4 semanas nas lojas
- Texto jurídico de termos/LGPD
- Política de acesso a dados antigos após expiração
- Nome da empresa na loja
- PDF enviado como anexo ou link seguro

## Variáveis de ambiente

Ver `.env.example` (não commitado). Configurar Firebase antes de rodar o app real.

## Padrões do projeto

- TypeScript estrito em todo o projeto
- Lógica clínica fica em `packages/core` (sem dependências de UI)
- Testes unitários no core: `packages/core/test/`
- Modo escuro como padrão; design wellness premium
- Um registro por data por usuário
