# 04 — Progress

## 2026-07-20 — Career OS Foundation (`feat/felipe-career-os`)

### Problema
Prism ainda era um radar/scoring forte, mas não um Career OS: sem tracks de primeira classe, vault de evidências, heatmap honesto nem página Hoje com WIP.

### Implementação
- Branch a partir de `origin/main` @ `6d9fd24`
- Cursor rules: product / engineering / career / personalization
- Docs: `01-user-model`, `02-product-audit`, `docs/product/*`
- Schema: `career_tracks`, `project_evidences`, settings WIP / dontDoNow
- Scripts: `career:patch-schema`, `career:seed` (+ hook em `demo:prepare`)
- APIs: `/api/tracks`, `/api/evidences`, `/api/coverage`, `/api/today`
- UI: `/today`, `/evidence`, tracks no Perfil, nav atualizada
- Heatmap: `buildCoverageHeatmap` (não marca TypeScript como gap se há evidence)
- Focus: `daily-actions` compartilhado com Radar Top 3

### Testes
- `npm run lint`: OK (warnings pré-existentes)
- `npm run typecheck`: OK
- `npm test`: 31 pass (incl. `career-os-foundation.test.ts`)
- Baseline build: OK (revalidar após commits finais)

### Local setup
```bash
npm run career:patch-schema
npm run career:seed
npm run profile:personal   # opcional
npm run dev
```

### Fora desta fatia
Scoring V2 multittrack, networking CRM, application kit, interview mode, LLM copilot.

### Próximo
Golden dataset mínimo → Scoring V2 explicável por track.

---

## 2026-07-20 — employability (histórico)

### Demo pública
- https://prism-ruddy-sigma.vercel.app · PR #1 merged na main
- Token Vercel: rotacionar se ainda exposto no chat
