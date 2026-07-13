import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";

const CATEGORIES = ["software-dev", "data", "devops", "product", "design"];

export async function fetchRemotive(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();
  const allJobs: RawJobData[] = [];
  let lastError: string | undefined;

  for (const category of CATEGORIES) {
    try {
      const res = await fetch(`https://remotive.com/api/remote-jobs?category=${category}&limit=100`, {
        headers: { "User-Agent": "Prism/1.0" },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        lastError = `Remotive ${category}: ${res.status}`;
        continue;
      }

      const data = await res.json();

      if (!data?.jobs || !Array.isArray(data.jobs)) continue;

      for (const job of data.jobs) {
        if (!job.title || !job.company_name) continue;

        const desc = `${job.description || ""} ${(job.salary || "")}`;
        const lower = `${job.title} ${desc}`.toLowerCase();
        let locationType: "remote" | "hybrid" | "onsite" = "remote";
        if (lower.includes("hybrid")) locationType = "hybrid";
        if (lower.includes("onsite") || lower.includes("on-site")) locationType = "onsite";

        const locStr = job.candidate_required_location || "Remote";

        allJobs.push({
          title: job.title,
          company: job.company_name,
          description: desc,
          location: locStr,
          locationType,
          contractType: "international",
          salaryMin: job.salary_min ? parseInt(job.salary_min) : undefined,
          salaryMax: job.salary_max ? parseInt(job.salary_max) : undefined,
          currency: job.salary_currency || undefined,
          technologies: extractRemotiveTech(job.title, desc),
          source: "remotive",
          sourceId: String(job.id),
          url: job.url || job.application_link || undefined,
          postedAt: job.publication_date ? new Date(job.publication_date).toISOString() : new Date().toISOString(),
        });
      }
    } catch (err: any) {
      lastError = err.message;
    }
  }

  const result = await saveJobs(allJobs, "Remotive");
  await logConnectorRun("Remotive", result, lastError, Date.now() - start);
  return result;
}

function extractRemotiveTech(title: string, _desc: string): string[] {
  const techs = ["Python", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "SQL", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Rust", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "LLM", "AI", "GPT", "RAG"];
  return techs.filter((t) => title.toLowerCase().includes(t.toLowerCase()));
}
