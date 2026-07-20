# 04 — Progress

## Sessão 2026-07-20 (continuação)

### Concluído nesta rodada

**Fase 5 — CI/DevEx**
- Issue templates (bug/feature), PR template, Dependabot
- `CONTRIBUTING.md`, `SECURITY.md`, `docs/release-checklist.md`
- CI `pull_request` limitado a `main`/`master`

**Fase 4 (parcial) — Testes**
- `tests/scoring-gates.test.ts` + fixtures `tests/fixtures/scoring/`
- Suíte: **25** testes passando

**Fase 9 (parcial) — README**
- README reescrito com claims verificáveis (Node 22, sem URL de demo inventada, watchlist ~559 com caveat)

**Fase 6 (parcial) — UX**
- `DemoBanner` server-side quando `PRISM_DEMO_MODE` ativo

### Commits anteriores
- `5224548` fix(security)…
- `53d7051` feat(platform)…

### Validação
- `npm test` → 25 pass
- `npm run typecheck` → OK

### Como retomar
1. Ler este arquivo + `03-decisions.md`
2. Próximo: case study bilíngue, ativos de carreira, E2E Playwright, ou push/PR para `main`
3. Deploy Vercel+Turso ainda precisa de credenciais do usuário

### Fase 10–12 (parcial nesta rodada)

- Case study PT/EN
- Ativos `docs/career/*` (currículo, LinkedIn, estratégia, ATS, tracker, market-evidence amostra)
- Relatório final parcial em `05-final-report.md`

### Commits desta sessão (continuação)
- `0af8d62` ci: templates…
- `a46c7f0` docs: README + banner + scoring tests…
- (pendente) docs: case study + career assets

### Validação recente
- `npm test` → 25 pass
- `npm run typecheck` / `npm run build` → OK
