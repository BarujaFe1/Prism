# ADR 002 — Demo read-only sem autenticação

- **Status:** Aceito
- **Data:** 2026-07-20

## Contexto

Expor o Prism publicamente sem auth permitiria mutar perfil, pipeline e disparar scrapers.

## Decisão

`PRISM_DEMO_MODE` bloqueia mutações e jobs caros no servidor (não apenas na UI). Dataset de demo é sintético.

## Alternativas

- Auth completa agora — alto esforço, sem multi-usuário real
- Só esconder botões — inseguro

## Consequências

- Demo segura para recrutadores
- Sem edição na URL pública até existir auth
