# Scoring methodology — Prism

Prism ranks opportunities with a **deterministic, explainable score** (0–1). There is no LLM in the scoring path. That is intentional: the model must be debuggable in interviews and offline.

## Feature groups and weights

| Signal | Weight | What it measures |
|---|---|---|
| Skills overlap | 0.35 | Exact + related tech match vs profile skills |
| Role / area fit | 0.20 | Desired roles vs title/description categories |
| Experience level | 0.15 | Junior/mid/senior alignment |
| Location mode | 0.10 | remote / hybrid / onsite preference |
| Salary band | 0.08 | Overlap with desired compensation |
| Contract type | 0.07 | CLT / PJ / internship / international |
| Recency | 0.05 | Prefer fresher postings |

Source of truth: `src/engine/scorer.ts`.

## Hard penalties

- Negative keywords from the profile multiply the score down
- Clearly non-dev titles (sales, design-only, etc.) are heavily penalized
- Senior titles for entry-level profiles are discounted
- Internship titles are discounted unless the profile wants them

## Fit labels

Computed downstream from the numeric score (UI thresholds around high ≥ 0.75). Labels are presentation, not a second model.

## Red flags (orthogonal to score)

`src/engine/red-flags.ts` emits critical/warning/info signals such as:

- inflated titles (“rockstar”, “ninja”)
- remote posting that requires onsite presence
- PJ with CLT-like time control
- junior roles asking for huge stacks

Red flags do **not** replace the score; they annotate risk.

## How to discuss this in interviews

1. Frame Prism as a **personal ranking system / data product**, not a job board.
2. Walk through ingestion → normalize → dedupe → score → decision UI.
3. Call out trade-offs: explainability over black-box ML; local SQLite over managed warehouse.
4. Mention validation via unit tests on scorer/dedupe/guards (`npm test`).
