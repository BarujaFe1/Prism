import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";
import { inferExperienceAndContract } from "./job-infer";

const COMPANIES = [
  { slug: "cloudwalk", name: "CloudWalk" },
  { slug: "pagarme", name: "Pagar.me" },
  { slug: "contabilizei", name: "Contabilizei" },
  { slug: "neon", name: "Neon" },
  { slug: "omie", name: "Omie" },
  { slug: "elo7", name: "Elo7" },
  { slug: "pipefy", name: "Pipefy" },
  { slug: "contaazul", name: "Conta Azul" },
  { slug: "beeviral", name: "BeeViral" },
  { slug: "tractian", name: "Tractian" },
  { slug: "cargo-x", name: "CargoX" },
  { slug: "meliuz", name: "Méliuz" },
  { slug: "loggi", name: "Loggi" },
  { slug: "madeiramadeira", name: "MadeiraMadeira" },
];

export async function fetchLever(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();
  const allJobs: RawJobData[] = [];
  let lastError: string | undefined;

  for (const company of COMPANIES) {
    try {
      const res = await fetch(`https://api.lever.co/v0/postings/${company.slug}?mode=json`, {
        headers: { "User-Agent": "Prism/1.0 (personal job radar)" },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) continue;

      const data = await res.json();
      const items = Array.isArray(data) ? data : [];

      for (const job of items) {
        const title = job.text || "";
        if (!title) continue;
        const desc = job.descriptionPlain || job.description || "";
        const loc = job.categories?.location || "Remote";
        const inferred = inferExperienceAndContract(title, desc);
        const isRemote = /remote|remoto/i.test(String(loc)) || /remote|remoto/i.test(title);

        allJobs.push({
          title,
          company: company.name,
          description: desc,
          location: loc,
          locationType: isRemote ? "remote" : "hybrid",
          contractType: inferred.contractType,
          experienceLevel: inferred.experienceLevel,
          technologies: extractTech(title, desc),
          source: "lever",
          sourceId: job.id || String(job.hostedUrl || ""),
          url: job.hostedUrl || `https://jobs.lever.co/${company.slug}`,
          postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
        });
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  const result = await saveJobs(allJobs, "Lever");
  await logConnectorRun("Lever", result, lastError, Date.now() - start);
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
    "FastAPI",
    "Go",
    "GraphQL",
    "Full-Stack",
    "Analytics",
  ];
  const text = `${title} ${content}`.toLowerCase();
  return techs.filter((t) => text.includes(t.toLowerCase()));
}
