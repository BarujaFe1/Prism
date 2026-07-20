# 01 — Risk register

| ID | Risco | Severidade | Status | Evidência | Mitigação |
|---|---|---|---|---|---|
| R01 | SQL injection / filtros IN inseguros em `/api/jobs` | P0 | Em correção | `src/app/api/jobs/route.ts` usa `sql\`...\${statuses.join(",")}\`` | `inArray` + allowlists + clamp |
| R02 | Mass assignment em PATCH jobs/profile/settings/freelance | P0 | Em correção | `.set(body)` / `.set(updates)` | allowlists + demo mode |
| R03 | Mutações públicas sem demo read-only | P0 | Em correção | Sem `PRISM_DEMO_MODE` na main | `isDemoMode()` em todas mutações caras |
| R04 | Sync/connectors/score/scheduler sem proteção | P0 | Em correção | POST livres | bloquear em demo + documentar local-first |
| R05 | CI ausente na main | P1 | Pendente | Sem `.github/workflows` | portar CI Node 22 |
| R06 | Testes ausentes na main | P1 | Pendente | Sem `tests/` | portar + expandir |
| R07 | Cron no processo web | P2 | Documentar | `node-cron` + SchedulerInit | só local; scheduler externo depois |
| R08 | Dados pessoais em seed/export | P1 | Auditar | case-export / profile seed | demo sintético |
| R09 | LIKE com wildcards do usuário | P2 | Melhorar | `%${search}%` | escapar `%` `_` |
| R10 | Divergência main vs quality-pass | P1 | Em curso | branches divergentes | base main + portar segurança |
| R11 | Score/fitLabel editáveis pelo cliente (quality) | P1 | Evitar | allowlist antiga incluía score | excluir campos calculados |
| R12 | Sem engines.node / .nvmrc | P2 | Pendente | package.json main | Node ≥22 |
