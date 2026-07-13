import type { RawJobData, LocationType, ContractType } from "@/types";
import { db } from "@/db";
import { jobs, jobEvents, connectorLogs } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import { normalizeJob } from "@/engine/normalizer";
import { computeScore } from "@/engine/scorer";
import { profile } from "@/db/schema";

export function sanitizeDate(raw: string | number | null | undefined): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  const year = d.getFullYear();
  if (year >= 2020 && year <= 2030) return d.toISOString();
  const fromUnix = new Date(Number(raw) * 1000);
  const unixYear = fromUnix.getFullYear();
  if (unixYear >= 2020 && unixYear <= 2030) return fromUnix.toISOString();
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

    const tenPercentCutoff = score >= 0.75 ? "high" : score >= 0.50 ? "good" : score >= 0.30 ? "partial" : "low";

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
      fitLabel: tenPercentCutoff as any,
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
