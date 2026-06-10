# Conectores de Vagas e Plataformas ATS

O Prism implementa conectores especializados para extrair vagas diretamente de portais de carreiras oficiais, evitando intermediários ou feeds desatualizados.

## Plataformas ATS Suportadas (P0/P1)

### 1. Greenhouse
* **Identificador de URL**: `boards.greenhouse.io` ou `job-boards.greenhouse.io`.
* **API Ingestão**: Consome o endpoint JSON `https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true`.
* **Vantagens**: Retorna a descrição limpa estruturada e datas de atualização precisas.

### 2. Lever
* **Identificador de URL**: `jobs.lever.co`.
* **API Ingestão**: Consome o endpoint JSON `https://api.lever.co/v0/postings/{slug}?mode=json`.
* **Vantagens**: Extremamente estável, payload leve e confiável.

### 3. Ashby
* **Identificador de URL**: `jobs.ashbyhq.com`.
* **API Ingestão**: Consome o endpoint JSON `https://jobs.ashbyhq.com/{slug}/api/job-board`.
* **Vantagens**: Muito utilizado por startups modernas nacionais e internacionais.

### 4. Gupy
* **Identificador de URL**: `{slug}.gupy.io`.
* **Ingestão**:
  * Carrega a página HTML do portal de carreiras da empresa.
  * Extrai a lista de vagas embutida no bloco de dados do Next.js: `<script id="__NEXT_DATA__">`.
  * Filtra preventivamente vagas de tecnologia e dados para evitar requisições desnecessárias.
  * Visita a página de detalhes de cada vaga selecionada com intervalo de **600ms** (delay polido) para obter descrição completa e pré-requisitos sem acionar proteções.

## Fallback JobPosting (Custom Data Extraction)
* Para empresas que utilizam portais customizados que expõem structured data JobPosting (conforme padrões do Schema.org/Google Jobs).
* O Prism faz a leitura do HTML da página, localiza tags `<script type="application/ld+json">`, faz o parsing dos objetos JobPosting ou grafos aninhados e extrai o título, descrição, localização, modalidade e URL de aplicação.

## Tratamento de Erros e Logs
* Cada falha de conexão (Timeout, 404, Bloqueio) é capturada e salva no campo `lastError` da empresa monitorada correspondente.
* O status da empresa é atualizado para `error` para sinalizar a Felipe que a URL ou o ATS da empresa precisa ser revisado.
