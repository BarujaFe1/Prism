import type { RawJobData, LocationType, ContractType, ExperienceLevel, SalaryPeriod } from "@/types";
import { parseLocation, detectLanguage } from "@/lib/location";

const AI_KEYWORDS = [
  "LLM", "large language model", "GPT", "Claude", "Gemini", "AI agent",
  "agentic", "prompt engineer", "RAG", "vector database", "langchain",
  "llamaindex", "AI-first", "vibe coding", "cursor", "copilot", "MCP",
  "model context protocol", "function calling", "fine-tuning", "RLHF",
  "embeddings", "semantic search", "AI engineer", "AI developer",
];

export function normalizeJob(raw: RawJobData): RawJobData {
  const textForAI = `${raw.title} ${raw.description || ""}`.toLowerCase();
  const tags: string[] = (raw.tags || []).map((t) => t.trim().toLowerCase()).filter(Boolean);

  for (const kw of AI_KEYWORDS) {
    if (textForAI.includes(kw.toLowerCase())) {
      if (kw.includes("llm") || kw.includes("gpt") || kw.includes("claude") || kw.includes("gemini") || kw.includes("prompt engineer") || kw.includes("rag") || kw.includes("langchain") || kw.includes("fine-tuning")) {
        if (!tags.includes("llm-dev")) tags.push("llm-dev");
      }
      if (!tags.includes("ai-engineering")) tags.push("ai-engineering");
      if (kw.includes("agent") || kw.includes("agentic") || kw.includes("function calling") || kw.includes("mcp")) {
        if (!tags.includes("ai-agents")) tags.push("ai-agents");
      }
      break;
    }
  }

  const loc = (raw.location || "").toLowerCase();
  const curr = (raw.currency || "").toUpperCase();
  const isInternational = curr !== "" && curr !== "BRL" &&
    !loc.includes("sp") && !loc.includes("brasil") && !loc.includes("brazil") &&
    !loc.includes("são paulo") && !loc.includes("rio de janeiro");

  const parsedLocation = parseLocation(raw.location);
  const detectedLanguage = detectLanguage(raw.description);

  return {
    title: normalizeTitle(raw.title),
    company: normalizeCompany(raw.company),
    description: raw.description ? cleanDescription(raw.description) : undefined,
    location: raw.location?.trim() || undefined,
    locationType: normalizeLocationType(raw.locationType, raw.location),
    salaryMin: raw.salaryMin,
    salaryMax: raw.salaryMax,
    currency: raw.currency ? raw.currency.toUpperCase() : undefined,
    salaryPeriod: normalizeSalaryPeriod(raw.salaryPeriod),
    contractType: normalizeContractType(raw.contractType),
    experienceLevel: normalizeExperienceLevel(raw.experienceLevel, raw.title),
    technologies: raw.technologies?.map((t) => t.trim()).filter(Boolean) || [],
    tags,
    source: raw.source,
    sourceId: raw.sourceId?.trim(),
    url: raw.url?.trim(),
    companyUrl: raw.companyUrl?.trim(),
    companyLogoUrl: raw.companyLogoUrl?.trim(),
    postedAt: raw.postedAt,
    isInternational,
    city: parsedLocation.city,
    country: parsedLocation.country,
    countryCode: parsedLocation.countryCode,
    detectedLanguage,
  };
}

function normalizeTitle(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .trim();
}

function normalizeCompany(company: string): string {
  return company.trim().replace(/\s+/g, " ");
}

function cleanDescription(desc: string): string {
  return desc
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLocationType(
  lt: LocationType | undefined,
  location: string | undefined
): LocationType | undefined {
  if (lt) return lt;
  if (!location) return undefined;
  const l = location.toLowerCase();
  if (l.includes("remote") || l.includes("remoto")) return "remote";
  if (l.includes("hybrid") || l.includes("híbrido") || l.includes("hibrido")) return "hybrid";
  return "onsite";
}

function normalizeSalaryPeriod(sp: SalaryPeriod | undefined): SalaryPeriod | undefined {
  if (sp) return sp;
  return undefined;
}

function normalizeContractType(ct: ContractType | undefined): ContractType | undefined {
  if (ct) return ct;
  return undefined;
}

function normalizeExperienceLevel(
  el: ExperienceLevel | undefined,
  title: string
): ExperienceLevel | undefined {
  if (el) return el;
  const t = title.toLowerCase();
  if (t.includes("estágio") || t.includes("intern") || t.includes("internship")) return "internship";
  if (t.includes("trainee")) return "trainee";
  if (t.includes("junior") || t.includes("júnior") || t.includes("jr")) return "junior";
  if (t.includes("senior") || t.includes("sênior") || t.includes("sr")) return "senior";
  if (t.includes("lead") || t.includes("staff") || t.includes("principal")) return "lead";
  if (t.includes("pleno") || t.includes("mid") || t.includes("medium")) return "mid";
  return undefined;
}
