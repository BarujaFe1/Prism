import { XMLParser } from "fast-xml-parser";
import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";

const SEARCH_QUERIES = [
  "data+scientist+remote",
  "software+engineer+remote",
  "full+stack+developer+remote",
  "data+engineer+remote",
  "machine+learning+engineer+remote",
  "python+developer+remote",
  "frontend+developer+remote",
  "backend+developer+remote",
  "ai+engineer+remote",
  "analytics+remote",
];

export async function fetchLinkedInRSS(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();
  const allJobs: RawJobData[] = [];
  let lastError: string | undefined;

  for (const query of SEARCH_QUERIES) {
    try {
      const url = `https://www.linkedin.com/jobs/search/?keywords=${query}&location=Remote&f_WT=2`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;

      const html = await res.text();
      const jobs = parseLinkedInHTML(html, query);

      for (const job of jobs) {
        allJobs.push(job);
      }
    } catch (err: any) {
      lastError = err.message;
    }
  }

  const result = await saveJobs(allJobs, "LinkedIn RSS");
  await logConnectorRun("LinkedIn RSS", result, lastError, Date.now() - start);
  return result;
}

function parseLinkedInHTML(html: string, query: string): RawJobData[] {
  const jobs: RawJobData[] = [];

  const baseCardRegex = /<li[^>]*class="[^"]*jobs-search-results__list-item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  let match;

  while ((match = baseCardRegex.exec(html)) !== null) {
    const card = match[1];
    if (!card) continue;

    const titleMatch = card.match(/<a[^>]*aria-label="([^"]+)/);
    const companyMatch = card.match(/class="[^"]*job-card-container__company-name[^"]*"[^>]*>([^<]+)</);
    const locationMatch = card.match(/class="[^"]*job-card-container__metadata-wrapper[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const linkMatch = card.match(/href="([^"]*\/jobs\/view\/[^"]+)"/);

    const title = titleMatch?.[1]?.trim() || "";
    const company = companyMatch?.[1]?.trim() || "Unknown";
    const location = locationMatch ? stripTags(locationMatch[1]).trim() : "Remote";
    const url = linkMatch?.[1] ? `https://www.linkedin.com${linkMatch[1]}` : "";

    if (!title || !company) continue;

    const lower = `${title} ${query}`.toLowerCase();
    let locationType: "remote" | "hybrid" | "onsite" = "remote";
    if (lower.includes("hybrid")) locationType = "hybrid";
    if (lower.includes("onsite") || lower.includes("presencial")) locationType = "onsite";

    jobs.push({
      title,
      company,
      description: `LinkedIn listing: ${title} at ${company}`,
      location,
      locationType,
      contractType: "international",
      technologies: extractLinkedInTech(title, query),
      source: "linkedin_rss",
      sourceId: url || `${company}-${title}`,
      url: url || undefined,
      postedAt: new Date().toISOString(),
    });
  }

  return jobs;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function extractLinkedInTech(title: string, query: string): string[] {
  const techs = ["Python", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "SQL", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Rust", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "LLM", "AI", "GPT", "RAG"];
  const text = `${title} ${query}`.toLowerCase();
  return techs.filter((t) => text.includes(t.toLowerCase()));
}
