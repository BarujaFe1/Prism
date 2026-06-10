export interface SearchFamily {
  id: string;
  name: string;
  weight: "maximum" | "high" | "medium" | "low";
  keywords: string[];
}

export const SEARCH_FAMILIES: SearchFamily[] = [
  {
    id: "dados",
    name: "Dados",
    weight: "maximum",
    keywords: ["dados", "data scientist", "cientista de dados", "science", "cientista", "data analyst", "data intern"],
  },
  {
    id: "engenharia_dados",
    name: "Engenharia de Dados",
    weight: "maximum",
    keywords: ["engenharia de dados", "engenheiro de dados", "data engineer", "junior data engineer", "data pipeline", "etl", "elt", "pipelines de dados"],
  },
  {
    id: "bi_analytics",
    name: "BI e Analytics",
    weight: "high",
    keywords: ["bi", "business intelligence", "analytics", "analytics engineer", "product analytics", "revenue analytics", "marketing analytics", "customer analytics", "operations analytics", "dashboard", "power bi", "tableau", "looker", "metabase"],
  },
  {
    id: "produto_dados",
    name: "Produto de Dados",
    weight: "high",
    keywords: ["produto de dados", "data product", "data quality", "data governance", "data profiling", "data ops", "data automation", "qualidade de dados", "governanca de dados"],
  },
  {
    id: "estatistica",
    name: "Estatística e Experimentos",
    weight: "high",
    keywords: ["estatistica", "estatistico", "statistics", "experimentacao", "teste a/b", "ab testing", "causal inference", "inference", "inferencia", "modelagem", "probabilidade", "probability"],
  },
  {
    id: "ia_aplicada",
    name: "IA Aplicada",
    weight: "high",
    keywords: ["ia", "ai", "inteligencia artificial", "machine learning", "ml", "llm", "generative ai", "prompt engineering", "ai evaluation", "data labeling", "evals", "datasets", "rag"],
  },
  {
    id: "fullstack_dados",
    name: "Full-Stack com Dados",
    weight: "medium",
    keywords: ["fullstack data", "full stack data", "fullstack analytics", "dashboard developer", "internal tools", "automacao", "automação", "python developer", "backend data", "api analytics"],
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
