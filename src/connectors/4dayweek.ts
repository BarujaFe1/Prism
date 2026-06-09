import { XMLParser } from "fast-xml-parser";
import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";

export async function fetch4DayWeek(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();

  try {
    const res = await fetch("https://4dayweek.io/api/jobs", {
      headers: { "User-Agent": "Prism/1.0", "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`4 day week: ${res.status}`);

    const data = await res.json();
    const items = Array.isArray(data) ? data : data?.jobs || data?.data || [];

    const jobsData: RawJobData[] = [];

    for (const job of items) {
      if (!job.title || !job.company) continue;

      const lower = `${job.title} ${job.description || ""}`.toLowerCase();
      let locationType: "remote" | "hybrid" | "onsite" = "remote";
      if (lower.includes("hybrid")) locationType = "hybrid";
      if (lower.includes("onsite") || lower.includes("on-site")) locationType = "onsite";

      jobsData.push({
        title: job.title,
        company: typeof job.company === "string" ? job.company : job.company?.name || "Unknown",
        description: job.description || "",
        location: job.location || "Remote",
        locationType,
        contractType: "international",
        salaryMin: job.salary_min || job.salaryMin || undefined,
        salaryMax: job.salary_max || job.salaryMax || undefined,
        currency: job.currency || "USD",
        technologies: extract4DWTech(job.title, job.description || ""),
        source: "4dayweek",
        sourceId: job.id || job.slug || `${job.company}-${job.title}`,
        url: job.url || job.apply_url || job.link || `https://4dayweek.io/jobs/${job.slug}`,
        postedAt: job.published_at || job.createdAt ? new Date(job.published_at || job.createdAt).toISOString() : undefined,
      });
    }

    const result = await saveJobs(jobsData, "4 Day Week");
    await logConnectorRun("4 Day Week", result, undefined, Date.now() - start);
    return result;
  } catch (err: any) {
    await logConnectorRun("4 Day Week", { new: 0, duplicate: 0, total: 0 }, err.message, Date.now() - start);
    return { new: 0, duplicate: 0, total: 0 };
  }
}

function extract4DWTech(title: string, desc: string): string[] {
  const techs = ["Python", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "SQL", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Rust", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "LLM", "AI", "GPT", "RAG", "LangChain"];
  const text = `${title} ${desc}`.toLowerCase();
  return techs.filter((t) => text.includes(t.toLowerCase()));
}
