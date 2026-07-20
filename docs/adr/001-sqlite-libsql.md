# ADR 001 — SQLite / libSQL

- **Status:** Aceito
- **Data:** 2026-07-20

## Contexto

Prism é um cockpit pessoal local-first para priorizar oportunidades. Precisa de setup rápido, zero custo operacional no dia a dia e portabilidade.

## Decisão

Usar **SQLite local** via `@libsql/client` + Drizzle, com caminho configurável por `DATABASE_URL`. Para demo hospedada, usar **Turso/libSQL remoto** com o mesmo ORM.

## Alternativas

| Opção | Por que não agora |
|---|---|
| PostgreSQL | Operação e custo sem requisito multi-usuário |
| Só memória | Perde pipeline/analytics entre sessões |
| MongoDB | Modelo relacional/filtros SQL já cabem bem |

## Consequências

- DX excelente para desenvolvimento e entrevistas locais
- Serverless precisa de libSQL remoto (arquivo local não persiste)
- Índices e migrations devem ser tratados com backup
- Migração para Postgres só se houver multi-tenant, escrita concorrente alta ou requisitos de BI externos
