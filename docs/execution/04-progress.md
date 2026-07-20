# 04 — Progress

## Sessão 2026-07-20

### Protocolo inicial — concluído

- Working tree limpo na inspeção — **nada descartado**.
- Branch: `feat/employability-transformation` ← `origin/main` @ `2793c9c`.
- Inventário: `docs/execution/00–03`.
- Regra Cursor: `.cursor/rules/00-prism-engineering.mdc`.

### Fase 1 — Segurança — concluída (local)

**Validação na branch de trabalho:**

| Comando | Resultado |
|---|---|
| `npm run lint` | OK (0 errors, 93 warnings) |
| `npm run typecheck` | OK |
| `npm test` | OK — 18 pass / 0 fail |
| `npm run build` | OK |

**Alterações principais:**

- `src/lib/api-guards.ts` — allowlists, demo mode, erros padronizados, escape LIKE, enums filtrados
- `/api/jobs` — `inArray` + clamp + sanitização (preserva eventos de status da main)
- `/api/jobs/[id]` — sem mass assignment
- profile / settings / freelance projects — allowlists + demo
- connectors / sync / score / scheduler / cover-letter / followups / tasks — bloqueados em demo
- CI, `.env.example`, `.nvmrc`, `engines.node`, testes de regressão

**npm audit (omit=dev):** postcss via next (moderate; fix forçado quebraria Next), ws high (avaliar na Fase 2 sem `--force`).

### Fase 2 — Runtime/banco — concluída (local)

- `scripts/demo-seed.ts` — 25 vagas sintéticas determinísticas + perfil demo
- `npm run demo:seed` / `demo:reset` (reset exige `CONFIRM=1` e URL com `demo`)
- Índices em `jobs` (status, score, posted_at, source, hash, unique source+source_id)
- Migration SQL `0001_jobs_indexes.sql` + schema Drizzle
- `drizzle.config.ts` usa `DATABASE_URL`
- Docs: `docs/deployment.md`, `docs/demo-mode.md`, ADRs 001/002
- Validado: `db:push` + `demo:seed` em `file:demo.db`; typecheck OK

### Commits

- `fix(security): harden API inputs and database mutations`
- `feat(platform): add reproducible database and demo configuration` (pendente)

### Próxima

Fase 3 (APIs/TS) ou Fase 5 CI polish + README parcial — preferir continuar plataforma/docs visíveis.