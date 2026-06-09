import type { RawJobData, LocationType, ContractType } from "@/types";
import { db } from "@/db";
import { jobs, jobEvents, connectorLogs } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import { normalizeJob } from "@/engine/normalizer";
import { computeScore } from "@/engine/scorer";
import { profile } from "@/db/schema";

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

export async function saveJobs(jobsData: RawJobData[], connectorName: string): Promise<{ new: number; duplicate: number; total: number }> {
  let newCount = 0;
  let dupCount = 0;

  const p = await db.select().from(profile).where(eq(profile.id, "default")).get();
  const profileData = p ? {
    name: p.name || "",
    headline: p.headline || "",
    summary: p.summary || "",
    skills: (p.skills || []) as string[],
    desiredRoles: (p.desiredRoles || []) as string[],
    desiredSalaryMin: p.desiredSalaryMin,
    desiredSalaryMax: p.desiredSalaryMax,
    desiredCurrency: p.desiredCurrency || "BRL",
    desiredLocationTypes: (p.desiredLocationTypes || []) as LocationType[],
    desiredContractTypes: (p.desiredContractTypes || []) as ContractType[],
    experienceLevel: (p.experienceLevel || "junior") as any,
    languages: (p.languages || []) as string[],
    negativeKeywords: (p.negativeKeywords || []) as string[],
  } : null;

  for (const raw of jobsData) {
    const normalized = normalizeJob(raw);
    const hash = simpleHash(`${normalized.title}|${normalized.company}|${normalized.location || ""}`);

    const existing = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(
        and(
          eq(jobs.source, normalized.source),
          eq(jobs.hash, hash)
        )
      )
      .get();

    if (existing) {
      dupCount++;
      continue;
    }

    const id = generateId();
    const { score, details } = computeScore({
      title: normalized.title || "",
      description: normalized.description || null,
      technologies: normalized.technologies || [],
      locationType: normalized.locationType || null,
      contractType: normalized.contractType || null,
      experienceLevel: normalized.experienceLevel || null,
      salaryMin: normalized.salaryMin || null,
      salaryMax: normalized.salaryMax || null,
      currency: normalized.currency || null,
      postedAt: normalized.postedAt || raw.postedAt || null,
    }, profileData);

    const fitLabel = details.fitLabel || (score >= 0.75 ? "high" : score >= 0.50 ? "good" : score >= 0.30 ? "partial" : "low");

    await db.insert(jobs).values({
      id,
      title: normalized.title || raw.title,
      company: normalized.company || raw.company,
      description: normalized.description || raw.description,
      hash,
      location: normalized.location,
      locationType: normalized.locationType,
      salaryMin: normalized.salaryMin,
      salaryMax: normalized.salaryMax,
      currency: normalized.currency,
      salaryPeriod: normalized.salaryPeriod,
      contractType: normalized.contractType,
      experienceLevel: normalized.experienceLevel,
      technologies: normalized.technologies || [],
      tags: normalized.tags || [],
      source: normalized.source || raw.source,
      sourceId: normalized.sourceId || raw.sourceId,
      url: normalized.url || raw.url,
      postedAt: sanitizeDate(normalized.postedAt || raw.postedAt) || new Date().toISOString(),
      isInternational: normalized.isInternational || false,
      city: normalized.city,
      country: normalized.country,
      countryCode: normalized.countryCode,
      detectedLanguage: normalized.detectedLanguage || "pt",
      isNormalized: true,
      score,
      scoreDetails: JSON.stringify(details),
      fitLabel: fitLabel as any,
      status: "new",
    });

    await db.insert(jobEvents).values({
      id: generateId(),
      jobId: id,
      eventType: "discovered",
      description: `Vaga encontrada via ${connectorName}`,
      occurredAt: new Date().toISOString(),
    });

    newCount++;
  }

  return { new: newCount, duplicate: dupCount, total: jobsData.length };
}

export async function logConnectorRun(connectorName: string, result: { new: number; duplicate: number; total: number }, error?: string, durationMs?: number) {
  await db.insert(connectorLogs).values({
    id: generateId(),
    connectorName,
    runAt: new Date().toISOString(),
    jobsFetched: result.total,
    jobsNew: result.new,
    jobsDuplicate: result.duplicate,
    errorMessage: error || null,
    durationMs: durationMs || null,
  });
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export async function getConnectorLogs(connectorName: string, limit = 10) {
  return db
    .select()
    .from(connectorLogs)
    .where(eq(connectorLogs.connectorName, connectorName))
    .orderBy(sql`${connectorLogs.runAt} DESC`)
    .limit(limit)
    .all();
}
