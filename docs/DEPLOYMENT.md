# Deployment — Prism

## Local (recomendado para demo)

```bash
cp .env.example .env.local
npm install
npm run setup   # push schema + seed + scores
npm run dev
```

Abra http://localhost:3000

## Build de produção local

```bash
npm run build
npm start
```

## Vercel

Prism é Next.js e pode ir para a Vercel, **mas SQLite em arquivo local não persiste em serverless**.

### Opção A — Demo read-only com Turso

1. Crie um banco em [Turso](https://turso.tech)
2. Configure na Vercel:
   - `DATABASE_URL=libsql://...`
   - `DATABASE_AUTH_TOKEN=...`
3. Rode migrations/seed apontando para o remoto (`drizzle-kit push` / scripts com o mesmo env)
4. Deploy: `vercel` ou GitHub integration

### Opção B — Manter como projeto local-first

Use README + screenshots + vídeo curto. Deixe claro que o valor está no motor de scoring e na arquitetura de conectores.

## Limitações de produção

| Feature | Serverless Vercel | Node long-running |
|---|---|---|
| UI + APIs de leitura | OK | OK |
| Sync de conectores longos | Pode timeout | OK |
| `node-cron` scheduler | Não confiável | OK |
| SQLite file | Não | OK |
| Turso/libSQL | OK | OK |

## Segurança em deploy público

- Não publique sem autenticação
- Nunca commit `.env`, tokens ou `*.db`
- Restrinja CORS/rede se expor APIs
