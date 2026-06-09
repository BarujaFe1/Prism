import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";

const QUERIES = [
  "vaga+desenvolvedor+typescript+remoto",
  "vaga+data+science+junior+remoto",
  "vaga+full+stack+developer+remoto",
  "vaga+python+developer+junior+remoto",
  "vaga+machine+learning+estagio",
  "vaga+analista+dados+remoto",
  "vaga+engenharia+dados+junior",
  "software+engineer+remote+junior",
  "data+analyst+remote+entry+level",
  "frontend+developer+remote+junior",
];

const JOBS_BASE = "https://www.google.com/search?q=";

export async function fetchGoogleJobs(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();
  const allJobs: RawJobData[] = [];
  let lastError: string | undefined;

  let batchCount = 0;
  for (const query of QUERIES) {
    if (batchCount >= 5) break;
    batchCount++;

    try {
      const url = `${JOBS_BASE}${encodeURIComponent(query)}&ibp=htl;jobs`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;

      const html = await res.text();
      const jobs = parseGoogleJobsHTML(html, query);

      for (const job of jobs) {
        allJobs.push(job);
      }

      await new Promise((r) => setTimeout(r, 2000));
    } catch (err: any) {
      lastError = err.message;
    }
  }

  const result = await saveJobs(allJobs, "Google Jobs");
  await logConnectorRun("Google Jobs", result, lastError, Date.now() - start);
  return result;
}

function parseGoogleJobsHTML(html: string, query: string): RawJobData[] {
  const jobs: RawJobData[] = [];
  const seen = new Set<string>();

  const titleRegex = /<div[^>]*class="[^"]*jobTitle[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let match;

  while ((match = titleRegex.exec(html)) !== null) {
    const block = match[1];
    if (!block) continue;

    const title = cleanGoogleText(block);
    if (!title || title.length < 5) continue;

    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const lower = `${title} ${query}`.toLowerCase();
    let locationType: "remote" | "hybrid" | "onsite" = "remote";
    if (lower.includes("hybrid") || lower.includes("hibrido")) locationType = "hybrid";
    if (lower.includes("onsite") || lower.includes("presencial") || lower.includes("on-site")) locationType = "onsite";

    const isInternacional = !lower.includes("brasil") && !lower.includes("sp") && !lower.includes("são paulo") && !lower.includes("rj") && !lower.includes("remoto");

    jobs.push({
      title,
      company: "Google Jobs",
      description: `Vaga encontrada via Google Jobs. Query: ${query}. Candidate-se no link original.`,
      location: isInternacional ? "Remote - International" : "Remoto - Brasil",
      locationType,
      contractType: isInternacional ? "international" : "clt",
      technologies: extractGJTech(title, query),
      source: "google_jobs",
      sourceId: `${query}-${key}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(title)}&ibp=htl;jobs`,
      postedAt: new Date().toISOString(),
    });
  }

  return jobs;
}

function cleanGoogleText(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function extractGJTech(title: string, query: string): string[] {
  const techs = ["Python", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "SQL", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Rust", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "LLM", "AI", "GPT", "RAG"];
  const text = `${title} ${query}`.toLowerCase();
  return techs.filter((t) => text.includes(t.toLowerCase()));
}
