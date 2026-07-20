# Deployment — Prism

## Demo pública (somente leitura)

- **URL:** https://prism-ruddy-sigma.vercel.app  
- **Health:** https://prism-ruddy-sigma.vercel.app/api/health  
- Env: `PRISM_DEMO_MODE=1`  
- Banco: SQLite sintético gerado no build (`npm run demo:prepare`) e copiado para `/tmp` em runtime (sem Turso obrigatório para esta demo)

Mutations retornam `403` / `DEMO_READ_ONLY`.

## Local (recomendado)

```bash
cp .env.example .env.local
npm ci
npm run setup          # schema push + seed legado + scores
# ou dataset sintético de demo:
DATABASE_URL=file:demo.db npm run db:push
DATABASE_URL=file:demo.db npm run demo:seed
PRISM_DEMO_MODE=1 DATABASE_URL=file:demo.db npm run dev
```

Abra http://localhost:3000

## Build de produção local

```bash
DATABASE_URL=file:demo.db npm run build
DATABASE_URL=file:demo.db PRISM_DEMO_MODE=1 npm start
```

## Demo pública somente leitura (estratégia)

**Recomendação:** Vercel + Turso/libSQL.

1. Criar banco Turso e obter `DATABASE_URL` + `DATABASE_AUTH_TOKEN`.
2. Aplicar schema (`drizzle-kit push` com as mesmas vars).
3. Rodar `npm run demo:seed` apontando para o remoto (`PRISM_ALLOW_DEMO_SEED=1` se a URL não contiver `demo`).
4. Na Vercel definir:
   - `DATABASE_URL`
   - `DATABASE_AUTH_TOKEN`
   - `PRISM_DEMO_MODE=1`
5. Deploy via integração GitHub ou CLI.
6. Smoke: abrir Radar, job detail, Pipeline, Analytics; tentar PATCH e confirmar `403 DEMO_READ_ONLY`.

### Checklist de deploy demo

- [ ] Mutações bloqueadas (`PRISM_DEMO_MODE=1`)
- [ ] Dataset sintético (sem dados pessoais)
- [ ] Sync/connectors/score/scheduler retornam 403
- [ ] Banner “Demo somente leitura” na UI (Fase 6)
- [ ] Health básico / versão documentada
- [ ] Sem `node-cron` como dependência do request path em serverless

## Limitações

| Feature | Serverless Vercel | Node long-running |
|---|---|---|
| UI + APIs de leitura | OK | OK |
| Sync longo de conectores | Pode timeout | OK |
| `node-cron` | Não confiável | OK (só local) |
| SQLite file | Não persiste | OK |
| Turso/libSQL | OK | OK |

## Segurança

- Demo pública = **somente leitura** até existir autenticação.
- Nunca commitar `.env`, tokens ou `*.db`.
- Backup antes de migration: `mkdir -p backups && cp prism.db backups/prism-$(date +%Y%m%d-%H%M%S).db` (Git Bash) ou cópia manual no Explorer.

## Restauração

```bash
# exemplo
cp backups/prism-YYYYMMDD-HHMMSS.db prism.db
```

Ver também: [`docs/demo-mode.md`](./demo-mode.md), [`docs/adr/001-sqlite-libsql.md`](./adr/001-sqlite-libsql.md).
