# Changelog

All notable changes to **Prism** will be documented in this file.

## [Unreleased] — employability transformation branch

### Security
- Hardened API inputs: allowlisted PATCH fields, Drizzle `inArray` filters, demo read-only mode (`PRISM_DEMO_MODE`).
- Standardized API error shape `{ error: { code, message } }` on critical routes.

### Platform
- `demo:seed` / `demo:reset` with synthetic deterministic jobs (`file:demo.db`).
- Job table indexes (status, score, posted_at, source, hash, unique source+source_id).
- `engines.node` ≥ 22, `.nvmrc`, CI workflow, Dependabot, issue/PR templates.
- Docs: deployment, demo-mode, SQLite/demo ADRs, CONTRIBUTING, SECURITY.

### Tests
- Regression tests for api-guards, scoring gates, normalizer, red flags, dedupe.

## [0.3.0] - 2026-06-11

### Fixed
- **Analytics Client Hooks:** Fixed React hook rule violations by relocating `useMemo`/`useState` hooks to the absolute top of `src/app/analytics/analytics-client.tsx`, preventing runtime errors like `Rendered more hooks than during the previous render`.
- **Profile Placeholders:** Replaced mock placeholders (e.g. `github.com/seu-usuario`) on job detail pages with actual links and contact details fetched from Felipe's active profile in `src/app/jobs/[id]/job-detail-client.tsx`.
- **Status Renaming:** Mapped internal status enums such as `testing` to `"Teste Técnico"` and `reviewing` to `"Em análise"` uniformly in `src/lib/utils.ts` to improve UI translation quality.

### Added
- **Local Error Boundary:** Created a robust error handler in `src/app/analytics/error.tsx` to handle failures gracefully.
- **SLA de Habilidades & Heatmap:** Built a visually rich SLA analysis matrix card inside `src/app/profile/profile-client.tsx` grouping skills into Forte (Green), Pendente (Yellow), Gap Crítico (Red), and Sem Evidência (Gray) based on portfolio coverage, query parameters, and job requirements.
- **Query Param `?preselect` Support:** Added support for `?preselect=Skill` in the Profile view to automatically fill out and focus on specific skills in the Evidence Matrix or Learning Backlog forms.

### Improved
- **Scoring Engine Kill Switches:** Expanded `src/lib/scoring/scoring-rules.ts` and `src/engine/scorer.ts` to filter out Sales, Executive, Senior, Staff, PhD, and wrong-track jobs when Felipe's profile is Entry/Junior.
- **Compensation & Outlier Parsing:** Refactored salary and hourly rate parsing in `src/lib/freelance/utils.ts` and `src/engine/scorer.ts` to identify and convert annual budgets parsed as hourly, check outliers, and tag rates > $250/hr for manual audit.
- **Radar Top 3 Cards:** Upgraded Radar actions on the dashboard (`src/app/page.tsx`) to show skill-specific evidence status ("SQL sem evidência — associe DataFlow", "Python comprovado por DataFlow e Prism") and direct links to update profile matrices.
