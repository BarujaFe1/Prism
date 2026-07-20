# 00 — Current state (Career OS foundation)

**Date:** 2026-07-20  
**Branch:** `feat/felipe-career-os` (from `origin/main` @ `6d9fd24`)  
**Prior mission:** employability transformation merged via PR #1

## Environment

| Item | Value |
|---|---|
| Node | v24.16.0 (engines ≥22; CI Node 22) |
| npm | 11.13.0 |
| App | 0.3.0 · Next 16.2.6 · React 19.2.4 |
| Remote | https://github.com/BarujaFe1/Prism.git |

## Baseline (this branch tip)

| Command | Result |
|---|---|
| `npm ci` | OK |
| `npm run lint` | OK (0 errors, warnings present) |
| `npm run typecheck` | OK |
| `npm test` | OK — 25 pass |
| `npm run build` | OK |
| `npm run test:e2e` | OK — 4 skipped (hosted demo URL / env not required for local smoke) |

## Product surface (pre–Career OS foundation)

- Routes: Radar `/`, Explore, Freelas*, Pipeline, Analytics, Sources, Profile, Settings
- Missing Career OS routes: `/today`, `/evidence`, `/network`, tracks UI
- Profile JSON: `skillsEvidence`, `learningBacklog`, `applicationPlans`
- Scoring + hard gates live; Top 3 embedded on Radar
- Public demo: https://prism-ruddy-sigma.vercel.app (read-only; owner URL may include personal profile by request)

## Working tree policy

Preserve local DB (`prism.db`). No hard reset / clean -fd / force push / destructive wipe without explicit consent.
