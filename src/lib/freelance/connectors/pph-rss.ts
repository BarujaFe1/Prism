import type { FreelanceProjectData, FreelancePlatform } from "../types";
import { saveFreelanceBatch, logFreelanceSync } from "../utils";

export async function fetchPPH(): Promise<{ new: number; duplicate: number }> {
  const start = Date.now();
  const allProjects: FreelanceProjectData[] = [];
  let lastError: string | undefined;

  try {
    const res = await fetch("https://www.peopleperhour.com/rss/jobs", {
      headers: { "User-Agent": "Prism/1.0 Freelance" },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404) {
      lastError = "PeoplePerHour RSS feed moved (404). Needs new URL.";
    }
  } catch (err: any) {
    lastError = err.message;
  }

  const result = await saveFreelanceBatch(allProjects, "PeoplePerHour RSS");
  await logFreelanceSync("PeoplePerHour RSS", "peopleperhour", result, lastError, Date.now() - start);
  return result;
}
