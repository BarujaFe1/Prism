# Architecture — Prism

## Visão geral

Prism é um sistema **local-first** de descoberta e priorização de oportunidades de trabalho. Ele agrega vagas e freelas de múltiplas fontes, normaliza e deduplica, calcula fit contra o perfil do usuário e apresenta um radar operacional (lista, pipeline, analytics).

```
┌──────────────────┐     ┌────────────────────┐     ┌─────────────────┐
│  Connectors      │────▶│  Engine            │────▶│  SQLite/libSQL  │
│  (jobs + freelas)│     │  normalize/dedupe  │     │  (Drizzle ORM)  │
└──────────────────┘     │  score/red-flags   │     └────────┬────────┘
                         └────────────────────┘              │
                                                             ▼
┌──────────────────┐     ┌────────────────────┐     ┌─────────────────┐
│  UI (App Router) │◀────│  API Routes        │◀────│  React Query    │
│  Radar/Pipeline  │     │  /api/jobs|...     │     │  + Zustand      │
└──────────────────┘     └────────────────────┘     └─────────────────┘
```

## Camadas

| Camada | Pasta | Responsabilidade |
|---|---|---|
| UI | `src/app/*`, `src/components/*` | Páginas, layout, estados de loading/empty |
| API | `src/app/api/*` | HTTP fino sobre DB + conectores |
| Domain engine | `src/engine/*` | Scoring, normalização, dedupe, red flags |
| Connectors | `src/connectors/*`, `src/lib/freelance/connectors/*` | Coleta de fontes externas |
| Persistence | `src/db/*` | Schema Drizzle, seed, migrations |
| Shared | `src/types/*`, `src/lib/utils.ts` | Tipos e helpers |

## Rotas principais

- `/` Radar (daily briefing + alto fit)
- `/explore` Busca/filtros avançados
- `/pipeline` Kanban de candidaturas
- `/analytics` Distribuições e insights
- `/sources` Saúde e sync dos conectores
- `/profile` Preferências e skills
- `/freelas/*` Módulo paralelo de projetos freelance

## Persistência

- Default: `file:prism.db` (SQLite via `@libsql/client`)
- Produção recomendada: Turso (`DATABASE_URL` + `DATABASE_AUTH_TOKEN`)
- Schema: `src/db/schema.ts` + `src/db/schema/freelance.ts`

## Fluxo de coleta

1. UI chama `POST /api/connectors` (ou sync freelance)
2. Cada conector busca e salva jobs/projetos
3. Engine calcula score / flags quando scores são recomputados (`npm run db:scores`)
4. Radar consome `GET /api/jobs`

## Limites conscientes

- Sem autenticação (uso pessoal/local)
- Scheduler (`node-cron`) vive no processo Node — inadequado para serverless puro sem worker
- Fontes externas podem falhar; erros são isolados por conector
