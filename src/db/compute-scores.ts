import { db } from "./index";
import { jobs, profile } from "./schema";
import { eq } from "drizzle-orm";
import { computeScore } from "../engine/scorer";

async function main() {
  const p = await db.select().from(profile).where(eq(profile.id, "default")).get();
  if (!p) {
    console.error("Profile not found");
    process.exit(1);
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
    desiredLocationTypes: (p.desiredLocationTypes || []) as any[],
    desiredContractTypes: (p.desiredContractTypes || []) as any[],
    experienceLevel: (p.experienceLevel || "junior") as any,
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
        locationType: job.locationType as any,
        contractType: job.contractType as any,
        experienceLevel: job.experienceLevel as any,
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

  console.log(`Updated scores for ${updated} jobs`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
