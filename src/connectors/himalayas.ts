import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";

const SEARCHES = [
  "typescript", "python", "react", "node.js", "full-stack",
  "data-science", "data-engineer", "machine-learning",
  "software-engineer", "frontend", "backend", "devops",
  "ai-engineer", "analytics", "junior-developer",
];

export async function fetchHimalayas(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();
  const allJobs: RawJobData[] = [];
  let lastError: string | undefined;

  for (const search of SEARCHES) {
    try {
      const url = `https://himalayas.app/jobs/api?query=${encodeURIComponent(search)}&limit=50`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Accept": "application/json" },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) continue;

      const body = await res.json();
      const items = body?.jobs || body?.data || [];

      if (!Array.isArray(items)) continue;

      for (const job of items) {
        if (!job.title) continue;

        const title = job.title;
        const company = job.companyName || "Unknown";
        const lower = `${title} ${job.description || ""}`.toLowerCase();

        let locationType: "remote" | "hybrid" | "onsite" = "remote";
        if (lower.includes("hybrid")) locationType = "hybrid";
        if (lower.includes("onsite") || lower.includes("on-site") || lower.includes("in-office")) locationType = "onsite";

        const location = (job.locationRestrictions && job.locationRestrictions.length > 0) ? job.locationRestrictions.join(", ") : "Remote";

        let postedAt: string | undefined;
        if (job.pubDate) {
          const ts = typeof job.pubDate === "number" ? job.pubDate * 1000 : new Date(job.pubDate).getTime();
          postedAt = new Date(ts).toISOString();
        }

        allJobs.push({
          title,
          company,
          description: job.description?.replace(/<[^>]*>/g, "") || "",
          location,
          locationType,
          contractType: mapHimalayasEmploymentType(job.employmentType) as any,
          salaryMin: job.minSalary != null ? Number(job.minSalary) : undefined,
          salaryMax: job.maxSalary != null ? Number(job.maxSalary) : undefined,
          currency: job.currency || "USD",
          technologies: extractHimalayasTech(title, job.description || ""),
          source: "himalayas",
          sourceId: job.guid || `${company}-${title}`,
          url: job.applicationLink || job.guid || "",
          postedAt,
        });
      }
    } catch (err: any) {
      lastError = err.message;
    }
  }

  const result = await saveJobs(allJobs, "Himalayas");
  await logConnectorRun("Himalayas", result, lastError, Date.now() - start);
  return result;
}

function mapHimalayasEmploymentType(type: string | null): string {
  if (!type) return "international";
  const t = type.toLowerCase();
  if (t.includes("full") || t.includes("permanent")) return "international";
  if (t.includes("contract") || t.includes("freelance") || t.includes("temporary")) return "contract";
  if (t.includes("part")) return "part-time";
  if (t.includes("intern")) return "internship";
  return "international";
}

function extractHimalayasTech(title: string, desc: string): string[] {
  const techs = ["Python", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "SQL", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Rust", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "LLM", "AI", "GPT", "RAG", "LangChain", "Azure", "GCP", "Kafka", "Redis", "MongoDB"];
  const text = `${title} ${desc}`.toLowerCase();
  return techs.filter((t) => text.includes(t.toLowerCase()));
}
