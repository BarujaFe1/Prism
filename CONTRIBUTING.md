# Contributing to Prism

Thanks for interest. Prism is primarily a **personal local-first portfolio project**. Small, reviewable contributions are welcome.

## Before you start

1. Read `README.md`, `AGENTS.md`, and `docs/demo-mode.md`.
2. Prefer issues labeled for security, demo clarity, tests, or docs.
3. Avoid large rewrites, new infra (Kafka, k8s, GraphQL), or auth unless agreed in an issue.

## Setup

```bash
git clone https://github.com/BarujaFe1/Prism.git
cd Prism
cp .env.example .env.local
npm ci
npm run setup
# or synthetic demo:
DATABASE_URL=file:demo.db npm run db:push
DATABASE_URL=file:demo.db npm run demo:seed
npm run dev
```

Node **≥ 22** required.

## Workflow

1. Branch from `main` (or the active feature branch named in the issue).
2. Keep commits small and conventional: `fix:`, `feat:`, `test:`, `docs:`, `chore:`, `ci:`, `refactor:`.
3. Run gates before opening a PR:

```bash
npm run ci
```

4. Fill the PR template completely.
5. Do not commit `*.db`, `.env*`, tokens, or personal application notes.

## Code notes

- Next.js 16 has breaking changes — consult `node_modules/next/dist/docs/` before changing framework APIs.
- Never build SQL from untrusted string interpolation; use Drizzle + allowlists.
- Never mass-assign request bodies into `db.update().set(...)`.
- Score / fitLabel are computed server-side — not client-editable.

## Security reports

See `SECURITY.md`. Do not open public issues for exploitable vulnerabilities without coordination.
