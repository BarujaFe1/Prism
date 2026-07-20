/**
 * Upsert Felipe's personal profile into the local database and optionally rescore jobs.
 *
 *   npm run profile:personal
 *   npm run profile:personal -- --rescore
 *
 * Refuses to run when PRISM_DEMO_MODE is on (protects public demo DB).
 */
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { profile } from "../src/db/schema";
import { buildPersonalProfilePayload } from "../src/lib/profile/personal-profile";
import { isDemoMode } from "../src/lib/api-guards";

async function main() {
  if (isDemoMode()) {
    throw new Error(
      "Refusing to write personal profile while PRISM_DEMO_MODE is enabled. Unset it for local personal use."
    );
  }

  const payload = buildPersonalProfilePayload();
  const now = new Date().toISOString();
  const existing = await db.select().from(profile).where(eq(profile.id, "default")).get();

  const row = {
    id: "default" as const,
    name: payload.name,
    headline: payload.headline,
    summary: payload.summary,
    skills: payload.skills,
    desiredRoles: payload.desiredRoles,
    desiredSalaryMin: payload.desiredSalaryMin,
    desiredSalaryMax: payload.desiredSalaryMax,
    desiredCurrency: payload.desiredCurrency,
    desiredLocationTypes: payload.desiredLocationTypes,
    desiredContractTypes: payload.desiredContractTypes,
    experienceLevel: payload.experienceLevel,
    languages: payload.languages,
    negativeKeywords: payload.negativeKeywords,
    githubUrl: payload.githubUrl,
    linkedinUrl: payload.linkedinUrl,
    portfolioUrl: payload.portfolioUrl,
    resumeUrl: payload.resumeUrl,
    resumeFilename: payload.resumeFilename,
    contactEmail: payload.contactEmail,
    skillsEvidence: payload.skillsEvidence,
    learningBacklog: payload.learningBacklog,
    applicationPlans: payload.applicationPlans,
    freelanceMinHourlyRate: payload.freelanceMinHourlyRate as number,
    freelancePreferredCurrency: payload.freelancePreferredCurrency as string,
    freelanceAvailableHoursPerWeek: payload.freelanceAvailableHoursPerWeek as number,
    freelanceOpenToFixedPrice: payload.freelanceOpenToFixedPrice as boolean,
    freelanceMinFixedProjectValue: payload.freelanceMinFixedProjectValue as number,
    freelanceExperienceYears: payload.freelanceExperienceYears as number,
    freelancePortfolioUrl: payload.freelancePortfolioUrl as string,
    freelanceSpecialization: payload.freelanceSpecialization as string,
    updatedAt: now,
  };

  if (existing) {
    await db.update(profile).set(row).where(eq(profile.id, "default"));
    console.log("Updated personal profile (default).");
  } else {
    await db.insert(profile).values(row);
    console.log("Inserted personal profile (default).");
  }

  console.log(
    `Skills: ${payload.skills?.length} · Evidences: ${(payload.skillsEvidence as unknown[]).length} · Learning: ${(payload.learningBacklog as unknown[]).length} · Plans: ${(payload.applicationPlans as unknown[]).length}`
  );

  if (process.argv.includes("--rescore")) {
    console.log("Running rescore…");
    const { spawnSync } = await import("node:child_process");
    const r = spawnSync("npx", ["tsx", "src/db/compute-scores.ts"], {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: { ...process.env, PRISM_DEMO_MODE: "0" },
    });
    if (r.status !== 0) {
      console.warn(
        "Rescore failed (schema/jobs may be incomplete). Profile was still saved. Sync DB with drizzle-kit push / db:migrate, then re-run with --rescore."
      );
      process.exit(0);
    }
  } else {
    console.log("Tip: run with --rescore to refresh job scores against the new profile.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
