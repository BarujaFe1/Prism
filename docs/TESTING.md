# Testing — Prism

## Estratégia

Foco em **testes do domínio** (onde mora o valor de portfólio): scoring, red flags, deduplicação e helpers de UI.

UI e scrapers externos não são testados e2e neste pass (custosos e flaky).

## Comandos

```bash
npm test
npm run typecheck
npm run lint
npm run ci
```

## Suite atual

Arquivo: `tests/engine.test.ts` (Node.js test runner via `tsx`)

Cobertura:

- `extractTechnologies`
- `computeScore` (perfil ausente + ranking bom vs ruim)
- `detectJobRedFlags`
- `findDuplicates`
- `formatSalary` / `statusLabel` / `timeAgo`

## Como adicionar testes

1. Criar `tests/<nome>.test.ts`
2. Importar módulos com extensão `.ts`
3. Usar `node:test` + `node:assert/strict`
4. Rodar `npm test`

## Limitações conhecidas

- Não há testes de integração contra SQLite (seed/migrate) no CI
- Conectores dependem de rede e não são mockados aqui
- React Compiler rules podem emitir warnings sem falhar o CI
