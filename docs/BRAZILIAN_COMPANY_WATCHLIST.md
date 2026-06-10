# Brazilian Company Watchlist (Cobertura Brasil)

Este documento descreve como a camada de empresas brasileiras monitoradas funciona no Prism, facilitando a Felipe a busca por oportunidades nacionais extremamente qualificadas.

## Objetivo
O objetivo da watchlist é sair de uma busca genérica de vagas e focar nas principais empresas brasileiras (fintechs, scale-ups, multinacionais no país, startups), monitorando seus portais oficiais diretamente em busca de posições ligadas a dados, analytics, engenharia, estatística e automação analítica.

## Formato JSON e CSV
O arquivo de origem está em `empresas/prism_empresas_brasileiras_watchlist.json`. Ele contém a lista de empresas com o seguinte formato de campos:

* `company`: Nome fantasia da empresa.
* `sector`: Setor de atuação (fintech, varejo, software, logística, etc.).
* `priority`: Prioridade de monitoramento (P0, P1, P2).
* `country_focus`: Foco do país da operação (ex: Brasil).
* `target_roles`: Escopo de cargos alvo.
* `why_monitor`: Justificativa estratégica.
* `search_query_pt`: Queries de buscas em português.
* `search_query_en`: Queries de buscas em inglês.
* `ats_hint`: Dica de plataforma (Gupy, Greenhouse, Lever, Ashby, etc.).

## Tabela do Banco de Dados
A tabela `monitored_companies` armazena essas empresas no banco SQLite local (`prism.db`):
* `id`
* `name`
* `normalized_name`
* `sector`
* `priority` (P0 / P1 / P2)
* `careerUrl`
* `detectedAts`
* `status` (active, error, never_synced)
* `lastSyncAttemptAt`
* `lastSuccessfulSyncAt`
* `lastError`
* `totalJobsFound`
* `totalRelevantJobs`
* `usefulnessRate`
* `isActive`

## Frequência e Regras de Sincronização (Sync)
As empresas são visitadas sequencialmente com respeito de rate-limiting (polite delays) para evitar bloqueios.
* **P0**: Sincronização diária (vagas muito quentes, empresas principais).
* **P1**: Sincronização a cada 2 dias (48h).
* **P2**: Sincronização semanal.

## Deduplicação Multifonte
O Prism deduplica vagas idênticas vindas do portal oficial, do feed RSS ou de agregadores (como LinkedIn ou Revelo), centralizando tudo em um único registro no banco de dados e salvando links alternativos na tabela `job_sources`. A aplicação prioriza a candidatura pelo portal ATS oficial da empresa.

## Comandos Úteis
* Importação: `npm run companies:import`
* Detecção de ATS: `npm run companies:detect`
* Sincronização P0: `npm run companies:sync:p0`
* Sincronizar Tudo: `npm run companies:sync:all`
