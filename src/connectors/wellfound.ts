import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";

const API_URL = "https://wellfound.com/api/v1/companies";

export async function fetchWellfound(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();

  try {
    const response = await fetch("https://wellfound.com/jobs/list/remote", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) throw new Error(`Wellfound: ${response.status}`);

    const html = await response.text();
    const jobsData = parseWellfoundHTML(html);

    const result = await saveJobs(jobsData, "Wellfound");
    await logConnectorRun("Wellfound", result, undefined, Date.now() - start);
    return result;
  } catch (err: any) {
    await logConnectorRun("Wellfound", { new: 0, duplicate: 0, total: 0 }, err.message, Date.now() - start);
    return { new: 0, duplicate: 0, total: 0 };
  }
}

function parseWellfoundHTML(html: string): RawJobData[] {
  const jobs: RawJobData[] = [];
  const seen = new Set<string>();

  const cardRegex = /<div[^>]*class="[^"]*card[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
  let match;

  while ((match = cardRegex.exec(html)) !== null) {
    const card = match[1];
    if (!card) continue;

    const titleMatch = card.match(/<h2[^>]*>([^<]+)</);
    const companyMatch = card.match(/class="[^"]*company-name[^"]*"[^>]*>([^<]+)</);
    const locationMatch = card.match(/class="[^"]*location[^"]*"[^>]*>([^<]+)</);
    const linkMatch = card.match(/href="([^"]+)"[^>]*>([^<]+)</);

    const title = titleMatch?.[1]?.trim();
    const company = companyMatch?.[1]?.trim() || "Startup";
    const location = locationMatch?.[1]?.trim() || "Remote";

    if (!title || seen.has(title + company)) continue;
    seen.add(title + company);

    const lower = `${title} ${location}`.toLowerCase();
    let locationType: "remote" | "hybrid" | "onsite" = "remote";
    if (lower.includes("hybrid")) locationType = "hybrid";
    if (lower.includes("onsite") || lower.includes("on-site") || lower.includes("presencial")) locationType = "onsite";

    jobs.push({
      title,
      company,
      description: `Wellfound listing: ${title} at ${company}`,
      location,
      locationType,
      contractType: "international",
      technologies: extractWellfoundTech(title),
      source: "wellfound",
      sourceId: `${company}-${title}`,
      url: linkMatch?.[1] ? `https://wellfound.com${linkMatch[1]}` : undefined,
      postedAt: new Date().toISOString(),
    });
  }

  return jobs;
}

function extractWellfoundTech(title: string): string[] {
  const techs = ["Python", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "SQL", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Rust", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "LLM", "AI", "GPT", "RAG"];
  return techs.filter((t) => title.toLowerCase().includes(t.toLowerCase()));
}
