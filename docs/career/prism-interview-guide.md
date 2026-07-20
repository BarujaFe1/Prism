# Guia de entrevista — Prism

Respostas curtas, fiéis ao repositório. Não invente métricas de usuários/receita.

## O que é o Prism?

Um cockpit **local-first** para agregar oportunidades, normalizar/deduplicar, pontuar com regras explicáveis e organizar Radar → Pipeline → Analytics. É um MVP pessoal, não um SaaS.

## Qual problema resolve?

O custo cognitivo de pesquisar e priorizar vagas fragmentadas — ruído, duplicatas, falta de ranking alinhado ao perfil de entrada.

## Qual foi sua contribuição?

Desenho e implementação full-stack: conectores, schema Drizzle/SQLite, motor de score, UI Next.js, hardenings de API, demo mode, seed sintético, CI/testes e documentação honesta.

## Maior desafio técnico?

Reconciliar a branch de qualidade (segurança/docs) com a `main` que tinha o scoring v0.3.0 — sem merge cego — e corrigir SQL/mass assignment mantendo eventos de pipeline.

## Decisão mais difícil?

Não usar LLM para ranking. Escolhi regras testáveis. Também adiei auth/Postgres para não overengineerar um single-user.

## Como funciona o score?

Classifica domínio → aplica hard gates (ex.: sales/design, senioridade incompatível) → combina pesos (skills, local, salário, recência) → gera fitLabel/explicação. Código: `src/engine/scorer.ts`.

## Por que não usar LLM?

Custo, necessidade de rede, dificuldade de teste e risco de claims vazios. LLM só faria sentido depois de baseline medido e com fallback determinístico.

## Por que SQLite?

Local-first, zero ops, suficiente para um usuário. Demo hospedada usaria Turso/libSQL. Postgres quando houver multi-usuário/concorrência real (ADR 001).

## Como escalar?

1) libSQL remoto 2) worker/scheduler fora do serverless 3) auth se multi-user 4) índices já iniciados 5) blocking na dedupe antes de similaridade O(n²).

## Como garantir segurança?

Allowlists, `inArray`, demo read-only no servidor, sem secrets no git, sem dados pessoais na demo. Modelo de ameaça documentado em `SECURITY.md`.

## Como testar conectores?

Fixtures/HTML-JSON versionados; suíte comum **sem** rede; falha isolada por fonte. Rede real só em scripts manuais/respetando termos.

## O que faria diferente?

Demo pública read-only mais cedo; `scoreVersion` + métricas de golden set; Playwright+axe; menos conectores até a qualidade do ranking estar medida.

## O que não está pronto?

Auth, URL pública, screenshots PNG versionados, E2E a11y, sync comprovado das ~559 empresas do CSV, observabilidade rica.

## Como mudaria em equipe?

Issues/PRs (já há templates), ownership por área (ingest / scoring / UI), ADRs para decisões, CI obrigatório na `main`, feature flags para demo vs local mutável.
