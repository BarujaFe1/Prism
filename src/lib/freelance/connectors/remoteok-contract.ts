import type { FreelanceProjectData, FreelancePlatform } from "../types";
import { saveFreelanceBatch, logFreelanceSync, generateSimpleHash, extractSkillsFromDescription } from "../utils";

const FREELANCE_TAGS = ["contract", "freelance", "part-time", "project"];

export async function fetchRemoteOKContract(): Promise<{ new: number; duplicate: number }> {
  const start = Date.now();
  const allProjects: FreelanceProjectData[] = [];
  let lastError: string | undefined;

  try {
    const res = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "Prism/1.0 Freelance", "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`RemoteOK: ${res.status}`);

    const data = await res.json();
    const items = Array.isArray(data) ? data : data?.jobs || [];
    if (!Array.isArray(items)) throw new Error("RemoteOK: invalid response");

    for (const job of items) {
      const title = job.title || job.position;
      const link = job.url || job.apply_url || job.id;
      if (!title || !link) continue;

      const tags = job.tags || [];
      const tagLower = tags.map((t: string) => t.toLowerCase());
      const hasFreelanceTag = FREELANCE_TAGS.some((ft) => tagLower.includes(ft) || title.toLowerCase().includes(ft));
      if (!hasFreelanceTag) continue;

      const skills = extractSkillsFromDescription(`${title} ${job.description || ""}`);
      const company = job.company || job.company_name || "RemoteOK Client";

      allProjects.push({
        sourceId: "remoteok-contract",
        title,
        clientName: company,
        description: job.description || "",
        url: typeof link === "string" && link.startsWith("http") ? link : `https://remoteok.com/remote-jobs/${link}`,
        platform: "remoteok" as FreelancePlatform,
        skills,
        proposalsCount: job.proposals_count ?? undefined,
        postedAt: job.date || job.created_at ? new Date(job.date || job.created_at).toISOString() : undefined,
        budgetCurrency: "USD",
        contentHash: generateSimpleHash(title + company + link),
      });
    }
  } catch (err: any) {
    lastError = err.message;
  }

  const result = await saveFreelanceBatch(allProjects, "RemoteOK Contract");
  await logFreelanceSync("RemoteOK Contract", "remoteok", result, lastError, Date.now() - start);
  return result;
}
