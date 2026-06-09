import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";

const SEARCH_TERMS = [
  "desenvolvedor", "desenvolvedora", "data science", "cientista de dados",
  "analista de dados", "engenharia de dados", "full stack", "machine learning",
  "estagio tecnologia", "junior tecnologia", "software engineer",
  "back-end", "front-end", "devops", "analytics", "inteligencia artificial",
];

export async function fetchGupy(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();
  const allJobs: RawJobData[] = [];
  let lastError: string | undefined;

  for (const term of SEARCH_TERMS) {
    try {
      const url = `https://portal.api.gupy.io/api/job?jobName=${encodeURIComponent(term)}&limit=50`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;

      const body = await res.json();
      const items = body?.data || [];

      if (!Array.isArray(items)) continue;

      for (const job of items) {
        if (!job.name || !job.company?.name) continue;

        const lower = `${job.name} ${job.description || ""}`.toLowerCase();
        let locationType: "remote" | "hybrid" | "onsite" = "onsite";
        if (lower.includes("remoto") || lower.includes("home office") || lower.includes("100% remoto")) locationType = "remote";
        else if (lower.includes("hibrido") || lower.includes("híbrido") || lower.includes("presencial+remoto")) locationType = "hybrid";

        const locStr = job.remote ? "Remoto" : job.location || "Brasil";

        allJobs.push({
          title: job.name,
          company: job.company.name,
          description: job.description || "",
          location: locStr,
          locationType,
          contractType: "clt",
          technologies: extractGupyTech(job.name, job.description || ""),
          tags: [],
          source: "gupy",
          sourceId: String(job.id || `${job.name}-${job.company.name}`),
          url: job.jobUrl || `https://portal.api.gupy.io/job/${job.id}`,
          postedAt: job.publishedAt ? new Date(job.publishedAt).toISOString() : undefined,
        });
      }
    } catch (err: any) {
      lastError = err.message;
    }
  }

  const result = await saveJobs(allJobs, "Gupy");
  await logConnectorRun("Gupy", result, lastError, Date.now() - start);
  return result;
}

function extractGupyTech(title: string, desc: string): string[] {
  const techs = ["Python", "SQL", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "R", "Analytics", "Excel", "Power BI", "LLM", "AI"];
  const text = `${title} ${desc}`.toLowerCase();
  return techs.filter((t) => text.includes(t.toLowerCase()));
}
