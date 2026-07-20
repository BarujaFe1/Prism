# Evidence system

Tabela `project_evidences` + dual-write em `profile.skillsEvidence`.

Heatmap (`buildCoverageHeatmap` / `GET /api/coverage`):

- **strong** — link + métrica + bullet + confiança alta
- **partial / pending** — evidência incompleta
- **unregistered_evidence** — skill no perfil sem vault
- **real_gap** — demanda em vagas sem skill/evidência
- **in_learning** — backlog ativo

UI: `/evidence` com botão “Recalcular cobertura a partir das evidências”.

Métricas de demo devem usar `metricKind=demo` (não confundir com produção).
