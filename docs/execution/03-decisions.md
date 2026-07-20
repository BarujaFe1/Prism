# 03 — Decisions

## ADR-WIP-001 — Base da transformação = `origin/main`

- **Contexto:** `main` tem v0.3.0 (scoring, watchlist, follow-ups). `chore/portfolio-quality-pass` tem segurança/CI/docs mas sem v0.3.0.
- **Decisão:** Branch de trabalho a partir de `main`; reimplementar/portar hardenings da quality-pass.
- **Alternativas:** Cherry-pick v0.3.0 sobre quality (conflitos altos); merge cego (risco de regressão).
- **Consequências:** Produto atual preservado; segurança precisa ser reaplicada conscientemente.

## ADR-WIP-002 — Sem merge cego da quality-pass

- Reaplicar arquivos críticos (api-guards, rotas, testes, CI) em vez de merge completo.
- Evitar perder eventos de status em PATCH `/api/jobs` que existem só na main.

## ADR-WIP-003 — Score/fitLabel não são editáveis pelo cliente

- Diferente da allowlist da quality-pass, campos calculados ficam fora do PATCH do usuário.
- Recálculo apenas via `/api/score` (bloqueado em demo).

## Pendentes

- Provedor de demo (Vercel+Turso vs outro) — custo/credenciais.
- Publicar release só com CI verde.
