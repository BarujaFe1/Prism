import { XMLParser } from "fast-xml-parser";
import type { FreelanceProjectData, FreelancePlatform } from "../types";
import { saveFreelanceBatch, logFreelanceSync, generateSimpleHash, inferExpiresAt, extractSkillsFromDescription } from "../utils";

const WWR_FREELANCE_FEEDS = [
  "https://weworkremotely.com/categories/remote-contract-jobs.rss",
  "https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss",
  "https://weworkremotely.com/categories/remote-backend-programming-jobs.rss",
  "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss",
  "https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss",
  "https://weworkremotely.com/categories/remote-data-jobs.rss",
];

export async function fetchWWRContract(): Promise<{ new: number; duplicate: number }> {
  const start = Date.now();
  const allProjects: FreelanceProjectData[] = [];
  let lastError: string | undefined;

  for (const feedUrl of WWR_FREELANCE_FEEDS) {
    try {
      const res = await fetch(feedUrl, {
        headers: { "User-Agent": "Prism/1.0 Freelance" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;

      const xml = await res.text();
      const parser = new XMLParser({ ignoreAttributes: false, isArray: (name) => ["item", "category"].includes(name) });
      const parsed = parser.parse(xml);
      const items = parsed?.rss?.channel?.item || [];
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        const title = item.title?.trim();
        const link = item.link?.trim();
        const desc = item.description || "";
        const pubDate = item.pubDate;
        const company = item["a10:author"] || item.author || "";

        if (!title || !link) continue;
        const lower = `${title} ${desc}`.toLowerCase();
        if (!lower.includes("contract") && !lower.includes("freelance") && !lower.includes("part-time") && !lower.includes("project-based")) continue;

        const skills = extractSkillsFromDescription(`${title} ${desc}`);
        const descClean = desc.replace(/<[^>]*>/g, "").trim();

        allProjects.push({
          sourceId: "wwr-contract",
          title,
          clientName: company.trim() || "WWR Client",
          description: descClean,
          url: link,
          platform: "weworkremotely" as FreelancePlatform,
          skills,
          postedAt: pubDate ? new Date(pubDate).toISOString() : undefined,
          expiresAt: inferExpiresAt("weworkremotely", pubDate),
          contentHash: generateSimpleHash(title + link),
        });
      }
    } catch (err: any) {
      lastError = err.message;
    }
  }

  const result = await saveFreelanceBatch(allProjects, "WWR Contract");
  await logFreelanceSync("WWR Contract", "weworkremotely", result, lastError, Date.now() - start);
  return result;
}
