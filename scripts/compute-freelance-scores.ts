import { db } from "../src/db/index";
import { freelanceProjects, profile } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { scoreFreelanceProject } from "../src/lib/scoring/freelance-score-engine";

async function main() {
  const p = await db.select().from(profile).where(eq(profile.id, "default")).get();
  if (!p) {
    console.error("Profile not found");
    process.exit(1);
  }

  const userSkills = p.skills || [];
  const minRate = p.freelanceMinHourlyRate ?? 30;

  const profileData = {
    minHourlyRate: minRate,
    skills: userSkills,
    preferredCurrency: p.freelancePreferredCurrency || "USD",
    availableHoursPerWeek: p.freelanceAvailableHoursPerWeek || 20,
    openToFixedPrice: p.freelanceOpenToFixedPrice ?? true,
    minFixedProjectValue: p.freelanceMinFixedProjectValue || 500,
    experienceYears: p.freelanceExperienceYears || 2,
    portfolioUrl: p.freelancePortfolioUrl || "",
    specialization: p.freelanceSpecialization || "full-stack",
  };

  const allProjects = await db.select().from(freelanceProjects).all();
  console.log(`Recalculating scores for ${allProjects.length} freelance projects...`);

  let updated = 0;

  for (const project of allProjects) {
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
      profileData
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

    updated++;
  }

  console.log(`Successfully updated scores for ${updated} freelance projects.`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
