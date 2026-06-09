import { XMLParser } from "fast-xml-parser";
import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";

const CATEGORIES = [
  "software-development", "data-science", "devops-sysadmin",
  "product-management", "design-creative", "marketing",
];

export async function fetchJobicy(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();
  const allJobs: RawJobData[] = [];
  let lastError: string | undefined;

  for (const cat of CATEGORIES) {
    try {
      const url = `https://jobicy.com/?feed=job_feed&job_categories=${cat}&job_types=remote`;
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
        const desc = item.description || "";
        const link = item.link || "";
        if (!title || !link) continue;

        const lower = `${title} ${desc}`.toLowerCase();
        let locationType: "remote" | "hybrid" | "onsite" = "remote";
        if (lower.includes("hybrid") || lower.includes("hibrido")) locationType = "hybrid";
        if (lower.includes("onsite") || lower.includes("presencial") || lower.includes("on-site")) locationType = "onsite";

        const companyMatch = title.match(/at\s+(.+?)(?:\s+is|\s+hiring|\s+-\s+|$)/i);

        allJobs.push({
          title: cleanJobicyTitle(title),
          company: companyMatch?.[1]?.trim() || extractCompanyFromDesc(desc),
          description: stripHtml(desc),
          location: "Remote",
          locationType,
          contractType: "international",
          technologies: extractJobicyTech(title, desc),
          source: "jobicy",
          sourceId: link,
          url: link,
          postedAt: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
        });
      }
    } catch (err: any) {
      lastError = err.message;
    }
  }

  const result = await saveJobs(allJobs, "Jobicy");
  await logConnectorRun("Jobicy", result, lastError, Date.now() - start);
  return result;
}

function cleanJobicyTitle(title: string): string {
  return title.replace(/<[^>]*>/g, "").trim();
}

function extractCompanyFromDesc(desc: string): string {
  const lines = stripHtml(desc).split("\n").filter(Boolean);
  return lines.length > 0 ? lines[0].trim() : "Unknown Company";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function extractJobicyTech(title: string, desc: string): string[] {
  const techs = ["Python", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "SQL", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Rust", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "LLM", "AI", "GPT", "RAG"];
  const text = `${title} ${desc}`.toLowerCase();
  return techs.filter((t) => text.includes(t.toLowerCase()));
}
