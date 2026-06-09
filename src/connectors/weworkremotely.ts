import { XMLParser } from "fast-xml-parser";
import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";

const FEEDS = [
  "https://weworkremotely.com/categories/remote-data-science-jobs.rss",
  "https://weworkremotely.com/categories/remote-programming-jobs.rss",
  "https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss",
  "https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss",
  "https://weworkremotely.com/categories/remote-design-jobs.rss",
  "https://weworkremotely.com/categories/remote-product-jobs.rss",
];

export async function fetchWeWorkRemotely(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();
  const allJobs: RawJobData[] = [];
  let lastError: string | undefined;

  for (const feedUrl of FEEDS) {
    try {
      const res = await fetch(feedUrl, {
        headers: { "User-Agent": "Prism/1.0 (job tracker; contact@prism.app)" },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) continue;

      const xml = await res.text();
      const parser = new XMLParser({ ignoreAttributes: false });
      const parsed = parser.parse(xml);

      const items = parsed?.rss?.channel?.item;
      if (!items || !Array.isArray(items)) continue;

      for (const item of items) {
        const title = item.title || "";
        const desc = item.description || "";
        const link = item.link || "";

        if (!title || !link) continue;

        const company = extractCompany(title, desc);
        const location = "Remote";
        const lower = `${title} ${desc}`.toLowerCase();

        let locationType: "remote" | "hybrid" | "onsite" = "remote";
        if (lower.includes("hybrid") || lower.includes("híbrido")) locationType = "hybrid";
        if (lower.includes("onsite") || lower.includes("presencial")) locationType = "onsite";

        allJobs.push({
          title: cleanTitle(title),
          company,
          description: stripHtml(desc),
          location,
          locationType,
          contractType: "international",
          technologies: extractTech(title, desc),
          source: "weworkremotely",
          sourceId: link,
          url: link,
          postedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        });
      }
    } catch (err: any) {
      lastError = err.message;
    }
  }

  const result = await saveJobs(allJobs, "We Work Remotely");
  await logConnectorRun("We Work Remotely", result, lastError, Date.now() - start);
  return result;
}

function cleanTitle(title: string): string {
  return title.replace(/<[^>]*>/g, "").trim();
}

function extractCompany(title: string, desc: string): string {
  const match = title.match(/at\s+(.+?)(?:\s+is|\s+hiring|\s+-\s+|$)/i);
  if (match) return match[1].trim();
  const lines = desc.split("\n").filter(Boolean);
  if (lines.length > 1) return lines[1].trim().replace(/<[^>]*>/g, "").trim();
  return "Unknown Company";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function extractTech(title: string, desc: string): string[] {
  const techs = ["Python", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "SQL", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Rust", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "LLM", "AI", "GPT", "RAG", "LangChain"];
  const text = `${title} ${desc}`;
  return techs.filter((t) => text.toLowerCase().includes(t.toLowerCase()));
}
