# 02 — Prioritized backlog

Fórmula: impacto × demanda × visibilidade ÷ esforço (1–5). Segurança crítica sobrescreve.

## P0 (agora)

1. Preservar working tree limpo — feito
2. Branch `feat/employability-transformation` a partir de main — feito
3. Corrigir SQL inseguro em `/api/jobs`
4. Corrigir mass assignment em mutações
5. Demo mode bloqueando mutações/sync/score/scheduler
6. Padronizar erros de API
7. `.env.example` + `.gitignore` seguro
8. Scripts `typecheck` / `test` / `ci` + testes de regressão

## P1 (em seguida)

9. CI na branch de trabalho (e depois main via PR)
10. Node engines + .nvmrc
11. DATABASE_URL centralizado / mensagens claras
12. Dataset demo sintético + `demo:seed`
13. README factual
14. Portar docs úteis da quality-pass sem claims falsos

## P2+

15. Decomposição UI / redução de `any`
16. Golden dataset + E2E
17. Observabilidade / health
18. Case study + ativos de carreira
19. Deploy read-only (requer decisão de provedor)

Itens descartados por ora: microservices, Kafka, GraphQL, auth complexa, PostgreSQL sem requisito, LLM antes do baseline.
