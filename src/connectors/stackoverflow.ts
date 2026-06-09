import { XMLParser } from "fast-xml-parser";
import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";

const QUERIES = [
  "typescript+python+node+react",
  "python+data+science+sql",
  "full+stack+developer+react",
  "machine+learning+engineer",
  "data+engineer+sql+python",
  "software+engineer+typescript",
  "junior+developer+python",
  "ai+engineer+llm",
  "frontend+react+typescript",
  "backend+node+python",
];

export async function fetchStackOverflow(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();
  const allJobs: RawJobData[] = [];
  let lastError: string | undefined;

  for (const query of QUERIES) {
    try {
      const url = `https://stackoverflow.com/jobs/feed?q=${encodeURIComponent(query)}&r=true&sort=p`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Prism/1.0" },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;

      const xml = await res.text();
      const parser = new XMLParser({ ignoreAttributes: false });
      const parsed = parser.parse(xml);
      const items = parsed?.rss?.channel?.item;
      if (!items || !Array.isArray(items)) continue;

      for (const item of items) {
        const title = item.title || "";
        const link = item.link || "";
        if (!title || !link) continue;

        const desc = item.description || "";
        const lower = `${title} ${desc}`.toLowerCase();

        let locationType: "remote" | "hybrid" | "onsite" = "remote";
        if (lower.includes("hybrid")) locationType = "hybrid";
        if (lower.includes("onsite") || lower.includes("on-site")) locationType = "onsite";

        const location = extractSOLocation(item);

        allJobs.push({
          title: cleanSOTitle(title),
          company: extractSOCompany(item, title),
          description: stripHtml(desc),
          location,
          locationType,
          contractType: "international",
          technologies: extractSOTech(title, desc),
          source: "stackoverflow",
          sourceId: link,
          url: link,
          postedAt: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
        });
      }
    } catch (err: any) {
      lastError = err.message;
    }
  }

  const result = await saveJobs(allJobs, "Stack Overflow");
  await logConnectorRun("Stack Overflow", result, lastError, Date.now() - start);
  return result;
}

function cleanSOTitle(title: string): string {
  return title.replace(/<[^>]*>/g, "").trim();
}

function extractSOCompany(item: any, title: string): string {
  const dc = item["dc:creator"];
  if (dc) return dc.trim();
  const match = title.match(/at\s+(.+?)(?:\s+\(|$)/i);
  if (match) return match[1].trim();
  return "Unknown";
}

function extractSOLocation(item: any): string {
  const loc = item["a10:location"] || item.location;
  if (loc) return loc;
  return "Remote";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function extractSOTech(title: string, desc: string): string[] {
  const techs = ["Python", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "SQL", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Rust", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "LLM", "AI", "GPT", "RAG", "LangChain", "Azure", "GCP", "Kafka", "Redis", "MongoDB", "C#", "Java", "Git", "Linux"];
  const text = `${title} ${desc}`.toLowerCase();
  return techs.filter((t) => text.includes(t.toLowerCase()));
}
