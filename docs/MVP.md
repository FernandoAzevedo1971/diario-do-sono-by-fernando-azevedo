# DIÁRIO DO SONO — Especificação MVP

## Produto

- Nome: **DIÁRIO DO SONO**
- Plataforma inicial: app mobile com **React Native + Expo**
- Publicação: Google Play primeiro, Apple Store depois
- Backend: **Firebase**
- Modo padrão: escuro
- Estilo: wellness premium
- Monetização: gratuito nos 2 primeiros dias de preenchimento, depois assinatura/cortesia

## Objetivo

Permitir que pacientes registrem diariamente dados subjetivos do sono pela manhã, funcionando offline e sincronizando quando houver internet. O app deve calcular métricas de sono automaticamente, gerar PDF para envio ao médico e acompanhar a gravidade de insônia com o Índice de Gravidade de Insônia.

## Perfil Do Paciente

Campos:

- Nome
- Email
- Data de nascimento
- Gênero:
  - Masculino
  - Feminino
  - Prefiro não informar
- Horário habitual de sair da cama
- Consentimento LGPD/privacidade

## Fluxo Inicial

1. Splash
2. Boas-vindas
3. Cadastro/login
4. Consentimento
5. Perfil básico
6. Tela de acesso ao app:
   - assinar mensalmente/4 semanas
   - inserir código de cortesia
   - continuar no período gratuito, se ainda houver limite disponível
7. Convite para IGI
8. Instruções
9. Diário de hoje

## Monetização E Acesso

Regra comercial:

- O app será gratuito apenas para os 2 primeiros dias de preenchimento do diário.
- Após o segundo dia preenchido, novos preenchimentos e recursos premium devem ser liberados apenas com assinatura ativa ou código de cortesia válido.
- O valor inicial será de **R$ 19,90 por 4 semanas**.
- Para compatibilidade com Google Play e Apple App Store, a cobrança deve ser implementada como compra/assinatura dentro do aplicativo, usando os mecanismos oficiais de cobrança das lojas.

Opções exibidas desde o primeiro cadastro:

- Assinar o app.
- Inserir código de cortesia do Dr. Fernando Azevedo.
- Continuar usando gratuitamente enquanto ainda não ultrapassou 2 dias preenchidos.

Código de cortesia:

- Só pode ser gerado pelo administrador Dr. Fernando Azevedo.
- O acesso administrativo especial deve ser vinculado ao email `fazevedopneumosono@gmail.com`.
- O código deve ser gerado para um email específico de paciente.
- O código só pode ativar gratuidade no login do paciente com o mesmo email para o qual foi gerado.
- A gratuidade dura 4 semanas a partir da ativação.
- Após 4 semanas, será necessário gerar novo código ou o app deverá solicitar assinatura.
- O código deve ser de uso único, armazenado de forma segura e validado no servidor.

Bloqueio após fim do acesso:

- Bloquear novos preenchimentos do diário após o limite gratuito, assinatura expirada ou cortesia expirada.
- Manter acesso mínimo a conta, privacidade, suporte, exclusão de dados e visualização/exportação legalmente necessária dos próprios dados.
- Exibir tela clara com opções:
  - assinar por R$ 19,90/4 semanas
  - inserir novo código de cortesia
  - gerenciar assinatura

## Instruções

Texto exibido no primeiro uso:

> COMPLETE UMA COLUNA DO DIÁRIO A CADA MANHÃ, LOGO QUE SE LEVANTAR, a fim de registrar de modo mais fidedigno o seu repouso. É extremamente importante que possa fornecer sua impressão e percepção, além de vigiar o relógio para acertar as horas. Não se esqueça de preencher o horário o mais preciso que puder. A sua estimativa é importante e é o que procuramos com este diário, mas procure não adquirir o hábito de pausar a noite para vigiar o relógio.

## Perguntas Diárias Obrigatórias

- A que horas você foi para a cama ontem?
- Quanto tempo estima que demorou para dormir?
- Quantas vezes você acordou durante a noite?
- No total, quanto tempo ficou acordado durante a noite?
- A que horas você acordou definitivamente?
- Quanto tempo demorou para sair da cama?
- Ao todo, quanto tempo acha que dormiu?
- Como foi a qualidade do sono esta noite?
  - Boa ou muito boa
  - Regular ou média
  - Ruim ou péssima
- Como se sente nesta manhã?
  - Descansado
  - Cansado
  - Sonolento

## Perguntas Opcionais

- Ingeriu álcool ontem? Que horas? Quanto?
- Fez atividade física ontem? Qual horário?
- Como se sentiu durante o dia ontem?
  - Descansado
  - Cansado
  - Sonolento

## Cálculos

- **LIS**: tempo para dormir
- **TTC**: hora que foi para cama até hora que saiu da cama
- **WASO**: tempo acordado durante a noite
- **Fragmentação**: número de despertares
- **Inércia**: tempo para sair da cama
- **TTS calculado**: `TTC - LIS - WASO - Inércia`
- **TTS percebido**: resposta do paciente
- **Eficiência do sono**: `TTS calculado / TTC x 100`
- **Diferença**: `TTS percebido - TTS calculado`

## Validações

- Campos obrigatórios não podem ficar vazios.
- Horários em `HH:mm`.
- Minutos inteiros `>= 0`.
- Despertares inteiro `>= 0`.
- Um registro por data.
- `TTC > 0`.
- `TTS calculado >= 0`.
- Eficiência entre `0` e `100`.
- Se valores forem incomuns, pedir confirmação.

## Médias

Após cada resposta, exibir:

> VALOR MÉDIO DE X DIAS DE PREENCHIMENTO

Calcular médias de:

- LIS
- TTC
- WASO
- Fragmentação
- Inércia
- TTS calculado
- TTS percebido
- Eficiência
- Qualidade do sono
- Sensação ao acordar
- Sensação durante o dia, se preenchida

## Índice De Gravidade De Insônia

- Oferecido no primeiro cadastro.
- Reoferecido a cada 14 dias.
- Pop-up: **Que tal reavaliar a gravidade da sua insônia?**
- 7 itens, pontuação 0–4.
- Total: 0–28.
- Classificação:
  - `0–7`: ausência de insônia clinicamente significativa
  - `8–14`: insônia subclínica
  - `15–21`: insônia clínica moderada
  - `22–28`: insônia clínica grave
- Histórico preservado.
- Entra no PDF.

### Conteúdo Do IGI

Instrução:

> Para cada item, escolha a opção que melhor descreve sua experiência nas últimas duas semanas.

Itens:

1. Dificuldade para iniciar o sono
2. Dificuldade para manter o sono
3. Acordar mais cedo do que gostaria
4. Satisfação com o padrão atual de sono
5. Quanto seu problema de sono interfere nas atividades do dia a dia
6. Quanto outras pessoas percebem prejuízo em sua qualidade de vida relacionado ao sono
7. Quanto você está preocupado(a) ou incomodado(a) com seu problema de sono

## Questionários Protegidos

No app, informar:

- O PSQI e a DBAS são instrumentos úteis para avaliação clínica do sono, mas protegidos por direitos autorais.
- Devem ser aplicados em consultório médico quando indicados.
- Não serão preenchidos dentro do app.

## Offline

- App salva respostas localmente.
- Sincroniza automaticamente ao reconectar.
- Paciente normalmente usa um único celular.
- Em caso de conflito, última edição vence.
- Status visível:
  - Salvo no aparelho
  - Sincronizado

## Notificações

- Lembrete local diário.
- Horário: 1h após horário habitual de sair da cama.
- Só notificar se ainda não houver registro no dia.
- Texto:

> Bom dia. Que tal preencher seu Diário do Sono de hoje?

## PDF MVP

Gerado no servidor.

Inclui:

- Dados do paciente
- Período
- Tabela diária
- Médias
- Eficiência do sono
- TTS calculado vs percebido
- Dados opcionais
- Resultado mais recente do IGI
- Histórico do IGI, se houver
- Aviso: não substitui avaliação médica

## Envio Ao Médico

- Paciente informa email do médico.
- PDF é enviado por email ou link seguro.
- Painel médico/admin fica para etapa posterior.

## Telas MVP

- Splash
- Boas-vindas
- Cadastro
- Login
- Consentimento
- Perfil inicial
- Convite IGI
- Instruções
- Hoje
- Questionário diário
- Resultado
- Médias
- Histórico
- Detalhe/edição do registro
- Questionários
- IGI
- Assinatura
- Inserir código de cortesia
- Painel admin: gerar código de cortesia
- Gerar PDF
- Enviar ao médico
- Configurações

## Fora Do MVP

- Painel médico/admin completo
- Chat médico
- Apple Health/Google Fit
- Monitoramento automático
- Gráficos avançados
- Multi-idioma

Observação: o painel médico completo fica fora do MVP, mas o painel administrativo mínimo para gerar códigos de cortesia entra no MVP por ser necessário à regra de acesso.
