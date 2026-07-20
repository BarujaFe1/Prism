import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";
import { inferExperienceAndContract } from "./job-infer";

/** Public Ashby job board API — known tech/product company slugs. */
const BOARDS = [
  { slug: "vercel", name: "Vercel" },
  { slug: "supabase", name: "Supabase" },
  { slug: "linear", name: "Linear" },
  { slug: "notion", name: "Notion" },
  { slug: "ramp", name: "Ramp" },
  { slug: "resend", name: "Resend" },
  { slug: "clickup", name: "ClickUp" },
  { slug: "hashicorp", name: "HashiCorp" },
  { slug: "databricks", name: "Databricks" },
  { slug: "openai", name: "OpenAI" },
  { slug: "anthropic", name: "Anthropic" },
  { slug: "cursor", name: "Cursor" },
];

export async function fetchAshby(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();
  const allJobs: RawJobData[] = [];
  let lastError: string | undefined;

  for (const board of BOARDS) {
    try {
      const res = await fetch(
        `https://api.ashbyhq.com/posting-api/job-board/${board.slug}?includeCompensation=true`,
        {
          headers: { "User-Agent": "Prism/1.0 (personal job radar)", Accept: "application/json" },
          signal: AbortSignal.timeout(12000),
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const items = data?.jobs || [];
      if (!Array.isArray(items)) continue;

      for (const job of items) {
        const title = job.title || "";
        if (!title) continue;
        const desc = job.descriptionPlain || job.descriptionHtml || "";
        const loc =
          job.location ||
          (Array.isArray(job.address?.postalAddress)
            ? job.address.postalAddress.join(", ")
            : "") ||
          "Remote";
        const inferred = inferExperienceAndContract(title, desc);
        const isRemote =
          job.isRemote === true ||
          /remote|remoto|anywhere/i.test(String(loc)) ||
          /remote|remoto/i.test(title);

        allJobs.push({
          title,
          company: board.name,
          description: typeof desc === "string" ? desc : "",
          location: String(loc),
          locationType: isRemote ? "remote" : "hybrid",
          contractType: inferred.contractType,
          experienceLevel: inferred.experienceLevel,
          technologies: extractTech(title, String(desc)),
          source: "ashby",
          sourceId: String(job.id || job.jobUrl || `${board.slug}-${title}`),
          url: job.jobUrl || `https://jobs.ashbyhq.com/${board.slug}`,
          postedAt: job.publishedAt ? new Date(job.publishedAt).toISOString() : undefined,
        });
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  const result = await saveJobs(allJobs, "Ashby");
  await logConnectorRun("Ashby", result, lastError, Date.now() - start);
  return result;
}

function extractTech(title: string, content: string): string[] {
  const techs = [
    "Python",
    "SQL",
    "TypeScript",
    "JavaScript",
    "React",
    "Node.js",
    "Next.js",
    "PostgreSQL",
    "Docker",
    "AWS",
    "Go",
    "GraphQL",
    "Full-Stack",
    "Analytics",
    "LLM",
    "AI",
  ];
  const text = `${title} ${content}`.toLowerCase();
  return techs.filter((t) => text.includes(t.toLowerCase()));
}
