import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";

const SEARCH_TERMS = [
  "desenvolvedor", "data science", "full stack", "machine learning",
  "analista de dados", "engenharia de dados", "software engineer",
  "estagio", "junior", "frontend", "backend", "devops",
];

export async function fetchRevelo(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();
  const allJobs: RawJobData[] = [];
  let lastError: string | undefined;

  for (const term of SEARCH_TERMS) {
    try {
      const url = `https://api.revelo.com.br/jobs?search=${encodeURIComponent(term)}&remote=true&limit=30`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const items = data?.jobs || data?.data || [];

      if (!Array.isArray(items)) continue;

      for (const job of items) {
        if (!job.title || !job.company?.name) continue;

        const lower = `${job.title} ${job.description || ""}`.toLowerCase();
        let locationType: "remote" | "hybrid" | "onsite" = "remote";
        if (lower.includes("hibrido") || lower.includes("híbrido") || lower.includes("hybrid")) locationType = "hybrid";
        if (lower.includes("presencial") || lower.includes("onsite")) locationType = "onsite";

        allJobs.push({
          title: job.title,
          company: job.company.name,
          description: job.description || "",
          location: job.location || "Remoto",
          locationType,
          contractType: "clt",
          salaryMin: job.salary_min || job.minSalary || undefined,
          salaryMax: job.salary_max || job.maxSalary || undefined,
          currency: "BRL",
          technologies: extractReveloTech(job.title, job.description || ""),
          tags: job.skills || [],
          source: "revelo",
          sourceId: String(job.id || `${job.title}-${job.company.name}`),
          url: job.url || job.applyUrl || `https://www.revelo.com.br/vaga/${job.slug || job.id}`,
          postedAt: job.published_at || job.createdAt ? new Date(job.published_at || job.createdAt).toISOString() : undefined,
        });
      }
    } catch (err: any) {
      lastError = err.message;
    }
  }

  const result = await saveJobs(allJobs, "Revelo");
  await logConnectorRun("Revelo", result, lastError, Date.now() - start);
  return result;
}

function extractReveloTech(title: string, desc: string): string[] {
  const techs = ["Python", "SQL", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "R", "Analytics", "Excel", "Power BI", "LLM", "AI"];
  const text = `${title} ${desc}`.toLowerCase();
  return techs.filter((t) => text.includes(t.toLowerCase()));
}
