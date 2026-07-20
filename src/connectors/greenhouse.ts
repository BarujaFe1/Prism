import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";
import { inferExperienceAndContract } from "./job-infer";

/** Greenhouse board tokens (public boards API). Expanded BR + product tech. */
const COMPANIES = [
  { slug: "nubank", name: "Nubank" },
  { slug: "stonepagamentos", name: "Stone" },
  { slug: "getninjas", name: "GetNinjas" },
  { slug: "dock", name: "Dock" },
  { slug: "creditas", name: "Creditas" },
  { slug: "quintoandar", name: "QuintoAndar" },
  { slug: "warren", name: "Warren" },
  { slug: "toroinvestimentos", name: "Toro" },
  { slug: "hotmart", name: "Hotmart" },
  { slug: "loft", name: "Loft" },
  { slug: "vtex", name: "VTEX" },
  { slug: "gympass", name: "Wellhub" },
  { slug: "rdstation", name: "RD Station" },
  { slug: "results", name: "Results" },
  { slug: "hashlab", name: "Hash" },
  { slug: "neon", name: "Neon" },
  { slug: "madeiramadeira", name: "MadeiraMadeira" },
  { slug: "olxbr", name: "OLX" },
  { slug: "wildlife", name: "Wildlife" },
  { slug: "stripe", name: "Stripe" },
  { slug: "shopify", name: "Shopify" },
  { slug: "datadog", name: "Datadog" },
  { slug: "cloudflare", name: "Cloudflare" },
  { slug: "figma", name: "Figma" },
  { slug: "airbnb", name: "Airbnb" },
];

export async function fetchGreenhouse(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();
  const allJobs: RawJobData[] = [];
  let lastError: string | undefined;

  for (const company of COMPANIES) {
    try {
      const res = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${company.slug}/jobs?content=true`,
        {
          headers: { "User-Agent": "Prism/1.0 (personal job radar)" },
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
        const content = job.content || "";
        const loc = job.offices?.[0]?.name || job.location?.name || "Remote";
        const inferred = inferExperienceAndContract(title, content);
        const isRemote = /remote|remoto|anywhere/i.test(String(loc)) || /remote|remoto/i.test(title);

        allJobs.push({
          title,
          company: company.name,
          description: content,
          location: loc,
          locationType: isRemote ? "remote" : "hybrid",
          contractType: inferred.contractType,
          experienceLevel: inferred.experienceLevel,
          technologies: extractTech(title, content),
          source: "greenhouse",
          sourceId: String(job.id),
          url: job.absolute_url || `https://boards.greenhouse.io/${company.slug}/jobs/${job.id}`,
          postedAt: job.updated_at ? new Date(job.updated_at).toISOString() : undefined,
        });
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  const result = await saveJobs(allJobs, "Greenhouse");
  await logConnectorRun("Greenhouse", result, lastError, Date.now() - start);
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
    "Machine Learning",
    "Data Science",
    "Pandas",
    "FastAPI",
    "Django",
    "Go",
    "Kubernetes",
    "GraphQL",
    "Full-Stack",
    "Analytics",
    "LLM",
    "AI",
  ];
  const text = `${title} ${content}`.toLowerCase();
  return techs.filter((t) => text.includes(t.toLowerCase()));
}
