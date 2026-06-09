import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";

const COMPANIES = [
  { slug: "cloudwalk", name: "CloudWalk" },
  { slug: "pagarme", name: "Pagar.me" },
  { slug: "contabilizei", name: "Contabilizei" },
  { slug: "neon", name: "Neon" },
  { slug: "omie", name: "Omie" },
];

export async function fetchLever(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();
  const allJobs: RawJobData[] = [];
  let lastError: string | undefined;

  for (const company of COMPANIES) {
    try {
      const res = await fetch(
        `https://api.lever.co/v0/postings/${company.slug}?mode=json`,
        {
          headers: { "User-Agent": "Prism/1.0" },
          signal: AbortSignal.timeout(10000),
        }
      );
      if (!res.ok) continue;

      const data = await res.json();
      const items = Array.isArray(data) ? data : [];

      for (const job of items) {
        const title = job.text || "";
        if (!title) continue;

        allJobs.push({
          title,
          company: company.name,
          description: job.descriptionPlain || job.description || "",
          location: job.categories?.location || "Remote",
          locationType: "remote",
          contractType: "clt",
          technologies: extractTech(title, job.descriptionPlain || ""),
          source: "lever",
          sourceId: job.id || String(job.hostedUrl || ""),
          url: job.hostedUrl || `https://jobs.lever.co/${company.slug}`,
          postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
        });
      }
    } catch (err: any) {
      lastError = err.message;
    }
  }

  const result = await saveJobs(allJobs, "Lever");
  await logConnectorRun("Lever", result, lastError, Date.now() - start);
  return result;
}

function extractTech(title: string, content: string): string[] {
  const techs = ["Python", "SQL", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "R", "Statistics", "Analytics", "Excel", "LLM", "AI", "GPT", "RAG", "LangChain"];
  const text = `${title} ${content}`;
  return techs.filter((t) => text.toLowerCase().includes(t.toLowerCase()));
}
