# Demo script (3–5 minutes)

Use a local seed database. Prefer `PRISM_DEMO_MODE=1` if showing a shared machine.

## Setup (once)

```bash
cp .env.example .env.local
npm install
npm run setup
npm run dev
```

Open http://localhost:3000

## Minute-by-minute

### 0:00–0:40 — Problem

“Searching for roles across many sources creates noise: duplicates, opaque fit, no prioritization.”

### 0:40–1:40 — Radar

- Show home metrics (total / 48h / high-fit / applied)
- Open daily briefing if present
- Click one high-fit card → job detail → score breakdown

**Talk track:** deterministic scoring, not vibes.

### 1:40–2:40 — Pipeline + methodology

- `/pipeline` Kanban stages
- Mention `docs/SCORING_METHODOLOGY.md` weights
- Optional: `/analytics` skill demand vs profile

**Talk track:** decision ops + lightweight analytics.

### 2:40–3:40 — Architecture

- Connectors (ingestion) → normalizer/dedupe → scorer → SQLite
- Show `/sources` as operational monitoring of upstream feeds
- Mention tests + CI gates

### 3:40–4:30 — Trade-offs / honesty

- Local-first (no public auth yet)
- No live Vercel deploy without Turso + auth
- Scrapers can fail; errors are isolated

### 4:30–5:00 — Close

“This is a portfolio lab for analytical full-stack / data product thinking: ingestion, ranking, explainability, and a usable decision UI.”

## Capture checklist

1. Radar (`/`) — desktop
2. Job detail with score bars
3. Pipeline (`/pipeline`)
4. Analytics (`/analytics`)
5. Optional mobile width of Radar
