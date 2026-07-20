# 00 — Estado atual do Prism

**Data:** 2026-07-20  
**Branch de trabalho:** `feat/employability-transformation` (base: `origin/main` @ `2793c9c`)  
**Commit base:** `2793c9c` — chore: merge LICENSE from initial main branch  
**Working tree inicial:** limpo (sem alterações locais não commitadas)

## Ambiente

| Item | Valor |
|---|---|
| Node | v24.16.0 (CI alvo: 22 LTS) |
| npm | 11.13.0 |
| Remote | `https://github.com/BarujaFe1/Prism.git` |
| Branches remotas | `origin/main`, `origin/chore/portfolio-quality-pass` (`origin/master` removido) |

## Branches relevantes

| Branch | Conteúdo |
|---|---|
| `origin/main` | Produto v0.3.0 (scoring overhaul, watchlist BR, case-export, follow-ups). **Sem** CI, testes, api-guards nem hardenings. |
| `chore/portfolio-quality-pass` | Docs, CI, testes, api-guards, SQL/mass-assignment fixes. **Sem** v0.3.0 nem watchlist. |
| Estratégia | Trabalhar a partir de `main` e portar/reimplementar segurança + DevEx da quality-pass. |

## Baseline em `chore/portfolio-quality-pass` (antes do switch)

| Comando | Resultado |
|---|---|
| `npm ci` | OK |
| `npm run lint` | OK (0 errors, 143 warnings) |
| `npm run typecheck` | OK |
| `npm test` | OK — 16 pass / 0 fail |
| `npm run build` | OK — Next.js 16.2.6 |

## Scripts em `main` (v0.3.0)

`dev`, `build`, `start`, `lint`, `db:*`, `companies:*`, `jobs:*`, `setup`  
**Ausentes:** `typecheck`, `test`, `ci`, `demo:seed`, `demo:reset`

## Stack observada

Next.js 16.2.6 · React 19.2.4 · TypeScript 5 · Tailwind 4 · Drizzle + @libsql/client · TanStack Query · Zustand · Recharts · node-cron

## Árvore relevante

```
src/app/          páginas + API routes
src/components/   UI, layout, jobs, freelance
src/connectors/   fontes de vagas
src/db/           schema, seed, migrations, scores
src/engine/       scorer, normalizer, deduplicator, red-flags
src/lib/          utils, freelance, scoring rules, store
tests/            ausente em main (existe na quality-pass)
docs/             CHANGELOG + alguns docs; incompleto na main
.github/          ausente na main
```

## Rotas API (main)

Leitura: jobs, jobs/[id], profile, settings, companies, connectors GET, freelance/*, case-export, score  
Mutação: PATCH jobs, jobs/[id], profile, settings, freelance/projects; POST connectors, score, sync, scheduler, cover-letter, followups

## Riscos confirmados em `main` (fato)

1. SQL com interpolação de listas em `/api/jobs` (`IN (${statuses.join(",")})`).
2. Mass assignment: `db.update(...).set(body|updates)` em jobs, jobs/[id], profile, settings, freelance/projects.
3. Sem `PRISM_DEMO_MODE` / bloqueio de mutações.
4. Sem CI na `main`.
5. Sem testes na `main`.
6. Banco com fallback `file:prism.db` (aceitável localmente; precisa config explícita).
7. `node-cron` no processo web (inadequado para serverless).
8. Erros de API inconsistentes; às vezes `String(err)`.
9. `.gitignore` ignora `.env*` e pode ocultar `.env.example` se criado sem exceção.
10. Claims de demo pública / screenshots reais ainda não verificáveis.

## Funcionalidades comprovadas (código presente)

- Radar, pipeline, analytics, profile, sources, freelas
- Scoring v0.3.0 (`src/engine/scorer.ts` + `scoring-rules.ts`)
- Conectores múltiplos
- Watchlist de empresas BR
- Case-export, follow-ups, tasks

## Claims não comprovados nesta inspeção

- Deploy público / URL de demo
- Screenshots PNG reais
- Cobertura de testes na `main`
- “Produção” ou escala multi-usuário
