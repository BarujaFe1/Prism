# Career verticals & tracks

Prism trata **duas vertentes com esforço igual**, bem separadas:

| Vertente | Foco | Track principal |
|---|---|---|
| **Dev** | Full-Stack, Frontend, Backend, Product Engineer | `fullstack_product` |
| **Dados** | Analista de Dados, BI, Estatística USP, data products | `data_analytics` |

Sub-tracks (Frontend, Backend, AI, Mobile) reforçam uma vertente; não competem com ela.

| Key | Label | Default |
|---|---|---|
| fullstack_product | Dev · Full-Stack | Ativo · prioridade 1 · weight 1 |
| data_analytics | Dados · Analista / USP | Ativo · prioridade 1 · weight 1 |
| frontend | Dev · sub Front-End | Ativo · 3 |
| backend | Dev · sub Back-End | Ativo · 3 |
| ai_automation | Dados · sub AI | Off |
| mobile | Dev · sub Mobile | Off |

Scoring: domínios Dev e Dados recebem `domainScore = 1.0`. Today diversifica Top N entre as duas vertentes.

API: `GET/PATCH /api/tracks`. UI: Perfil → vertentes. Seed: `npm run career:seed`.
