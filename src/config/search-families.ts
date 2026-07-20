export interface SearchFamily {
  id: string;
  name: string;
  weight: "maximum" | "high" | "medium" | "low";
  keywords: string[];
}

/**
 * Famílias de busca ordenadas por prioridade mental do perfil pessoal:
 * Full-Stack → Product Engineer → Estágio → Dados → Frontend → Backend.
 * A ordem importa: classifyJobFamily retorna a primeira família que casar.
 */
export const SEARCH_FAMILIES: SearchFamily[] = [
  {
    id: "fullstack_product",
    name: "Full-Stack / Product Engineer",
    weight: "maximum",
    keywords: [
      "full stack",
      "fullstack",
      "full-stack",
      "product engineer",
      "engenheiro de produto",
      "software engineer",
      "desenvolvedor full",
      "dev full stack",
      "next.js",
      "nextjs",
    ],
  },
  {
    id: "estagio_dev",
    name: "Estágio em Desenvolvimento",
    weight: "maximum",
    keywords: [
      "estágio desenvolvedor",
      "estagio desenvolvedor",
      "estágio software",
      "estagio software",
      "estágio full",
      "estagio full",
      "internship software",
      "internship developer",
      "intern developer",
      "estágio ti",
      "estagio ti",
    ],
  },
  {
    id: "frontend",
    name: "Frontend",
    weight: "high",
    keywords: [
      "frontend",
      "front-end",
      "front end",
      "react developer",
      "desenvolvedor react",
      "ui engineer",
      "web developer",
    ],
  },
  {
    id: "backend",
    name: "Backend / APIs",
    weight: "high",
    keywords: [
      "backend",
      "back-end",
      "back end",
      "node.js",
      "nodejs",
      "api developer",
      "desenvolvedor backend",
      "fastapi",
    ],
  },
  {
    id: "dados",
    name: "Dados",
    weight: "high",
    keywords: [
      "dados",
      "data scientist",
      "cientista de dados",
      "data analyst",
      "analista de dados",
      "data intern",
    ],
  },
  {
    id: "engenharia_dados",
    name: "Engenharia de Dados",
    weight: "medium",
    keywords: [
      "engenharia de dados",
      "engenheiro de dados",
      "data engineer",
      "junior data engineer",
      "data pipeline",
      "etl",
      "elt",
      "pipelines de dados",
    ],
  },
  {
    id: "bi_analytics",
    name: "BI e Analytics",
    weight: "medium",
    keywords: [
      "bi",
      "business intelligence",
      "analytics",
      "analytics engineer",
      "product analytics",
      "dashboard",
      "power bi",
      "tableau",
      "looker",
      "metabase",
    ],
  },
  {
    id: "produto_dados",
    name: "Produto de Dados",
    weight: "medium",
    keywords: [
      "produto de dados",
      "data product",
      "data quality",
      "data governance",
      "data profiling",
      "data ops",
      "qualidade de dados",
    ],
  },
  {
    id: "estatistica",
    name: "Estatística e Experimentos",
    weight: "medium",
    keywords: [
      "estatistica",
      "estatistico",
      "statistics",
      "experimentacao",
      "teste a/b",
      "ab testing",
      "causal inference",
      "inferencia",
    ],
  },
  {
    id: "ia_aplicada",
    name: "IA Aplicada",
    weight: "medium",
    keywords: [
      "ia",
      "ai",
      "inteligencia artificial",
      "machine learning",
      "ml",
      "llm",
      "generative ai",
      "rag",
    ],
  },
  {
    id: "fullstack_dados",
    name: "Full-Stack com Dados",
    weight: "high",
    keywords: [
      "fullstack data",
      "full stack data",
      "fullstack analytics",
      "dashboard developer",
      "internal tools",
      "automacao",
      "automação",
      "python developer",
      "backend data",
      "api analytics",
    ],
  },
];

export const WEIGHT_VALUES: Record<SearchFamily["weight"], number> = {
  maximum: 1.0,
  high: 0.85,
  medium: 0.7,
  low: 0.4,
};

export const INCOMPATIBLE_DOMAINS = ["design", "legal", "sales", "finance_ops", "admin_support"];

export function classifyJobFamily(title: string): string {
  const t = title.toLowerCase();
  for (const family of SEARCH_FAMILIES) {
    if (family.keywords.some((kw) => t.includes(kw.toLowerCase()))) {
      return family.id;
    }
  }
  return "unknown";
}
