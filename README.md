# Prism

**Personal opportunity ranking system** — ingest multi-source job/freelance feeds, normalize + dedupe, score fit against a profile, and drive a decision UI (Radar → Pipeline → Analytics).

> Portfolio role: **selecionado** (Tier B). Strong local-first lab for analytical full-stack / data-product thinking. Not a public multi-tenant SaaS.

![Radar](public/screenshots/radar.svg)

---

## Problem & audience

**Problem:** Job and freelance search is fragmented. Duplicates, missing salary, noisy titles and no ranking make prioritization hard.

**Audience:** The primary user is the builder (personal cockpit). As a portfolio piece, it targets recruiters for:

- analytics engineering / data product
- analytical full-stack
- early data engineering (ingestion + modeling mindset)

It is **not** positioned as “enterprise AI hiring platform”.

## Solution & flow

1. **Ingest** public APIs/RSS via connectors  
2. **Normalize** fields + language/location tags  
3. **Dedupe** near-identical postings  
4. **Score** with an explainable weighted model (+ red flags)  
5. **Act** via Radar briefing, Kanban pipeline and skill analytics  

```
Connectors → Engine (normalize / dedupe / score / red-flags) → SQLite/libSQL
                                                              ↓
UI (Radar, Pipeline, Analytics) ← API Routes ← React Query
```

Methodology: [`docs/SCORING_METHODOLOGY.md`](docs/SCORING_METHODOLOGY.md)

## What this project demonstrates

- Domain modeling for ranking / decision products
- Multi-source ingestion with partial failure tolerance
- Deterministic scoring you can defend in an interview
- Full-stack TypeScript (Next.js App Router + Drizzle)
- Portfolio hygiene: tests, CI, docs, demo script, security notes

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind 4 · Drizzle + SQLite/libSQL · TanStack Query · Zustand · Recharts · GitHub Actions

## Real status (honest)

| Item | Status |
|---|---|
| Local demo with seed | ✅ |
| Unit tests + CI | ✅ |
| Public auth | ❌ (local-first) |
| Vercel + Turso live deploy | ❌ not provisioned |
| Real PNG screenshots | ⚠️ SVG placeholders; capture via `docs/DEMO_SCRIPT.md` |

**No public deployment URL is claimed.** GitHub Pages/Vercel deployments: none found.

## Quick start

```bash
git clone https://github.com/BarujaFe1/Prism.git
cd Prism
git checkout chore/portfolio-quality-pass   # until merged to main
cp .env.example .env.local
npm install
npm run setup
npm run dev
```

Optional read-only demo:

```bash
# in .env.local
PRISM_DEMO_MODE=1
```

## Gates

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run ci
```

## Decisions & trade-offs

- **Explainable score > LLM ranking** — cheaper, offline, testable
- **SQLite local-first > forced cloud** — DX; production needs Turso
- **No auth yet** — do not expose publicly without it
- **Scrapers fail** — isolated per connector

Details: [`docs/TECHNICAL_DECISIONS.md`](docs/TECHNICAL_DECISIONS.md) · [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

## Interview demo (3–5 min)

Follow [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md).

Talk track: problem → Radar score breakdown → pipeline → architecture → limitations.

## Limitations & roadmap

- Auth before any public URL
- Turso (or equivalent) for serverless persistence
- Real screenshots / short screen recording
- Optional worker for long syncs
- Do **not** stretch this into a “data warehouse case” without warehouse evidence

## Docs index

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/SCORING_METHODOLOGY.md`](docs/SCORING_METHODOLOGY.md)
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)
- [`docs/SECURITY_NOTES.md`](docs/SECURITY_NOTES.md)
- [`docs/PORTFOLIO_HANDOFF.md`](docs/PORTFOLIO_HANDOFF.md)
- [`docs/AUDIT_REPORT.md`](docs/AUDIT_REPORT.md)

---

Built by **Felipe Alírio Baruja** · [github.com/BarujaFe1/Prism](https://github.com/BarujaFe1/Prism)
