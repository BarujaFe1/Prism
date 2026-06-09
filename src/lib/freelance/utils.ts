import { db } from "@/db";
import {
  freelanceProjects,
  freelanceSources,
  freelanceRateHistory,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import type { FreelanceProjectData } from "./types";

export function sanitizeDate(raw: string | number | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;

  const num = typeof raw === "number" ? raw : Number(raw);
  if (!isNaN(num) && String(raw).trim() !== "") {
    // 1. Absolute seconds: 2000-01-01 to 2030-01-01
    if (num >= 946684800 && num <= 2524608000) {
      return new Date(num * 1000).toISOString();
    }
    // 2. Absolute milliseconds: 2000-01-01 to 2030-01-01
    if (num >= 946684800000 && num <= 2524608000000) {
      return new Date(num).toISOString();
    }
    // 3. Relative seconds ago: less than 10 years (315360000 seconds)
    if (num > 0 && num < 315360000) {
      return new Date(Date.now() - num * 1000).toISOString();
    }
    // 4. Relative milliseconds ago: less than 10 years (315360000000 ms)
    if (num > 0 && num < 315360000000) {
      return new Date(Date.now() - num).toISOString();
    }
  }

  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const currentYear = new Date().getFullYear();
      if (year >= 2000 && year <= currentYear + 1) {
        return d.toISOString();
      }
    }
  } catch {
    // Ignore error and return null
  }

  return null;
}

export async function saveFreelanceProject(
  project: FreelanceProjectData,
  sourceName: string
): Promise<"new" | "duplicate"> {
  const hash = project.contentHash || generateSimpleHash(project.title + (project.clientName || "") + project.url);
  const existing = await db
    .select({ id: freelanceProjects.id })
    .from(freelanceProjects)
    .where(
      and(
        eq(freelanceProjects.contentHash, hash),
        eq(freelanceProjects.platform, project.platform)
      )
    )
    .get();

  if (existing) return "duplicate";

  await db.insert(freelanceProjects).values({
    id: generateId(),
    externalId: project.externalId,
    sourceId: project.sourceId,
    title: project.title,
    clientName: project.clientName,
    clientUrl: project.clientUrl,
    clientCountry: project.clientCountry,
    clientRating: project.clientRating ?? null,
    clientTotalSpent: project.clientTotalSpent ?? null,
    clientHireRate: project.clientHireRate ?? null,
    clientTotalHires: project.clientTotalHires ?? null,
    description: project.description,
    url: project.url,
    platform: project.platform,
    projectType: project.projectType ?? null,
    duration: project.duration ?? null,
    engagementType: project.engagementType ?? null,
    experienceLevel: project.experienceLevel ?? null,
    budgetMin: project.budgetMin ?? null,
    budgetMax: project.budgetMax ?? null,
    budgetCurrency: project.budgetCurrency || "USD",
    budgetType: project.budgetType ?? null,
    hourlyRateMin: project.hourlyRateMin ?? null,
    hourlyRateMax: project.hourlyRateMax ?? null,
    skills: project.skills ? JSON.stringify(project.skills) : null,
    category: project.category ?? null,
    subcategory: project.subcategory ?? null,
    proposalsCount: project.proposalsCount ?? null,
    proposalsBracket: project.proposalsBracket ?? null,
    interviewsCount: project.interviewsCount ?? null,
    postedAt: sanitizeDate(project.postedAt) ?? null,
    expiresAt: project.expiresAt ?? null,
    contentHash: hash,
  });

  return "new";
}

export async function saveFreelanceBatch(
  projects: FreelanceProjectData[],
  sourceName: string
): Promise<{ new: number; duplicate: number }> {
  let newCount = 0;
  let dupCount = 0;

  for (const p of projects) {
    const result = await saveFreelanceProject(p, sourceName);
    if (result === "new") newCount++;
    else dupCount++;
  }

  return { new: newCount, duplicate: dupCount };
}

export async function logFreelanceSync(
  sourceName: string,
  platform: string,
  result: { new: number; duplicate: number },
  error?: string,
  durationMs?: number
) {
  const existing = await db
    .select({ id: freelanceSources.id })
    .from(freelanceSources)
    .where(eq(freelanceSources.name, sourceName))
    .get();

  if (existing) {
    await db
      .update(freelanceSources)
      .set({
        lastSyncAt: new Date().toISOString(),
        totalCollected: sql`${freelanceSources.totalCollected} + ${result.new}`,
        status: error ? "error" : "active",
        errorMessage: error || null,
        avgProjectsPerSync: sql`(coalesce(${freelanceSources.avgProjectsPerSync}, 0) + ${result.new}) / 2`,
      })
      .where(eq(freelanceSources.id, existing.id))
      .run();
  } else {
    await db.insert(freelanceSources).values({
      id: generateId(),
      name: sourceName,
      type: "rss",
      platform,
      enabled: true,
      lastSyncAt: new Date().toISOString(),
      totalCollected: result.new,
      status: error ? "error" : "active",
      errorMessage: error || null,
    });
  }
}

export function generateSimpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function inferExpiresAt(platform: string, postedAt?: string): string | undefined {
  if (!postedAt) return undefined;
  const date = new Date(postedAt);
  const defaultDays: Record<string, number> = {
    upwork: 30,
    peopleperhour: 14,
    contra: 21,
  };
  const days = defaultDays[platform] || 30;
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function parseBudgetFromDescription(desc: string): { min?: number; max?: number; type?: string } {
  const hourlyMatch = desc.match(/Hourly Range:\s*\$?([\d.]+)\s*-\s*\$?([\d.]+)/i);
  if (hourlyMatch) {
    return { min: parseFloat(hourlyMatch[1]), max: parseFloat(hourlyMatch[2]), type: "hourly" };
  }
  const budgetMatch = desc.match(/Budget:\s*\$?([\d,]+)\s*-\s*\$?([\d,]+)/i);
  if (budgetMatch) {
    return { min: parseFloat(budgetMatch[1].replace(/,/g, "")), max: parseFloat(budgetMatch[2].replace(/,/g, "")), type: "fixed" };
  }
  const singleBudget = desc.match(/Budget:\s*\$?([\d,]+)/i);
  if (singleBudget) {
    return { min: parseFloat(singleBudget[1].replace(/,/g, "")), type: "fixed" };
  }
  return {};
}

export function parseProposalsFromDescription(desc: string): number | undefined {
  const match = desc.match(/Proposals:\s*(\d+)/i);
  return match ? parseInt(match[1]) : undefined;
}

export function extractSkillsFromDescription(desc: string): string[] {
  const techs = ["Python", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "SQL", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Rust", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "LLM", "AI", "GPT", "RAG", "LangChain", "Azure", "GCP", "Kafka", "Redis", "MongoDB", "C#", "Java", "Git", "Linux", "HTML", "CSS", "Tailwind", "Figma", "React Native", "Flutter", "Swift", "Kotlin"];
  return techs.filter((t) => desc.toLowerCase().includes(t.toLowerCase()));
}

export function extractDurationFromDescription(desc: string): string | undefined {
  const patterns = [
    { regex: /less than 1 month|<\s*1\s*month/i, value: "< 1 mês" },
    { regex: /1[\s-]3 months|1 to 3 months/i, value: "1-3 meses" },
    { regex: /3[\s-]6 months|3 to 6 months/i, value: "3-6 meses" },
    { regex: /6\+ months|more than 6 months/i, value: "6+ meses" },
    { regex: /ongoing|indefinite/i, value: "ongoing" },
  ];
  for (const p of patterns) {
    if (p.regex.test(desc)) return p.value;
  }
  return undefined;
}
