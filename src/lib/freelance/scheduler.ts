import { syncAllFreelanceSources } from "./sync";
import { checkOpportunityAlerts } from "./opportunity-alerts";
import { scoreFreelanceProject } from "../scoring/freelance-score-engine";
import { db } from "@/db";
import { freelanceProjects, profile } from "@/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startFreelanceScheduler(intervalMinutes = 60) {
  if (intervalId) clearInterval(intervalId);
  runFreelanceSync();
  intervalId = setInterval(runFreelanceSync, intervalMinutes * 60 * 1000);
}

export function stopFreelanceScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

async function runFreelanceSync() {
  console.log("[Freelance] Starting sync...");
  try {
    const { results, errors } = await syncAllFreelanceSources();
    const totalNew = Object.values(results).reduce((a, r) => a + r.new, 0);
    console.log(`[Freelance] Sync done: ${totalNew} new projects`);
    if (errors.length > 0) console.error("[Freelance] Errors:", errors);

    await scoreUnscoredProjects();
    const alerts = await checkOpportunityAlerts();
    if (alerts.length > 0) {
      console.log(`[Freelance] ${alerts.length} opportunity windows detected`);
    }
  } catch (err) {
    console.error("[Freelance] Sync error:", err);
  }
}

async function scoreUnscoredProjects() {
  const profileData = await db
    .select()
    .from(profile)
    .where(eq(profile.id, "default"))
    .get();

  if (!profileData) return;

  const userSkills = profileData.skills || [];
  const minRate = profileData.freelanceMinHourlyRate ?? 30;

  const unscored = await db
    .select()
    .from(freelanceProjects)
    .where(
      and(
        isNull(freelanceProjects.fitScore),
        eq(freelanceProjects.status, "new")
      )
    )
    .all();

  for (const project of unscored) {
    const score = scoreFreelanceProject(
      {
        title: project.title,
        skills: project.skills ? JSON.parse(project.skills) : [],
        clientRating: project.clientRating ?? undefined,
        clientTotalSpent: project.clientTotalSpent ?? undefined,
        clientHireRate: project.clientHireRate ?? undefined,
        clientTotalHires: project.clientTotalHires ?? undefined,
        hourlyRateMin: project.hourlyRateMin ?? undefined,
        hourlyRateMax: project.hourlyRateMax ?? undefined,
        budgetMin: project.budgetMin ?? undefined,
        budgetMax: project.budgetMax ?? undefined,
        description: project.description ?? undefined,
        duration: project.duration ?? undefined,
        proposalsCount: project.proposalsCount ?? undefined,
      } as any,
      {
        minHourlyRate: minRate,
        skills: userSkills,
        preferredCurrency: profileData.freelancePreferredCurrency || "USD",
        availableHoursPerWeek: profileData.freelanceAvailableHoursPerWeek || 20,
        openToFixedPrice: profileData.freelanceOpenToFixedPrice ?? true,
        minFixedProjectValue: profileData.freelanceMinFixedProjectValue || 500,
        experienceYears: profileData.freelanceExperienceYears || 2,
        portfolioUrl: profileData.freelancePortfolioUrl || "",
        specialization: profileData.freelanceSpecialization || "full-stack",
      }
    );

    await db
      .update(freelanceProjects)
      .set({
        fitScore: score.total,
        fitBreakdown: JSON.stringify(score.breakdown),
        redFlags: JSON.stringify(score.redFlags),
        opportunities: JSON.stringify(score.greenFlags),
      })
      .where(eq(freelanceProjects.id, project.id))
      .run();
  }

  console.log(`[Freelance] Scored ${unscored.length} projects`);
}
