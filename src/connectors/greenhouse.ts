import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";

const COMPANIES = [
  "nubank", "stonepagamentos", "getninjas", "dock", "creditas",
  "quintoandar", "warren", "toroinvestimentos",
];

export async function fetchGreenhouse(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();
  const allJobs: RawJobData[] = [];
  let lastError: string | undefined;

  for (const company of COMPANIES) {
    try {
      const res = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`,
        {
          headers: { "User-Agent": "Prism/1.0" },
          signal: AbortSignal.timeout(10000),
        }
      );
      if (!res.ok) continue;

      const data = await res.json();
      const items = data?.jobs || [];
      if (!Array.isArray(items)) continue;

      for (const job of items) {
        const title = job.title || "";
        if (!title) continue;

        allJobs.push({
          title,
          company: company.charAt(0).toUpperCase() + company.slice(1),
          description: job.content || "",
          location: job.offices?.[0]?.name || job.location?.name || "Remote",
          locationType: "remote",
          contractType: "clt",
          technologies: extractTech(title, job.content || ""),
          source: "greenhouse",
          sourceId: String(job.id),
          url: job.absolute_url || `https://boards.greenhouse.io/${company}/jobs/${job.id}`,
          postedAt: job.updated_at ? new Date(job.updated_at).toISOString() : undefined,
        });
      }
    } catch (err: any) {
      lastError = err.message;
    }
  }

  const result = await saveJobs(allJobs, "Greenhouse");
  await logConnectorRun("Greenhouse", result, lastError, Date.now() - start);
  return result;
}

function extractTech(title: string, content: string): string[] {
  const techs = ["Python", "SQL", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "R", "Statistics", "Analytics", "Excel", "LLM", "AI", "GPT", "RAG", "LangChain"];
  const text = `${title} ${content}`;
  return techs.filter((t) => text.toLowerCase().includes(t.toLowerCase()));
}
