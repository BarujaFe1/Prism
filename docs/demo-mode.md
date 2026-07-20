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

Curated personal radar (default on the public Vercel URL):

```bash
# after local personal sync
npm run demo:from-personal   # writes data/demo.db (high/good + top partial)
```

Synthetic fallback (CI / no prism.db):

```bash
PRISM_FORCE_SYNTHETIC_DEMO=1 npm run demo:prepare
```

Demo remains **read-only** when `PRISM_DEMO_MODE=1`.

## Por que não há auth ainda

Prism é local-first / single-user. Auth entra quando houver demo **mutável** ou multi-usuário. Até lá, demo pública = read-only.
