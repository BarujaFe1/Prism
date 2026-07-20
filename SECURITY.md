# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| `main` / latest tagged release | Yes (best effort) |
| Older commits | No guarantee |

## Threat model (honest)

Prism is **local-first / single-user** by default. There is **no multi-user authentication** yet.

If you expose a deployment publicly:

- Without `PRISM_DEMO_MODE=1`, anyone who can reach the API can mutate data and trigger sync jobs.
- Demo mode blocks mutations and expensive operations; it is required for any public URL until auth exists.

## Reporting a vulnerability

Email or message the maintainer via GitHub: [BarujaFe1](https://github.com/BarujaFe1).

Please include:

- Affected branch/commit
- Reproduction steps
- Impact (data disclosure, RCE, abuse of connectors, etc.)
- Whether a fix PR is offered

Do **not** include real personal job data or production secrets in the report attachments.

## Safe practices for contributors

- Never commit `.env`, tokens, cookies, or `*.db`
- Prefer synthetic demo data (`npm run demo:seed`)
- Validate inputs at API boundaries
- Keep connector scraping polite and within source terms (`docs/CONNECTORS.md`)
