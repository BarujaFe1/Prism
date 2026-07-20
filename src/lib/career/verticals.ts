/**
 * Two primary career verticals for Felipe:
 * - Dev: software engineering / full-stack / frontend / backend
 * - Dados: analyst, BI, statistics (USP), data products
 */
export type CareerVertical = "dev" | "dados" | "other";

export const VERTICAL_LABELS: Record<CareerVertical, string> = {
  dev: "Dev",
  dados: "Dados",
  other: "Outro",
};

export const VERTICAL_DESCRIPTIONS: Record<"dev" | "dados", string> = {
  dev: "Engenharia de software — Full-Stack, Frontend, Backend, Product Engineer",
  dados:
    "Analytics e formação USP — Analista de Dados, BI, Estatística, qualidade de dados, data products",
};

/** Domains from classifyDomain() → vertical */
const DEV_DOMAINS = new Set([
  "fullstack_backend",
  "software_engineering",
  "frontend",
]);

const DADOS_DOMAINS = new Set([
  "data",
  "data_engineering",
  "bi_analytics",
  "produto_dados",
  "estatistica",
  "ia_aplicada",
  "fullstack_dados",
]);

export function domainToVertical(domain: string | null | undefined): CareerVertical {
  if (!domain) return "other";
  if (DEV_DOMAINS.has(domain)) return "dev";
  if (DADOS_DOMAINS.has(domain)) return "dados";
  return "other";
}

/** Track keys that belong to each vertical */
export const DEV_TRACK_KEYS = new Set(["fullstack_product", "frontend", "backend"]);
export const DADOS_TRACK_KEYS = new Set(["data_analytics", "ai_automation"]);

export function trackKeyToVertical(key: string): CareerVertical {
  if (DEV_TRACK_KEYS.has(key)) return "dev";
  if (DADOS_TRACK_KEYS.has(key)) return "dados";
  if (key === "mobile") return "dev";
  return "other";
}

/** Equal effort when the vertical is in play */
export function verticalDomainScore(vertical: CareerVertical): number {
  if (vertical === "dev" || vertical === "dados") return 1.0;
  return 0.5;
}
