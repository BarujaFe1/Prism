import { XMLParser } from "fast-xml-parser";
import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";

export async function fetchRemoteCo(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();

  try {
    const res = await fetch("https://remote.co/remote-jobs/feed/", {
      headers: { "User-Agent": "Prism/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`Remote.co: ${res.status}`);

    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item;
    if (!items || !Array.isArray(items)) throw new Error("Remote.co: invalid RSS");

    const jobsData: RawJobData[] = [];

    for (const item of items) {
      const title = item.title || "";
      const link = item.link || "";
      if (!title || !link) continue;

      const desc = item.description || "";
      const categories = item.category || [];
      const cats = Array.isArray(categories) ? categories : [categories];
      const catLower = cats.join(" ").toLowerCase();

      if (catLower.includes("design") || catLower.includes("marketing") || catLower.includes("writing") || catLower.includes("customer")) continue;

      jobsData.push({
        title: cleanRCTitle(title),
        company: extractRCCompany(item),
        description: stripHtml(desc),
        location: "Remote",
        locationType: "remote",
        contractType: "international",
        technologies: extractRCTech(title, desc),
        source: "remote-co",
        sourceId: link,
        url: link,
        postedAt: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
      });
    }

    const result = await saveJobs(jobsData, "Remote.co");
    await logConnectorRun("Remote.co", result, undefined, Date.now() - start);
    return result;
  } catch (err: any) {
    await logConnectorRun("Remote.co", { new: 0, duplicate: 0, total: 0 }, err.message, Date.now() - start);
    return { new: 0, duplicate: 0, total: 0 };
  }
}

function cleanRCTitle(title: string): string {
  return title.replace(/<[^>]*>/g, "").trim();
}

function extractRCCompany(item: any): string {
  const title = item.title || "";
  const match = title.match(/at\s+(.+?)(?:\s+is|\s+hiring|\s+-\s+|$)/i);
  if (match) return match[1].trim();
  return "Remote.co Company";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function extractRCTech(title: string, desc: string): string[] {
  const techs = ["Python", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "SQL", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Rust", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "LLM", "AI", "GPT", "RAG", "LangChain"];
  const text = `${title} ${desc}`.toLowerCase();
  return techs.filter((t) => text.includes(t.toLowerCase()));
}
