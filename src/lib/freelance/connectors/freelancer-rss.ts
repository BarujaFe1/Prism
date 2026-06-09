import type { FreelanceProjectData, FreelancePlatform } from "../types";
import { saveFreelanceBatch, logFreelanceSync } from "../utils";

export async function fetchFreelancerRSS(): Promise<{ new: number; duplicate: number }> {
  const start = Date.now();
  const allProjects: FreelanceProjectData[] = [];
  let lastError: string | undefined;

  try {
    const res = await fetch("https://www.freelancer.com/rss/category/web-development.xml", {
      headers: { "User-Agent": "Prism/1.0 Freelance" },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404) {
      lastError = "Freelancer.com RSS feed removed (404). Needs new URL.";
    }
  } catch (err: any) {
    lastError = err.message;
  }

  const result = await saveFreelanceBatch(allProjects, "Freelancer.com RSS");
  await logFreelanceSync("Freelancer.com RSS", "freelancer", result, lastError, Date.now() - start);
  return result;
}
