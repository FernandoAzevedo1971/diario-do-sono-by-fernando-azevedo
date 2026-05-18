# DIÁRIO DO SONO — Plano Técnico De Implementação

## Decisões Técnicas

- App: **React Native + Expo**
- Builds: **EAS Build**
- Android: gerar `APK` para testes e `AAB` para Play Store
- iOS: gerar build para TestFlight/App Store depois
- Backend: **Firebase**
- Banco: **Cloud Firestore**
- Offline: Firestore com persistência local
- Funções servidor: **Cloud Functions**
- PDF/email: Cloud Function + provedor de email a definir
- Monetização: assinatura nas lojas + código de cortesia validado no servidor
- Arquitetura preparada para painel médico futuro

## Estrutura Do Projeto

- `apps/mobile`: aplicativo do paciente
- `apps/functions`: Cloud Functions para PDF, emails e rotinas
- `packages/core`: cálculos, validações, tipos e regras compartilhadas
- `docs`: especificações, MVP, roadmap e decisões técnicas
- `firebase`: regras de segurança, índices e configuração

## Regra De Monetização

- O paciente pode preencher gratuitamente os 2 primeiros dias do diário.
- Após 2 dias preenchidos, o app deve exigir assinatura ativa ou cortesia válida para liberar novos preenchimentos e recursos premium.
- Preço planejado: **R$ 19,90 por 4 semanas**.
- A cobrança deve usar Google Play Billing no Android e In-App Purchase/StoreKit no iOS.
- O app não deve direcionar o usuário a pagamento externo para desbloquear recursos digitais dentro do app.

## Código De Cortesia

- O administrador Dr. Fernando Azevedo terá acesso especial pelo email `fazevedopneumosono@gmail.com`.
- O privilégio administrativo deve ser validado no servidor, preferencialmente por Firebase Custom Claims.
- O admin terá um painel mínimo chamado **Gerar código de cortesia**.
- Para gerar o código, o admin informa o email do paciente.
- O código fica vinculado ao email do paciente e só pode ser ativado pela conta com esse mesmo email.
- A cortesia dura 4 semanas a partir da ativação.
- Após expirar, o paciente deve assinar ou receber novo código.
- O código deve ser uso único e armazenado como hash, nunca em texto puro.

## Fase 0 — Preparação

Objetivo: deixar o projeto pronto para desenvolvimento seguro.

Tarefas:

- Criar estrutura de pastas.
- Definir padrão TypeScript.
- Definir ambientes: `dev`, `staging`, `production`.
- Criar projeto Firebase inicial.
- Criar documento de variáveis de ambiente.
- Definir provedor de email.
- Definir produtos de assinatura no Google Play Console e, futuramente, App Store Connect.
- Definir estratégia de assinatura de 4 semanas, preferencialmente como assinatura mensal equivalente nas lojas.
- Definir bootstrap seguro do administrador `fazevedopneumosono@gmail.com`.
- Confirmar conta Google Play da empresa.
- Adiar Apple Developer até a fase iOS.

Entrega:

- Repositório organizado.
- Firebase dev configurado.
- Documentação inicial.

Critério de aceite:

- Projeto inicial abre localmente.
- Ambiente Firebase dev separado de produção.

## Fase 1 — Base Mobile

Objetivo: criar o app com navegação, tema e design system.

Tarefas:

- Configurar Expo.
- Configurar navegação.
- Criar tema escuro wellness premium.
- Criar componentes base:
  - `AppBackground`
  - `GlassCard`
  - `PrimaryButton`
  - `OptionCard`
  - `MetricCard`
  - `ProgressHeader`
  - `SyncBadge`
- Criar telas vazias principais.

Entrega:

- App navegável com identidade visual inicial.

Critério de aceite:

- Telas principais acessíveis.
- Visual consistente com mockup aprovado.

## Fase 2 — Firebase E Offline

Objetivo: validar a decisão técnica mais crítica.

Tarefas:

- Integrar Firebase Auth.
- Integrar Firestore.
- Validar persistência offline em Android real.
- Confirmar sincronização ao reconectar.
- Definir uso de React Native Firebase/native modules se necessário para offline robusto.
- Configurar development build via EAS, se Expo Go não for suficiente.

Entrega:

- Prova técnica offline funcionando.

Critério de aceite:

- Criar/editar registro offline.
- Fechar app, reabrir offline e manter dados.
- Reconectar e sincronizar.

Observação técnica:

- A documentação do Firestore confirma persistência offline e sincronização posterior.
- Em Android/Apple, a persistência é padrão.
- Para Expo com módulos nativos, a documentação do Expo orienta uso de development build/EAS quando necessário.

## Fase 3 — Autenticação E Perfil

Objetivo: implementar primeiro acesso do paciente.

Tarefas:

- Cadastro por email/senha.
- Login.
- Recuperação de senha.
- Consentimento LGPD.
- Perfil:
  - nome
  - email
  - data de nascimento
  - gênero
  - horário habitual de sair da cama
- Persistir perfil no Firestore.
- Identificar se o usuário é paciente ou administrador.
- Se o email for `fazevedopneumosono@gmail.com`, solicitar/validar privilégio administrativo via servidor.

Entrega:

- Paciente cria conta e completa perfil.
- Administrador consegue entrar no fluxo especial quando autorizado.

Critério de aceite:

- Usuário sem perfil é direcionado ao onboarding.
- Usuário com perfil vai para a tela “Hoje”.
- Usuário admin autorizado vê opção de gerar código de cortesia.

## Fase 4 — Motor Clínico

Objetivo: implementar cálculos e validações fora da interface.

Tarefas:

- Criar funções puras em `packages/core`.
- Implementar:
  - conversão `HH:mm` para minutos
  - cálculo de hora de sair da cama
  - TTC
  - LIS
  - WASO
  - fragmentação
  - inércia
  - TTS calculado
  - TTS percebido
  - eficiência
  - diferença percebido-calculado
- Criar validações.
- Criar testes unitários.

Entrega:

- Biblioteca clínica testada.

Critério de aceite:

- Todos os cálculos batem com exemplos manuais.
- Valores impossíveis são bloqueados.

## Fase 5 — Diário Diário

Objetivo: implementar o questionário principal.

Tarefas:

- Tela de instruções.
- Fluxo passo a passo das perguntas.
- Campos obrigatórios e opcionais.
- Revisão antes de salvar.
- Um registro por data.
- Edição de registros antigos.
- Salvamento offline.
- Status de sincronização.
- Bloquear novos preenchimentos se o paciente ultrapassou 2 dias gratuitos e não possui assinatura/cortesia ativa.

Entrega:

- Diário funcional.

Critério de aceite:

- Paciente preenche, salva, edita e revisa registros.
- App bloqueia envio incompleto.
- App permite pular apenas campos opcionais.
- App respeita limite gratuito de 2 dias preenchidos.

## Fase 5.5 — Assinatura, Paywall E Cortesia

Objetivo: implementar regra de acesso comercial antes de expandir resultados avançados.

Tarefas:

- Criar modelo de acesso do paciente:
  - `freeTrialEntriesUsed`
  - `subscriptionStatus`
  - `subscriptionProvider`
  - `subscriptionCurrentPeriodEnd`
  - `courtesyAccessUntil`
  - `accessStatus`
- Criar tela de paywall:
  - assinar por R$ 19,90/4 semanas
  - inserir código de cortesia
  - gerenciar assinatura
- Integrar biblioteca de compras in-app, preferencialmente com camada unificada para Google Play e Apple.
- Validar recibos/entitlements no servidor, não apenas no app.
- Criar Cloud Functions:
  - criar código de cortesia
  - ativar código de cortesia
  - consultar status de acesso
  - processar eventos de assinatura/webhooks, quando aplicável
- Criar painel admin mínimo:
  - login admin
  - tela **Gerar código de cortesia**
  - campo email do paciente
  - exibir código gerado e validade
- Garantir que o código de cortesia:
  - é vinculado ao email informado
  - é de uso único
  - ativa 4 semanas
  - não pode ser ativado em outro login

Entrega:

- Paciente consegue assinar ou ativar cortesia.
- Admin consegue gerar código de cortesia.
- App bloqueia/libera acesso conforme regra.

Critério de aceite:

- Paciente com 0–2 dias preenchidos consegue continuar gratuitamente.
- Paciente com mais de 2 dias e sem acesso ativo vê paywall.
- Paciente com assinatura ativa consegue continuar.
- Paciente com cortesia válida consegue continuar até o fim das 4 semanas.
- Código gerado para um email não funciona em outro email.
- Código expirado/usado não pode ser reutilizado.

## Fase 6 — Resultados, Médias E Histórico

Objetivo: transformar dados em acompanhamento útil.

Tarefas:

- Tela resultado do dia.
- Cards de métricas.
- Médias acumuladas.
- Histórico por data.
- Detalhe do registro.
- Recalcular médias após edição.
- Exibir `VALOR MÉDIO DE X DIAS DE PREENCHIMENTO`.

Entrega:

- Acompanhamento longitudinal básico.

Critério de aceite:

- Médias mudam corretamente ao criar/editar registros.
- Histórico funciona offline com dados já cacheados.

## Fase 7 — IGI

Objetivo: implementar o Índice de Gravidade de Insônia.

Tarefas:

- Convite no primeiro cadastro.
- Questionário de 7 itens.
- Pontuação 0–28.
- Classificação.
- Histórico de respostas.
- Pop-up quinzenal:
  - `Que tal reavaliar a gravidade da sua insônia?`

Entrega:

- IGI integrado ao app.

Critério de aceite:

- Primeiro cadastro oferece IGI.
- Após 14 dias, app oferece reavaliação.
- Histórico preserva preenchimentos anteriores.

Ponto de atenção:

- Confirmar texto final/licença de uso do IGI antes da publicação aberta.

## Fase 8 — Notificações Locais

Objetivo: lembrar o paciente sem depender de servidor.

Tarefas:

- Solicitar permissão de notificações.
- Agendar lembrete diário.
- Horário: saída habitual da cama + 1h.
- Cancelar/pular se registro do dia já existe.
- Atualizar agendamento se horário habitual mudar.

Entrega:

- Lembrete local funcional.

Critério de aceite:

- Notificação aparece no horário esperado.
- Não notifica se o diário já foi preenchido.

## Fase 9 — PDF E Email

Objetivo: gerar relatório clínico básico no servidor.

Tarefas:

- Cloud Function para gerar PDF.
- Cloud Function para enviar email/link seguro.
- Seleção de período.
- Incluir:
  - dados do paciente
  - tabela diária
  - médias
  - gráficos simples
  - IGI
  - observações opcionais
- Salvar PDF em storage com acesso controlado.

Entrega:

- PDF gerado e enviado ao médico.

Critério de aceite:

- Paciente solicita relatório.
- PDF é gerado no servidor.
- Médico recebe email/link seguro.

## Fase 10 — Segurança E LGPD

Objetivo: preparar app público com dados sensíveis.

Tarefas:

- Regras Firestore.
- Validação de acesso por usuário.
- Storage privado.
- Links temporários para PDF.
- Termos de uso.
- Política de privacidade.
- Exclusão/solicitação de exclusão de dados.
- Logs mínimos de auditoria.

Entrega:

- Base segura para publicação.

Critério de aceite:

- Paciente não acessa dados de outro paciente.
- PDF não fica público.
- App tem política de privacidade para loja.

## Fase 11 — QA E Beta Android

Objetivo: validar em aparelhos reais.

Tarefas:

- Testes em Android físico.
- Testes offline/online.
- Testes de notificação.
- Testes de cadastro e recuperação de senha.
- Testes de PDF/email.
- Build `APK` para instalação interna.
- Build `AAB` para teste fechado Google Play.

Entrega:

- Beta Android testável.

Critério de aceite:

- Fluxo completo funciona do cadastro ao PDF.
- Sem erros críticos em uso offline.

## Fase 12 — Publicação

Objetivo: publicar primeira versão.

Tarefas:

- Preparar ícone, splash e screenshots.
- Preparar descrição da loja.
- Preencher questionários de dados/privacidade.
- Publicar teste fechado.
- Corrigir feedback.
- Produção Google Play.
- Planejar iOS depois.

Entrega:

- Primeira versão pública Android.

## Ordem Recomendada

1. Fases 0 a 5
2. Fase 5.5
3. Fases 6 a 8
4. Fases 9 a 10
5. Fases 11 e 12

## Decisões Pendentes

- Provedor de email: Resend, SendGrid ou outro.
- Texto jurídico de termos/LGPD.
- Texto final/licença do IGI.
- Nome da empresa na loja.
- Domínio/email remetente oficial.
- Se o PDF será enviado como anexo ou link seguro.
- Biblioteca de compras in-app: RevenueCat ou integração direta com Google Play Billing/StoreKit.
- Configuração exata do produto: assinatura mensal vs ciclo descrito comercialmente como 4 semanas.
- Política de acesso a dados antigos quando assinatura/cortesia expirar.
- Processo seguro para bootstrap inicial do administrador.

## Fontes Técnicas

- Expo EAS Build: https://docs.expo.dev/build/setup/
- Expo Firebase: https://docs.expo.dev/guides/using-firebase/
- Firestore offline: https://firebase.google.com/docs/firestore/manage-data/enable-offline
- Expo Notifications: https://docs.expo.dev/versions/latest/sdk/notifications/
- Firebase Cloud Functions callable: https://firebase.google.com/docs/functions/callable
- Google Play Payments policy: https://support.google.com/googleplay/android-developer/answer/10281818
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple auto-renewable subscriptions: https://developer.apple.com/app-store/subscriptions/
