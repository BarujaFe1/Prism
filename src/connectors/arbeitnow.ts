import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";

export async function fetchArbeitnow(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();

  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api", {
      headers: { "User-Agent": "Prism/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`Arbeitnow: ${res.status}`);

    const body = await res.json();
    const items = body?.data || [];
    if (!Array.isArray(items)) throw new Error("Arbeitnow: invalid response");

    const jobsData: RawJobData[] = [];

    for (const job of items) {
      if (!job.title || !job.company_name) continue;

      const slug = job.slug || "";
      const lower = `${job.title} ${job.tags?.join(" ") || ""} ${job.description || ""}`.toLowerCase();
      let locationType: "remote" | "hybrid" | "onsite" = "remote";
      if (lower.includes("onsite") || lower.includes("on-site") || lower.includes("presencial")) locationType = "onsite";
      else if (lower.includes("hybrid") || lower.includes("hibrido")) locationType = "hybrid";

      const isRemote = job.remote === true || job.remote === "true" || lower.includes("remote") || lower.includes("remoto");

      jobsData.push({
        title: job.title,
        company: job.company_name,
        description: job.description || "",
        location: job.location || (isRemote ? "Remote" : "Europe"),
        locationType: isRemote ? "remote" : locationType,
        contractType: "international",
        salaryMin: job.salary_min || undefined,
        salaryMax: job.salary_max || undefined,
        currency: job.salary_currency || "EUR",
        technologies: extractArbeitnowTech(job.title, (job.tags || []).join(" "), job.description || ""),
        source: "arbeitnow",
        sourceId: slug || String(job.id || job.title),
        url: job.url || `https://www.arbeitnow.com/jobs/${slug}`,
        postedAt: job.created_at ? new Date(job.created_at).toISOString() : undefined,
      });
    }

    const result = await saveJobs(jobsData, "Arbeitnow");
    await logConnectorRun("Arbeitnow", result, undefined, Date.now() - start);
    return result;
  } catch (err: any) {
    await logConnectorRun("Arbeitnow", { new: 0, duplicate: 0, total: 0 }, err.message, Date.now() - start);
    return { new: 0, duplicate: 0, total: 0 };
  }
}

function extractArbeitnowTech(title: string, tagsStr: string, desc: string): string[] {
  const techs = ["Python", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "SQL", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Rust", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "LLM", "AI", "GPT", "RAG", "LangChain", "Azure", "GCP", "DevOps", "Kafka", "Redis"];
  const text = `${title} ${tagsStr} ${desc}`.toLowerCase();
  return techs.filter((t) => text.includes(t.toLowerCase()));
}
