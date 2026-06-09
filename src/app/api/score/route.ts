import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, profile } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { computeScore } from "@/engine/scorer";
import type { LocationType, ContractType, ExperienceLevel } from "@/types";

export async function POST() {
  const p = await db.select().from(profile).where(eq(profile.id, "default")).get();
  if (!p) {
    return NextResponse.json({ error: "Profile not found" }, { status: 400 });
  }

  const profileData = {
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
    experienceLevel: (p.experienceLevel || "junior") as ExperienceLevel,
    languages: (p.languages || []) as string[],
    negativeKeywords: (p.negativeKeywords || []) as string[],
  };

  const allJobs = await db.select().from(jobs).all();
  let updated = 0;

  for (const job of allJobs) {
    const { score, details } = computeScore(
      {
        title: job.title,
        description: job.description,
        technologies: (job.technologies || []) as string[],
        locationType: job.locationType as LocationType,
        contractType: job.contractType as ContractType,
        experienceLevel: job.experienceLevel as ExperienceLevel,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        currency: job.currency,
        postedAt: job.postedAt,
      },
      profileData
    );

    const fitLabel = details.fitLabel || (score >= 0.75 ? "high" : score >= 0.50 ? "good" : score >= 0.30 ? "partial" : "low");

    await db
      .update(jobs)
      .set({
        score: Math.round(score * 100) / 100,
        scoreDetails: JSON.stringify(details),
        fitLabel: fitLabel as any,
        isNormalized: true,
      })
      .where(eq(jobs.id, job.id));

    updated++;
  }

  return NextResponse.json({ ok: true, updated });
}
