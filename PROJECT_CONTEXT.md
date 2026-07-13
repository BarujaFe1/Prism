# PROJECT CONTEXT — Prism

## 1. DIRETÓRIO DO PROJETO

`C:\Users\BarujaFe\prism`

---

## 2. FINALIDADE DO SISTEMA

**Prism — Radar de Oportunidades** é um sistema pessoal de **descoberta, organização e priorização de vagas de emprego e oportunidades de trabalho**. Ele agrega vagas de diversas fontes (LinkedIn, Gupy, RemoteOK, Stack Overflow, etc.), analisa o fit com o perfil do usuário usando um motor de scoring, e apresenta um dashboard estilo "radar" para acompanhamento.

Também possui um módulo **freelance** que busca projetos em plataformas como Upwork, Freelancer, Toptal, Contra, etc., com scoring próprio, geração de cover letter e agendamento de sincronia.

---

## 3. STACK TECNOLÓGICA

| Tecnologia | Versão | Uso |
|---|---|---|
| **Next.js** | 16.2.6 | Framework web (App Router) |
| **React** | 19.2.4 | UI |
| **TypeScript** | 5 | Linguagem |
| **Tailwind CSS** | 4 | Estilização |
| **Drizzle ORM** | 0.45.2 | ORM + migrations |
| **SQLite (libSQL/turso)** | — | Banco de dados local |
| **TanStack React Query** | 5.100.11 | Data fetching / caching |
| **Zustand** | 5.0.13 | Estado global |
| **Framer Motion** | 12.39.0 | Animações |
| **Recharts** | 3.8.1 | Gráficos |
| **Lucide React** | 1.16.0 | Ícones |
| **Fast-XML-Parser** | 5.8.0 | Parsing de RSS/XML |
| **node-cron** | 4.2.1 | Agendamento de tarefas |
| **next/font (Geist)** | — | Fontes tipográficas |

**Sem autenticação**, **sem Stripe**, **sem tRPC**, **sem LLM** — é um sistema local de uso pessoal.

---

## 4. ESTRUTURA DE DIRETÓRIOS

```
prism/
├── src/
│   ├── app/                    # Next.js App Router (páginas + API)
│   │   ├── api/                # Rotas de API
│   │   │   ├── companies/
│   │   │   ├── connectors/
│   │   │   ├── freelance/      # cover-letter, projects, rate-benchmark, scheduler, sync
│   │   │   ├── jobs/           # [id]/, [id]/tasks/
│   │   │   ├── profile/
│   │   │   ├── score/
│   │   │   └── settings/
│   │   ├── freelas/            # Módulo freelance (páginas)
│   │   ├── jobs/               # Detalhe da vaga
│   │   ├── pipeline/           # Pipeline de candidaturas
│   │   ├── profile/            # Perfil do usuário
│   │   ├── settings/           # Configurações
│   │   ├── sources/            # Fontes de dados
│   │   ├── explore/            # Explorar vagas
│   │   ├── analytics/          # Analytics
│   │   ├── globals.css         # Estilos globais
│   │   ├── layout.tsx          # Layout raiz
│   │   ├── page.tsx            # Página inicial (Radar)
│   │   ├── providers.tsx       # Providers globais
│   │   └── radar-list.tsx      # Componente de listagem do radar
│   ├── components/
│   │   ├── freelance/          # Componentes freelance
│   │   ├── jobs/               # Components de vagas
│   │   ├── layout/             # Shell, Sidebar, ThemeProvider
│   │   └── ui/                 # badge, button, card, input, toast, ErrorBoundary
│   ├── connectors/             # 20 conectores de fontes de vagas
│   ├── db/                     # Schema, migrations, seed
│   │   ├── schema/             # Schemas adicionais (freelance)
│   │   └── migrations/         # Migrations Drizzle
│   ├── engine/                 # Motor: deduplicator, normalizer, scorer, red-flags
│   ├── lib/                    # Utilitários
│   │   ├── freelance/          # Lógica freelance: connectors, scheduler, sync, scoring, alerts
│   │   └── scoring/            # Motor de scoring freelance
│   └── types/                  # Tipos TypeScript
├── prism.db                    # Banco SQLite
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
├── CLAUDE.md
├── AGENTS.md
├── start.bat
└── README.md
```

---

## 5. MAPEAMENTO DE TELAS (ROTAS)

| Rota | Página | Descrição |
|---|---|---|
| `/` | `src/app/page.tsx` | **Radar** — Dashboard principal com cards de vagas, filtros, daily briefing e estatísticas |
| `/sources` | `src/app/sources/page.tsx` | Gerenciamento de fontes de dados (conectores ativos) |
| `/jobs/[id]` | `src/app/jobs/[id]/page.tsx` | Detalhe da vaga com score, tasks, follow-ups |
| `/pipeline` | `src/app/pipeline/page.tsx` | Pipeline de candidaturas (Kanban-style) |
| `/profile` | `src/app/profile/page.tsx` | Edição de perfil do usuário (skills, desejos, etc.) |
| `/settings` | `src/app/settings/page.tsx` | Configurações do sistema |
| `/freelas` | `src/app/freelas/page.tsx` | Lista de oportunidades freelance |
| `/freelas/[id]` | `src/app/freelas/[id]/page.tsx` | Detalhe de oportunidade freelance |
| `/freelas/analytics` | `src/app/freelas/analytics/page.tsx` | Analytics freelance |
| `/freelas/clientes` | `src/app/freelas/clientes/page.tsx` | Clientes freelance |
| `/freelas/explorar` | `src/app/freelas/explorar/page.tsx` | Explorar oportunidades freelance |
| `/freelas/pipeline` | `src/app/freelas/pipeline/page.tsx` | Pipeline freelance |
| `/explore` | `src/app/explore/page.tsx` | Explorar vagas |
| `/analytics` | `src/app/analytics/page.tsx` | Analytics do sistema |

**Layout global:** `src/app/layout.tsx` — Providers (ThemeProvider, ToastProvider, QueryClient) + fontes Geist.

---

## 6. ROTAS DE API

| Método | Rota | Arquivo | Função |
|---|---|---|---|
| GET | `/api/jobs` | `api/jobs/route.ts` | Listar vagas (com paginação/filtros) |
| GET | `/api/jobs/[id]` | `api/jobs/[id]/route.ts` | Detalhe de uma vaga |
| POST | `/api/jobs/[id]/tasks` | `api/jobs/[id]/tasks/route.ts` | Criar task para vaga |
| GET | `/api/companies` | `api/companies/route.ts` | Listar empresas-alvo |
| GET | `/api/connectors` | `api/connectors/route.ts` | Listar/executar conectores |
| GET | `/api/profile` | `api/profile/route.ts` | Obter perfil |
| PUT | `/api/profile` | `api/profile/route.ts` | Atualizar perfil |
| GET | `/api/settings` | `api/settings/route.ts` | Obter configurações |
| PUT | `/api/settings` | `api/settings/route.ts` | Atualizar configurações |
| GET | `/api/score` | `api/score/route.ts` | Calcular/obter score |
| POST | `/api/freelance/sync` | `api/freelance/sync/route.ts` | Sincronizar freelance |
| POST | `/api/freelance/scheduler/start` | `api/freelance/scheduler/start/route.ts` | Iniciar scheduler |
| POST | `/api/freelance/scheduler/stop` | `api/freelance/scheduler/stop/route.ts` | Parar scheduler |
| POST | `/api/freelance/generate-cover-letter` | `api/freelance/generate-cover-letter/route.ts` | Gerar cover letter |
| GET | `/api/freelance/rate-benchmark` | `api/freelance/rate-benchmark/route.ts` | Benchmark de taxas |

---

## 7. SCHEMA DO BANCO DE DADOS

**Banco:** SQLite (`prism.db`) via Drizzle ORM com libSQL/turso.

**Schema principal:** `src/db/schema.ts` + `src/db/schema/freelance.ts`

### Tabelas:

| Tabela | Descrição | Campos Principais |
|---|---|---|
| **jobs** | Vagas de emprego | id, title, company, description, hash, location, locationType, salaryMin/Max, currency, salaryPeriod, contractType, experienceLevel, technologies[], tags[], source, sourceId, url, postedAt, fetchedAt, isNormalized, isInternational, city, country, detectedLanguage, translatedDescription, score, scoreDetails, summary, gaps[], keyRequirements[], fitLabel, coverSuggestion, rawData, status (new|saved|high_priority|preparing|applied|reviewing|interview|offer|rejected|ignored|archived), nextActionType, nextActionDate, lastContactedAt, createdAt, updatedAt |
| **job_events** | Eventos de vagas | id, jobId (FK jobs), eventType, description, metadata, occurredAt |
| **job_followups** | Follow-ups | id, jobId (FK jobs), title, note, dueAt, done, doneAt |
| **saved_searches** | Buscas salvas | id, name, filters, notifyInApp, lastRunAt, lastNewCount |
| **sources** | Fontes de dados | id, name, type, enabled, config, lastSyncAt, lastError, lastJobCount |
| **connector_logs** | Logs de conectores | id, connectorName, runAt, jobsFetched, jobsNew, jobsDuplicate, errorMessage, durationMs |
| **profile** | Perfil do usuário | id, name, headline, summary, skills[], desiredRoles[], desiredSalaryMin/Max, desiredCurrency, desiredLocationTypes[], desiredContractTypes[], experienceLevel, languages[], negativeKeywords[], githubUrl, linkedinUrl, portfolioUrl, contactEmail, **freelanceMinHourlyRate, freelancePreferredCurrency, freelanceAvailableHoursPerWeek, freelanceOpenToFixedPrice, freelanceMinFixedProjectValue, freelanceExperienceYears, freelancePortfolioUrl, freelanceSpecialization** |
| **target_companies** | Empresas-alvo | id, name, domain, careersUrl, atsType (greenhouse|lever|ashby|workday|custom), keywords[], lastCrawledAt, lastError, isActive |
| **settings** | Configurações | id, syncFrequency, notificationsEnabled, followUpDays, alertHighFitDays, dailyBriefingEnabled, lastBackupAt |
| **application_tasks** | Tasks de candidatura | id, jobId (FK jobs), type, label, isDone, completedAt |
| **freelance_opportunities** | Oportunidades freelance | (definido em `schema/freelance.ts`) |
| **freelance_events** | Eventos freelance | (definido em `schema/freelance.ts`) |

**Relacionamentos:** `job_events`, `job_followups` e `application_tasks` referenciam `jobs.id` com `ON DELETE CASCADE`.

---

## 8. CONECTORES DE VAGAS (20 fontes)

`src/connectors/` — Cada conector implementa uma interface `Connector` (definida em `base.ts`):

| Arquivo | Fonte | Tipo |
|---|---|---|
| `base.ts` | Classe base abstrata | Interface |
| `linkedin-rss.ts` | LinkedIn RSS | RSS |
| `gupy.ts` | Gupy | API/Scraper |
| `remoteok.ts` | RemoteOK | API |
| `remotive.ts` | Remotive | API |
| `stackoverflow.ts` | Stack Overflow Jobs | RSS |
| `github.ts` (não encontrado) | — | — |
| `greenhouse.ts` | Greenhouse | API |
| `lever.ts` | Lever | API |
| `weworkremotely.ts` | We Work Remotely | Feed |
| `wellfound.ts` | Wellfound (AngelList) | API |
| `4dayweek.ts` | 4 Day Week | API |
| `arbeitnow.ts` | Arbeitnow | API |
| `google-jobs.ts` | Google Jobs | Scraper |
| `hackernews.ts` | Hacker News (Who's Hiring) | Scraper |
| `himalayas.ts` | Himalayas | API |
| `jobicy.ts` | Jobicy | API |
| `nodesk.ts` | No Desk | API |
| `remote-co.ts` | Remote.co | Scraper |
| `revelo.ts` | Revelo | API |
| `company-crawler.ts` | Crawler de empresas-alvo | Scraper |
| `utils.ts` | Utilitários de conectores | Helpers |

### Conectores Freelance (`src/lib/freelance/connectors/`):

| Arquivo | Fonte |
|---|---|
| `upwork-rss.ts` | Upwork RSS |
| `freelancer-rss.ts` | Freelancer RSS |
| `toptal-feed.ts` | Toptal |
| `contra.ts` | Contra |
| `malt-scraper.ts` | Malt |
| `remoteok-contract.ts` | RemoteOK Contract |
| `simplyhired.ts` | SimplyHired |
| `pph-rss.ts` | PeoplePerHour RSS |
| `wwr-contract.ts` | We Work Remotely Contract |

---

## 9. MOTOR DE ANÁLISE (ENGINE)

`src/engine/` — Pipeline de processamento de vagas:

| Arquivo | Função |
|---|---|
| `normalizer.ts` | Normalização de dados brutos (padronização de campos, limpeza de texto) |
| `deduplicator.ts` | Deduplicação de vagas (por hash, título + empresa, etc.) |
| `scorer.ts` | Motor de scoring: calcula fit entre vaga e perfil do usuário |
| `red-flags.ts` | Detecção de red flags em vagas (sinais de alerta) |

**Fluxo:** Conector coleta → Normalizer limpa → Deduplicator remove duplicatas → Scorer calcula score → Salva no banco.

---

## 10. REGRAS DE NEGÓCIO PRINCIPAIS

1. **Scoring de vagas:** Cada vaga recebe um `score` (0-1) e um `fitLabel` (high/good/partial/low) baseado em:
   - Compatibilidade de skills (match com perfil do usuário)
   - Experiência (compatibilidade do nível)
   - Localização (remote/hybrid/onsite)
   - Salário (dentro da faixa desejada)
   - Tipo de contrato
   - Score é armazenado em `jobs.score` e detalhes em `jobs.scoreDetails`

2. **Daily Briefing:** Exibido na página inicial com:
   - Follow-ups atrasados (>5 dias sem atualização em vagas applied/reviewing/interview)
   - Alto fit sem ação (vagas com fitLabel "high" em status new/saved)
   - Recomendação do dia (vaga com maior score em status "new")

3. **Pipeline de candidatura:** Status tracking (new → saved → high_priority → preparing → applied → reviewing → interview → offer/rejected)

4. **Deduplicação:** Vagas duplicadas são identificadas via hash e removidas automaticamente

5. **Sincronização agendada:** Conectores executam em frequência configurável (default: 6h)

6. **Tradução:** Descrições em outros idiomas são detectadas e traduzidas para português

7. **Suporte a red flags:** Vagas com características suspeitas são sinalizadas

---

## 11. FLUXO DE DADOS PRINCIPAL

```
[Conectores (20 fontes)]
       ↓
[API Routes: /api/jobs, /api/connectors]
       ↓
[Engine: Normalizer → Deduplicator → Scorer → RedFlags]
       ↓
[Drizzle ORM → SQLite (prism.db)]
       ↓
[React Query ← API Routes]
       ↓
[Componentes React: RadarList, JobCard, etc.]
       ↓
[Usuário interage: filtra, aplica, atualiza status]
```

**Fluxo Freelance** (paralelo):
```
[Connectors Freelance (9 fontes)]
       ↓
[FreelanceScoreEngine]
       ↓
[Banco + API /api/freelance/*]
       ↓
[UI Freelas]
```

---

## 12. PACOTES E DEPENDÊNCIAS

### Produção:
- `@libsql/client` — Driver SQLite/libSQL
- `@tanstack/react-query` — Data fetching
- `class-variance-authority` — Variantes de classes CSS
- `clsx` — Classes condicionais
- `drizzle-orm` — ORM
- `fast-xml-parser` — Parse XML/RSS
- `framer-motion` — Animações
- `lucide-react` — Ícones
- `next` — Framework
- `node-cron` — Cron jobs
- `react` / `react-dom` — UI
- `recharts` — Gráficos
- `tailwind-merge` — Merge de classes Tailwind
- `zustand` — Estado global

### Dev:
- `@tailwindcss/postcss` — PostCSS plugin Tailwind v4
- `@types/node` / `@types/react` / etc. — Tipagens
- `drizzle-kit` — CLI do Drizzle (migrations, studio)
- `eslint` + `eslint-config-next`
- `tailwindcss`
- `typescript`

---

## 13. SCRIPTS DISPONÍVEIS

| Script | Comando | Descrição |
|---|---|---|
| `npm run dev` | `next dev` | Servidor de desenvolvimento |
| `npm run build` | `next build` | Build de produção |
| `npm run start` | `next start` | Servidor de produção |
| `npm run lint` | `eslint` | Lint |
| `npm run db:generate` | `drizzle-kit generate` | Gerar migration |
| `npm run db:push` | `drizzle-kit push` | Push schema ao banco |
| `npm run db:seed` | `npx tsx src/db/migrate.ts` | Executar migrations + seed |
| `npm run db:studio` | `drizzle-kit studio` | Abrir Drizzle Studio |
| `npm run db:scores` | `npx tsx src/db/compute-scores.ts` | Recalcular scores |
| `npm run setup` | `db:push + db:seed + db:scores` | Setup completo |

---

## 14. DÍVIDA TÉCNICA / PONTOS DE ATENÇÃO

1. **Sem autenticação:** Sistema 100% local, sem login/multi-usuário
2. **Sem LLM integrado:** Cover letters e análises não usam IA (sem OpenAI/etc.)
3. **Sem testes:** Nenhum teste unitário ou de integração encontrado
4. **Sem tRPC:** Toda comunicação é via fetch direto a API Routes Next.js
5. **Sem variáveis de ambiente:** Configurações no banco SQLite apenas
6. **Dependências desatualizadas:** `@types/node ^20`, `typescript ^5` (versões podem estar defasadas)
7. **Next.js 16.2.6:** Cutting edge — estável pode ser questionável
8. **Sem Docker/containerização:** Sistema roda diretamente com Node.js
9. **Sem CI/CD:** Nenhum pipeline de integração contínua
10. **Sem documentação de API:** Endpoints não documentados formalmente
11. **Drizzle Kit v0.31:** Pode ter breaking changes em versões futuras
12. **Conectores frágeis:** Muitos dependem de scraping/RSS que podem quebrar

---

## 15. GUIAS PARA IA (CLAUDE.md / AGENTS.md)

Os arquivos `CLAUDE.md` e `AGENTS.md` existentes contêm instruções para assistentes de IA. Eles descrevem uma estrutura de projeto que **NÃO corresponde à realidade atual do código** (mencionam tRPC, Stripe, chat, actions, etc. que não existem). Recomenda-se atualizar esses arquivos para refletir a estrutura real.

---

## 16. MAPA DE IMPACTO (MODIFICAÇÕES)

| Área | Arquivos | Risco |
|---|---|---|
| Schema DB | `src/db/schema.ts`, `src/db/schema/freelance.ts` | Alto — afeta todo o sistema |
| Conectores | `src/connectors/*.ts`, `src/lib/freelance/connectors/*.ts` | Médio — fonte-específico |
| Engine | `src/engine/*.ts` | Alto — afeta scoring/normalização |
| API Routes | `src/app/api/**/route.ts` | Médio — contrato com frontend |
| Páginas | `src/app/**/page.tsx` | Baixo-Médio — UI isolada |
| Componentes | `src/components/**/*.tsx` | Baixo — geralmente isolados |
| Layout | `src/app/layout.tsx`, `src/components/layout/*.tsx` | Alto — afeta toda a UI |
| Tipos | `src/types/index.ts` | Alto — usado em todo o sistema |
| Estilos | `src/app/globals.css` | Baixo-Médio — estilos globais |

---

## 17. RESUMO PARA IA

**Prism** é um sistema **Next.js 16 + React 19 + SQLite (Drizzle)** para gestão personalizada de vagas de emprego e oportunidades freelance. Opera localmente sem autenticação, conectando-se a ~30 fontes via conectores/scrapers. Possui motor próprio de scoring e fit analysis, dashboard "Radar" com daily briefing, pipeline de candidaturas, e analytics. O código está em `C:\Users\BarujaFe\prism`, banco em `prism.db`, sem testes automatizados, sem LLM, sem tRPC, sem Stripe.
