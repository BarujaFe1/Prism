# Changelog

## 2026-07-13 — Portfolio hardening pass

### Fixed
- Mass assignment on `PATCH /api/settings` (field allowlist)
- Demo/public risk: mutations + connector/freelance sync blocked when `PRISM_DEMO_MODE=1`
- Settings empty-state response now includes `demoMode`

### Added
- `src/lib/api-guards.ts` (CSV parsing, clamp, sanitize, demo mode)
- Regression tests for API guards and normalizer
- `docs/SCORING_METHODOLOGY.md`
- `docs/DEMO_SCRIPT.md` (3–5 min interview demo)
- `docs/PORTFOLIO_HANDOFF.md`
- Screenshot placeholders for pipeline/analytics
- Read-only demo banner in `Shell`

### Changed
- README rewritten with honest status, audience, and portfolio role (**selecionado**)
- Jobs/profile/connectors/freelance sync routes use shared guards

### Security
- See `docs/SECURITY_NOTES.md` (prior SQL injection / job patch issues already fixed)
