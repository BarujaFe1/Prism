# Motor de Scoring e Relevância

Este documento detalha o sistema de pontuação e priorização de vagas do Prism, adaptado especificamente para o perfil analítico de Felipe Alirio Baruja.

## Habilidades do Perfil
O perfil do Felipe é focado nas seguintes competências principais:
* **Linguagens**: Python, SQL, TypeScript/JavaScript.
* **Ferramentas e Frameworks**: Pandas, dbt, Airflow, Power BI, Tableau, Looker, Metabase, Spark, FastAPI, React/Next.js.
* **Tópicos e Metodologias**: Analytics Engineering, ETL/ELT, Data Quality, Estatística aplicada, Modelagem de dados, Experimentação (Testes A/B), IA aplicada e Desenvolvimento Full-Stack orientado a dados.

## Regras de Classificação e Gates (Domain Classifier)
Toda vaga passa por uma triagem pelo título e descrição para identificar o domínio funcional.

### 1. Hard Gates (Filtro Restritivo)
Qualquer vaga classificada nos domínios abaixo recebe pontuação máxima de **30% (Fora do Foco)** e é suprimida do Radar:
* **Design / UX/UI**: Vagas para Designer, Figma, Motion, Creative, etc.
* **Legal / Compliance**: Vagas para Advogado, Compliance, DPO, LGPD, etc.
* **Vendas / Marketing**: Vagas para Sales, Copywriter, Growth, Comercial, etc.
* **Finanças / Ops**: Vagas de tesouraria ou faturamento genérico (salvo se contiver termos explícitos como SQL, BI, ou dados).
* **Suporte / Admin**: Vagas de suporte, assistente virtual, atendimento, SAC.

### 2. Outras Penalidades de Gate
* **Senioridade Incompatível**: Penaliza em 55% se o cargo for Sênior, Staff, Principal, Architect ou Liderança (Felipe busca vagas de Estágio, Júnior ou Pleno).
* **Presencial Longe**: Penaliza se a vaga for presencial (onsite) e fora de São Carlos/SP.
* **Tecnologias Fora de Interesse**: Capa em 35% se contiver termos como SAP, Cobol, VBA, Delphi, ou Mainframe.

## Bônus por Empresa Monitorada e Confiabilidade
* **Empresa Monitorada P0**: Recebe bônus de **+0.12**.
* **Empresa Monitorada P1**: Recebe bônus de **+0.08**.
* **Empresa Monitorada P2**: Recebe bônus de **+0.04**.
* **Fonte Oficial (ATS / Portal próprio)**: Recebe bônus de **+0.03**.

## Exemplos
* **Excelente Fit (>=85%)**:
  * *Exemplo*: "Estágio em Engenharia de Dados — fintech brasileira — Python, SQL, pipelines — híbrido/remoto — P0"
* **Baixo Fit / Fora de Foco (<=30%)**:
  * *Exemplo*: "Product Designer — fintech P0 — empresa boa, mas domínio incompatível"
