# Portfolio Handoff — Prism

**Date:** 2026-07-13  
**Branch:** `chore/portfolio-quality-pass`  
**Recommendation:** **selecionado** (Tier B) — not destaque, not archive.

## Summary

Prism is a local-first **opportunity ranking product**: multi-source ingestion, normalization, dedupe, explainable scoring, decision UI. For Felipe’s portfolio it should be sold as an **analytical full-stack / data-product lab**, not as “job board SaaS” and not as a warehouse/ETL case without warehouse evidence.

## Before / after (this pass)

| Area | Before | After |
|---|---|---|
| Public story | Boilerplate / unclear | Honest README + methodology + demo script |
| Settings PATCH | Mass assignment | Allowlist + demo-mode block |
| Mutations on public demo | Unprotected | `PRISM_DEMO_MODE` blocks PATCH/sync |
| Tests | 8 engine tests | 16 (guards + normalizer + engine) |
| Deploy claim | Easy to overclaim | Explicitly: **no public deploy** |
| Screenshots | Single SVG | Radar/pipeline/analytics SVG placeholders + capture script |

## Commands / gates

```bash
npm run lint        # 0 errors
npm run typecheck   # pass
npm test            # 16/8 suites pass
npm run build       # pass
```

## Deploy evidence

- GitHub deployments API: empty
- GitHub Pages: 404 / not configured
- Vercel: not linked in this session

**Do not claim a live demo URL.**

## Visual evidence

- `public/screenshots/radar.svg`
- `public/screenshots/pipeline.svg`
- `public/screenshots/analytics.svg`
- Capture real PNGs with [`docs/DEMO_SCRIPT.md`](DEMO_SCRIPT.md)

## Limitations remaining

1. No authentication  
2. No Turso/Vercel production wiring  
3. Screenshots still placeholders (SVG)  
4. Scrapers brittle / TOS risk  
5. `main` on GitHub may still be Create-Next-App until PR merge

## Next steps

1. Open/merge PR into `main`  
2. Capture real PNGs from seed data  
3. Only then consider Turso + Vercel **with auth**  
4. Keep Prism as **selecionado**; reserve **destaque** for a stronger data/analytics case with measurable pipelines

## Portfolio integration (no overlap)

- Use Prism for: product sense + ranking systems + full-stack TypeScript + explainable models  
- Do **not** reuse Prism as the primary “data engineering warehouse” card  
- Pair with a separate analytics/SQL/dbt/pipeline project if targeting AE/DE hardcore roles
