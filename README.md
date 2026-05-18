# DIÁRIO DO SONO

Aplicativo mobile-first para diário clínico do sono, com funcionamento offline, sincronização posterior, cálculos automáticos, IGI e geração de PDF.

## Estrutura

- `apps/mobile`: app Expo/React Native do paciente
- `apps/functions`: funções servidor para PDF, emails e rotinas
- `packages/core`: cálculos, validações e tipos compartilhados
- `docs`: documentação funcional e técnica
- `firebase`: regras e índices do Firebase

## Primeiros comandos planejados

```bash
npm install
npm run core:test
npm run mobile
```

Antes de executar o app real, configure os dados Firebase conforme `.env.example`.
