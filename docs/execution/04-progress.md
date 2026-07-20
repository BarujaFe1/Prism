# 04 — Progress

## 2026-07-20 — pendências resolvidas

### Demo pública
- Vercel project `prism` → https://prism-ruddy-sigma.vercel.app
- `/api/health`: ok, demoMode=true, jobs=25
- PATCH/sync bloqueados com `DEMO_READ_ONLY`
- Build: `demo:prepare` + bundled SQLite (`data/demo.db` → `/tmp`)

### GitHub
- Branch pushed: `feat/employability-transformation`
- PR: https://github.com/BarujaFe1/Prism/pull/1

### E2E / screenshots
- Playwright smoke (4) contra a demo: pass
- Screenshots em `docs/assets/*.png`

### Segurança do token
- Token Vercel usado só via env/CLI; **não commitado**
- **Ação do usuário:** revogar/rotacionar o token exposto no chat

### Como retomar
1. Revisar/mergear PR #1
2. Rotacionar token Vercel
3. Opcional: domínio custom / Turso remoto se quiser DB compartilhado entre lambdas
