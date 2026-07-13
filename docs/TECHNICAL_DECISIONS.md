# Technical Decisions — Prism

## 1. Next.js App Router + Route Handlers

**Decisão:** Um único app full-stack em vez de frontend + API separados.  
**Por quê:** Menos overhead operacional para um produto pessoal; tipagem compartilhada; deploy simples.  
**Trade-off:** API routes e UI no mesmo processo; serverless limita jobs longos/cron.

## 2. SQLite / libSQL (Drizzle)

**Decisão:** Banco embutido com caminho para Turso.  
**Por quê:** Zero infra local, schema tipado, bom para demos e portfólio.  
**Trade-off:** Deploy Vercel precisa de Turso (ou equivalente); arquivo `prism.db` nunca deve ir para o Git.

## 3. Scoring determinístico (sem LLM)

**Decisão:** Motor de score por regras/pesos em `src/engine/scorer.ts`.  
**Por quê:** Explicável, barato, offline, fácil de testar.  
**Trade-off:** Menos “inteligência semântica” que um modelo; false positives/negatives possíveis.

## 4. Cover letter por template

**Decisão:** `/api/freelance/generate-cover-letter` usa templates, não LLM.  
**Por quê:** Evita custo/chave de API e mantém o projeto self-contained.  
**Trade-off:** Qualidade limitada; roadmap pode plugar AI Gateway depois.

## 5. Conectores com falha isolada

**Decisão:** Sync continua mesmo se uma fonte quebrar.  
**Por quê:** Fontes públicas/RSS mudam frequentemente.  
**Trade-off:** Dados parciais; UI precisa mostrar erros por fonte.

## 6. Sem autenticação

**Decisão:** Perfil único `default`, APIs sem auth.  
**Por quê:** Ferramenta pessoal.  
**Trade-off:** Não expor publicamente sem auth/proxy; documentado em deployment.

## 7. ESLint pragmático

**Decisão:** `no-explicit-any` como warning; scripts ignorados.  
**Por quê:** Scrapers lidam com payloads heterogêneos; CI precisa ser estável.  
**Trade-off:** Dívida de tipagem nos conectores permanece visível como warning.
