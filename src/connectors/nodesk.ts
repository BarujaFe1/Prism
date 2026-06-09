import { XMLParser } from "fast-xml-parser";
import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";

export async function fetchNodesk(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();

  try {
    const res = await fetch("https://nodesk.co/remote-jobs/feed/", {
      headers: { "User-Agent": "Prism/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`Nodesk: ${res.status}`);

    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item;
    if (!items || !Array.isArray(items)) throw new Error("Nodesk: invalid RSS");

    const jobsData: RawJobData[] = [];

    for (const item of items) {
      const title = item.title || "";
      const link = item.link || "";
      if (!title || !link) continue;

      const desc = item.description || "";
      const categories = item.category || [];
      const cats = Array.isArray(categories) ? categories : [categories];
      const catLower = cats.join(" ").toLowerCase();

      if (catLower.includes("design") && !catLower.includes("developer") && !catLower.includes("engineering")) continue;

      jobsData.push({
        title: title.replace(/<[^>]*>/g, "").trim(),
        company: extractNodeskCompany(item),
        description: desc.replace(/<[^>]*>/g, "").trim(),
        location: "Remote",
        locationType: "remote",
        contractType: "international",
        technologies: extractNodeskTech(title, desc),
        source: "nodesk",
        sourceId: link,
        url: link,
        postedAt: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
      });
    }

    const result = await saveJobs(jobsData, "Nodesk");
    await logConnectorRun("Nodesk", result, undefined, Date.now() - start);
    return result;
  } catch (err: any) {
    await logConnectorRun("Nodesk", { new: 0, duplicate: 0, total: 0 }, err.message, Date.now() - start);
    return { new: 0, duplicate: 0, total: 0 };
  }
}

function extractNodeskCompany(item: any): string {
  const title = item.title || "";
  const match = title.match(/at\s+(.+?)(?:\s+is|\s+hiring|\s+-\s+|$)/i);
  if (match) return match[1].trim();
  return "Unknown";
}

function extractNodeskTech(title: string, desc: string): string[] {
  const techs = ["Python", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "SQL", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Rust", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "LLM", "AI", "GPT", "RAG"];
  const text = `${title} ${desc}`.toLowerCase();
  return techs.filter((t) => text.includes(t.toLowerCase()));
}
