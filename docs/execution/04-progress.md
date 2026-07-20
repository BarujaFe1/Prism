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

### Commits

- `fix(security): harden API inputs and database mutations` (esta sessão)

### Como retomar

1. `AGENTS.md` → `.cursor/rules/00-prism-engineering.mdc` → este arquivo → `03-decisions.md`
2. `git status` + `git log -1`
3. **Próxima:** Fase 2 — runtime/banco (`demo:seed`, docs deploy, indices, DATABASE_URL)

### Pendências Fase 1 menores

- Zod formal (allowlists manuais cobrem o crítico)
- Rate limiting HTTP (demo bloqueia mutações; sync local ainda aberto fora de demo)
- Atualizar `ws` com cuidado (sem `audit fix --force`)
