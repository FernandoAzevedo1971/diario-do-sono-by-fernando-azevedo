# DIÁRIO DO SONO — Monetização, Cortesia E Controle De Acesso

## Objetivo

Definir a regra comercial do aplicativo, combinando período gratuito limitado, assinatura paga e códigos de cortesia gerados pelo administrador.

## Regra Comercial

- O app será gratuito apenas para os **2 primeiros dias de preenchimento** do diário.
- Após o segundo dia preenchido, o paciente deverá ter:
  - assinatura ativa; ou
  - código de cortesia ativo.
- Valor inicial planejado: **R$ 19,90 por 4 semanas**.
- O app deve oferecer desde o primeiro cadastro:
  - opção de assinatura;
  - opção de inserir código de cortesia;
  - continuação no período gratuito, enquanto o limite de 2 dias ainda não foi ultrapassado.

## Compatibilidade Com Lojas

Como o app desbloqueia funcionalidade digital dentro do aplicativo, a cobrança deve usar os mecanismos oficiais das lojas:

- Android: **Google Play Billing**.
- iOS: **In-App Purchase / StoreKit**.

Observação:

- A expressão comercial pode ser “R$ 19,90 por 4 semanas”.
- A configuração exata na loja pode precisar ser feita como assinatura mensal/equivalente, conforme opções disponíveis em Google Play Console e App Store Connect.
- O app não deve direcionar o usuário a pagamento externo para desbloquear recursos digitais consumidos no app.

## Limite Gratuito

Regra:

- Contar dias efetivamente preenchidos, não dias desde cadastro.
- O paciente pode preencher até 2 datas distintas gratuitamente.
- A partir da tentativa de preencher o terceiro dia, o app deve verificar acesso ativo.

Campos sugeridos:

- `freeTrialEntriesUsed`: number
- `freeTrialEntryDates`: string[]
- `hasUsedFreeTrial`: boolean

## Assinatura

Campos sugeridos no perfil/acesso:

- `subscriptionStatus`: `none | active | grace_period | expired | canceled`
- `subscriptionProvider`: `google_play | app_store | courtesy | none`
- `subscriptionProductId`: string | null
- `subscriptionCurrentPeriodStart`: timestamp | null
- `subscriptionCurrentPeriodEnd`: timestamp | null
- `lastReceiptValidationAt`: timestamp | null

Regras:

- O app pode mostrar o status localmente, mas a liberação definitiva deve ser validada no servidor.
- Recibos/entitlements devem ser conferidos por Cloud Function ou serviço confiável.
- Em caso de falha temporária de rede, o app pode usar último status válido por curto período de tolerância.

## Código De Cortesia

Finalidade:

- Permitir que o Dr. Fernando Azevedo libere gratuitamente um paciente específico por 4 semanas.

Administrador:

- Email especial: `fazevedopneumosono@gmail.com`.
- Esse email deve receber privilégio administrativo validado no servidor.
- Preferência técnica: Firebase Custom Claims com `role: admin`.

Painel mínimo:

- Nome: **Gerar código de cortesia**.
- Campo obrigatório: email do paciente.
- Ação: gerar código.
- Resultado exibido:
  - código
  - email vinculado
  - validade após ativação: 4 semanas

Regras do código:

- Vinculado a um único email de paciente.
- Só pode ser ativado por login com o mesmo email.
- Uso único.
- Ativa gratuidade por 4 semanas a partir da ativação.
- Após expirar, precisa de novo código ou assinatura.
- Deve ser armazenado como hash, não em texto puro.

Campos sugeridos em `courtesyCodes/{codeId}`:

- `codeHash`: string
- `patientEmail`: string
- `createdByUserId`: string
- `createdByEmail`: string
- `createdAt`: timestamp
- `activatedAt`: timestamp | null
- `activatedByUserId`: string | null
- `activeUntil`: timestamp | null
- `status`: `created | activated | expired | revoked`
- `expiresIfUnusedAt`: timestamp | null

Campos sugeridos no paciente:

- `courtesyAccessUntil`: timestamp | null
- `courtesyCodeId`: string | null
- `accessStatus`: `free_trial | active_subscription | active_courtesy | blocked`

## Bloqueio E Paywall

Quando bloquear:

- paciente já preencheu 2 dias gratuitos; e
- não tem assinatura ativa; e
- não tem cortesia válida.

O que bloquear:

- novos preenchimentos do diário;
- geração de novos PDFs;
- recursos premium futuros.

O que manter acessível:

- login;
- configurações da conta;
- gerenciamento de assinatura;
- inserção de novo código de cortesia;
- privacidade, suporte e solicitação de exclusão/exportação dos dados;
- visualização mínima dos dados já inseridos, se juridicamente necessário.

Tela de bloqueio:

- Título: `Continue acompanhando seu sono`
- Texto: `Você usou os 2 dias gratuitos do DIÁRIO DO SONO. Para continuar preenchendo novos registros, assine o app ou insira um código de cortesia.`
- Botões:
  - `Assinar por R$ 19,90/4 semanas`
  - `Inserir código de cortesia`
  - `Gerenciar assinatura`

## Validações No Servidor

Funções sugeridas:

- `createCourtesyCode(patientEmail)`
  - apenas admin
  - gera código seguro
  - grava hash no banco
- `redeemCourtesyCode(code)`
  - paciente autenticado
  - compara hash
  - valida email vinculado
  - ativa 4 semanas
- `getAccessStatus()`
  - retorna estado final de acesso
- `validateSubscriptionReceipt()`
  - valida compra/assinatura na loja
- `handleSubscriptionWebhook()`
  - atualiza renovações, cancelamentos e expirações

## Segurança

- Nunca confiar apenas na interface para liberar acesso.
- Não hardcodar privilégio admin somente no app.
- Usar Cloud Functions e regras Firestore para proteger geração de códigos.
- Registrar auditoria:
  - código criado
  - código ativado
  - código revogado
  - alterações de assinatura

## Decisões Pendentes

- Usar RevenueCat ou integração direta com Google Play Billing/StoreKit.
- Definir se o produto será tecnicamente mensal ou ciclo de 4 semanas conforme disponibilidade das lojas.
- Definir tolerância em caso de falha temporária na validação da assinatura.
- Definir política exata de visualização/exportação de dados após expiração.
- Definir texto jurídico de assinatura, renovação, cancelamento e privacidade.

## Referências Oficiais

- Google Play Payments policy: https://support.google.com/googleplay/android-developer/answer/10281818
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple auto-renewable subscriptions: https://developer.apple.com/app-store/subscriptions/
