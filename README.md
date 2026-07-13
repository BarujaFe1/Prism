# Prism — Radar de Oportunidades

**Tagline:** Agregue vagas e freelas, calcule fit com o seu perfil e priorize o que realmente vale a pena candidatar.

![Screenshot placeholder — Radar](public/screenshots/radar.svg)

---

## O problema real

Buscar emprego (ou freela) hoje é ruído: dezenas de sites, vagas duplicadas, senioridade confusa, salário omitido e zero priorização. Planilhas e bookmarks não escalam quando você precisa decidir **onde investir energia hoje**.

## A solução

Prism é um **sistema pessoal de inteligência de oportunidades**:

1. Coleta vagas de 20+ fontes e freelas de plataformas públicas
2. Normaliza, deduplica e detecta red flags
3. Calcula um **score de fit** contra o seu perfil (skills, senioridade, localização, salário, contrato)
4. Mostra um **Radar** com briefing diário, alto fit e pipeline de candidaturas

Não é um job board. É um cockpit de decisão.

---

## Principais funcionalidades

- **Radar** com métricas, filtros e daily briefing
- **Explore** com busca e filtros avançados (área, stack, modalidade, recência)
- **Pipeline Kanban** (salva → prioridade → aplicada → entrevista → oferta)
- **Analytics** de demanda de skills vs perfil
- **Fontes** com sync sob demanda e histórico de conectores
- **Perfil** editável (skills, papéis desejados, keywords negativas)
- **Módulo Freelas** (sync, pipeline, analytics, cover letter por template, rate benchmark)
- **Motor de scoring + red flags** explicável e testável

---

## Arquitetura

```
Connectors → Engine (normalize / dedupe / score / red-flags) → SQLite/libSQL
                                                              ↓
UI (Radar, Pipeline, Analytics, Freelas) ← API Routes ← React Query
```

Detalhes: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

---

## Stack

| Camada | Tecnologia |
|---|---|
| App | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, Lucide, Recharts, Framer Motion |
| Data | Drizzle ORM + SQLite/libSQL (`@libsql/client`) |
| Client state | TanStack Query + Zustand |
| Qualidade | ESLint, `tsc`, Node test runner, GitHub Actions |

---

## Demo local

```bash
git clone https://github.com/BarujaFe1/Prism.git
cd Prism
cp .env.example .env.local
npm install
npm run setup    # schema + seed demo + scores
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Comandos úteis

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run ci
npm run db:studio
```

---

## Variáveis de ambiente

Veja [`.env.example`](.env.example):

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Default `file:prism.db` ou URL Turso |
| `DATABASE_AUTH_TOKEN` | Token Turso (remoto) |
| `PRISM_DEMO_MODE` | Opcional |

---

## Testes

```bash
npm test
```

Cobertura atual: scoring, red flags, dedupe e utils.  
Guia: [`docs/TESTING.md`](docs/TESTING.md)

---

## Decisões técnicas e trade-offs

- **Score determinístico** em vez de LLM → explicável, offline, barato
- **SQLite local** → DX excelente; produção precisa Turso
- **Sem auth** → ok para ferramenta pessoal; não exponha publicamente sem proteção
- **Conectores resilientes** → uma fonte quebra, as outras seguem

Mais: [`docs/TECHNICAL_DECISIONS.md`](docs/TECHNICAL_DECISIONS.md) · [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) · [`docs/SECURITY_NOTES.md`](docs/SECURITY_NOTES.md)

---

## Roadmap

- [ ] Screenshots oficiais no README
- [ ] Auth opcional para demo pública
- [ ] Worker/cron dedicado para sync
- [ ] Cover letter via AI Gateway (opcional)
- [ ] Export CSV/backup one-click
- [ ] Métricas de conversão (aplicada → entrevista)

## Status atual

**Usável localmente.** Build e typecheck passam. CI configurada. Seed demo disponível. Deploy público serverless exige Turso (e idealmente auth).

---

## O que este projeto demonstra

- Product thinking: reduzir ruído de job search a um radar acionável
- Full-stack TypeScript moderno (Next.js App Router + ORM tipado)
- Domain modeling: scoring, dedupe, red flags, pipeline
- Integração com APIs/feeds heterogêneos e falhas parciais
- DX e higiene de portfólio: docs, CI, testes, `.env.example`, segurança básica

## Como eu apresentaria em entrevista

1. **Problema (30s):** “Candidatar sem priorização é desperdício.”
2. **Demo (2min):** Radar → alto fit → detalhe → pipeline → analytics de skills.
3. **Arquitetura (2min):** conectores → engine → SQLite → UI; por que score sem LLM.
4. **Trade-offs (1min):** local-first vs serverless; scraping frágil; auth ausente de propósito.
5. **Evolução (30s):** Turso + auth + worker para sync confiável.

---

Feito por **Felipe Alirio Baruja** · repositório: [BarujaFe1/Prism](https://github.com/BarujaFe1/Prism)
