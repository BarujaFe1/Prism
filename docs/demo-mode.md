# Demo mode

Ative com:

```bash
PRISM_DEMO_MODE=1
# ou
PRISM_DEMO_MODE=true
```

## O que é bloqueado (HTTP 403, código `DEMO_READ_ONLY`)

- PATCH em jobs, profile, settings, freelance projects, tasks, follow-ups
- POST connectors sync
- POST freelance sync / scheduler start|stop
- POST rescore (`/api/score`)
- POST generate-cover-letter

## O que permanece permitido

- GET de páginas e APIs de leitura
- Case export de leitura (não altera banco)

## Dataset

```bash
DATABASE_URL=file:demo.db npm run demo:seed
DATABASE_URL=file:demo.db CONFIRM=1 npm run demo:reset
```

O seed é **sintético e determinístico** (IDs `demo-job-*`). Não usa candidaturas reais.

## Por que não há auth ainda

Prism é local-first / single-user. Auth entra quando houver demo **mutável** ou multi-usuário. Até lá, demo pública = read-only.
