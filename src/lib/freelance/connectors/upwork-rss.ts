import type { FreelanceProjectData, FreelancePlatform } from "../types";
import { saveFreelanceBatch, logFreelanceSync } from "../utils";

export async function fetchUpworkRSS(): Promise<{ new: number; duplicate: number }> {
  const start = Date.now();
  const allProjects: FreelanceProjectData[] = [];
  let lastError: string | undefined;

  try {
    const res = await fetch("https://www.upwork.com/ab/feed/jobs/rss?q=developer", {
      headers: { "User-Agent": "Prism/1.0 Freelance" },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 410) {
      lastError = "Upwork RSS feed deprecated (410). Needs new URL.";
    } else if (res.status === 403) {
      lastError = "Upwork requires browser (403). Needs alternative approach.";
    }
  } catch (err: any) {
    lastError = err.message;
  }

  const result = await saveFreelanceBatch(allProjects, "Upwork RSS");
  await logFreelanceSync("Upwork RSS", "upwork", result, lastError, Date.now() - start);
  return result;
}
