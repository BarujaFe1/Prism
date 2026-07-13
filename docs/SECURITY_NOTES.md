# Security Notes — Prism

## Achados neste pass

### 1. SQL injection / filtros inseguros em `/api/jobs` (corrigido)

Filtros `status`, `source`, `locationType`, etc. eram montados com interpolação de string em `sql\`...\``.  
Isso quebrava queries (valores sem quotes) e permitia injeção.

**Mitigação:** `inArray` do Drizzle + parsing CSV sanitizado + limite/offset limitados.

### 2. Mass assignment em PATCH (corrigido)

`/api/jobs` e `/api/profile` aplicavam o body inteiro no `update`.

**Mitigação:** whitelist de campos permitidos.

### 3. Banco local

`prism.db` existia no working tree (~14MB) e **não deve ser commitado**.

**Mitigação:** `*.db` no `.gitignore`.

## Sem segredos hardcoded encontrados

Varredura por padrões de API key/token no código-fonte não encontrou credenciais commitadas.

## Modelo de ameaça atual

Prism assume uso **local/pessoal**. Se for exposto na internet sem auth:

- Qualquer um pode ler/alterar perfil e status de vagas
- Endpoints de sync podem ser abusados (carga/scraping)

**Recomendação:** auth + rate limit antes de qualquer URL pública.
