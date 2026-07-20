# 05 — Final report (parcial — 2026-07-20)

## Resumo executivo

| | |
|---|---|
| **Inicial** | `main` v0.3.0 com produto rico, mas SQL inseguro, mass assignment, sem CI/testes/demo mode |
| **Atual** | Branch `feat/employability-transformation` com segurança, demo seed, CI, README factual, case study e assets de carreira |
| **Empregabilidade** | Recrutador consegue entender o case em &lt;5 min via README; demo local read-only documentada |

## Maiores melhorias

1. Hardenings de API + demo read-only  
2. Dataset sintético + índices  
3. CI + templates + 25 testes  
4. README sem claims falsos  
5. Case study + currículo/LinkedIn/guia de entrevista  

## Riscos removidos

SQL IN inseguro, mass assignment amplo, mutações em demo, Node 18 documentado incorretamente, falta de inventário executável.

## Pendências

| Item | Por quê | Próxima ação |
|---|---|---|
| Demo URL pública | Precisa Turso/Vercel do usuário | Provisionar + `PRISM_DEMO_MODE=1` |
| Playwright + axe | Tempo | Fase 6/4 restante |
| Screenshots PNG | Precisa app rodando + script | `npm run screenshots` futuro |
| Merge na `main` | PR ainda não aberto | `gh pr create` quando pedir |
| Market evidence ≥30 | Amostra web parcial | Expandir manualmente |

## Decisões descartadas

- Postgres agora — sem multi-user  
- Auth complexa — demo read-only basta  
- LLM ranking — após baseline  

## Como demonstrar (5 min)

1. README quick view  
2. `demo:seed` + `PRISM_DEMO_MODE=1` → banner  
3. Radar → score → pipeline → analytics  
4. Mostrar teste de scoring + CI  
5. Admitir limites (sem URL pública ainda)

## Commits nesta branch

```
a46c7f0 docs: rewrite README with verifiable claims and demo banner
0af8d62 ci: enforce quality gates and community templates
53d7051 feat(platform): add reproducible database and demo configuration
5224548 fix(security): harden API inputs and database mutations
```
(+ commits de case/career nesta continuação)

## 30/60/90 dias

- 30: PR na main, demo hospedada, prints, 12–18 candidaturas/sem  
- 60: E2E+a11y, golden metrics, posts técnicos  
- 90: iterar scoring com feedback real de entrevistas  
