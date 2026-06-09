import { db } from "../src/db";
import { jobs, freelanceProjects } from "../src/db/schema";
import { sql, eq } from "drizzle-orm";
import { inferExpiresAt } from "../src/lib/freelance/utils";

function isDateInvalid(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  
  // Check for negative years (e.g., starting with minus sign)
  if (dateStr.trim().startsWith("-")) return true;
  
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    
    const year = d.getFullYear();
    // A valid job date must be between 2000 and 2027
    if (year < 2000 || year > 2027) return true;
    
    return false;
  } catch {
    return true;
  }
}

async function main() {
  console.log("Starting database date sanitization...");

  // 1. Sanitize 'jobs' table
  const allJobs = await db.select({
    id: jobs.id,
    title: jobs.title,
    postedAt: jobs.postedAt,
    fetchedAt: jobs.fetchedAt,
  }).from(jobs).all();

  let jobsFixed = 0;
  for (const job of allJobs) {
    if (isDateInvalid(job.postedAt)) {
      // Use fetchedAt as fallback, or now if fetchedAt is also invalid
      const fallback = !isDateInvalid(job.fetchedAt) ? job.fetchedAt : new Date().toISOString();
      await db.update(jobs)
        .set({ postedAt: fallback })
        .where(eq(jobs.id, job.id))
        .run();
      jobsFixed++;
    }
  }
  console.log(`Jobs processed. Corrected ${jobsFixed} records with invalid dates.`);

  // 2. Sanitize 'freelance_projects' table
  const allProjects = await db.select({
    id: freelanceProjects.id,
    title: freelanceProjects.title,
    platform: freelanceProjects.platform,
    postedAt: freelanceProjects.postedAt,
    expiresAt: freelanceProjects.expiresAt,
    collectedAt: freelanceProjects.collectedAt,
  }).from(freelanceProjects).all();

  let projectsFixed = 0;
  for (const project of allProjects) {
    let needsUpdate = false;
    let newPostedAt = project.postedAt;
    let newExpiresAt = project.expiresAt;

    if (isDateInvalid(project.postedAt)) {
      newPostedAt = !isDateInvalid(project.collectedAt) ? project.collectedAt : new Date().toISOString();
      needsUpdate = true;
    }

    if (isDateInvalid(project.expiresAt)) {
      // Re-infer expiresAt from the corrected postedAt
      newExpiresAt = inferExpiresAt(project.platform, newPostedAt || undefined) || null;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await db.update(freelanceProjects)
        .set({
          postedAt: newPostedAt,
          expiresAt: newExpiresAt,
        })
        .where(eq(freelanceProjects.id, project.id))
        .run();
      projectsFixed++;
    }
  }
  console.log(`Freelance projects processed. Corrected ${projectsFixed} records with invalid dates.`);
  
  console.log("Database date sanitization completed successfully.");
}

main().catch(console.error);
