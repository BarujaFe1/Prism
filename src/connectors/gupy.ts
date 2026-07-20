import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";
import { inferExperienceAndContract } from "./job-infer";

/**
 * Gupy portal search API (portal.api.gupy.io) returns 404 as of 2026-07.
 * Fallback: crawl known company career pages via __NEXT_DATA__.
 */
const GUPY_BOARDS: { slug: string; name: string }[] = [
  { slug: "stone", name: "Stone" },
  { slug: "pagarme", name: "Pagar.me" },
  { slug: "creditas", name: "Creditas" },
  { slug: "hotmart", name: "Hotmart" },
  { slug: "loft", name: "Loft" },
  { slug: "vtex", name: "VTEX" },
  { slug: "rdstation", name: "RD Station" },
  { slug: "neon", name: "Neon" },
  { slug: "willbank", name: "Will Bank" },
  { slug: "caju", name: "Caju" },
  { slug: "flashapp", name: "Flash" },
  { slug: "pier", name: "Pier" },
  { slug: "olx", name: "OLX" },
  { slug: "grupozap", name: "Grupo ZAP" },
  { slug: "loggi", name: "Loggi" },
  { slug: "madeiramadeira", name: "MadeiraMadeira" },
  { slug: "americanas", name: "Americanas" },
  { slug: "magazineluiza", name: "Magazine Luiza" },
  { slug: "totvs", name: "TOTVS" },
  { slug: "ciandt", name: "CI&T" },
  { slug: "accenturebrasil", name: "Accenture" },
  { slug: "thoughtworks", name: "Thoughtworks" },
  { slug: "bemobi", name: "Bemobi" },
  { slug: "pipefy", name: "Pipefy" },
  { slug: "contaazul", name: "Conta Azul" },
  { slug: "omie", name: "Omie" },
  { slug: "tray", name: "Tray" },
  { slug: "linx", name: "Linx" },
  { slug: "dito", name: "Dito" },
  { slug: "resultadosdigitais", name: "Resultados Digitais" },
];

const TITLE_KEYWORDS = [
  "dado",
  "data",
  "analyst",
  "analista",
  "eng",
  "engineer",
  "software",
  "dev",
  "developer",
  "desenvolvedor",
  "programador",
  "estagio",
  "estágio",
  "junior",
  "júnior",
  "intern",
  "trainee",
  "full stack",
  "fullstack",
  "front",
  "back",
  "react",
  "node",
  "python",
  "typescript",
  "product",
  "produto",
  "ml",
  "ia",
  "ai",
];

export async function fetchGupy(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();
  const allJobs: RawJobData[] = [];
  const seen = new Set<string>();
  let lastError: string | undefined;
  let boardsOk = 0;

  for (const board of GUPY_BOARDS) {
    if (board.slug.includes(" ")) continue;
    try {
      const jobs = await crawlBoard(board.slug, board.name);
      for (const job of jobs) {
        const sid = String(job.sourceId);
        if (seen.has(sid)) continue;
        seen.add(sid);
        allJobs.push(job);
      }
      if (jobs.length > 0) boardsOk += 1;
      await new Promise((r) => setTimeout(r, 400));
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  if (boardsOk === 0 && lastError) {
    // keep lastError for logs
  } else if (boardsOk > 0) {
    lastError = undefined;
  }

  const result = await saveJobs(allJobs, "Gupy");
  await logConnectorRun("Gupy", result, lastError, Date.now() - start);
  return result;
}

async function crawlBoard(slug: string, companyName: string): Promise<RawJobData[]> {
  const url = `https://${slug}.gupy.io/`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return [];

  const html = await res.text();
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
  if (!match) return [];

  const data = JSON.parse(match[1]);
  const items = data.props?.pageProps?.jobs || [];
  if (!Array.isArray(items)) return [];

  const out: RawJobData[] = [];
  for (const item of items) {
    const title = item.title || "";
    if (!title) continue;
    const titleLower = title.toLowerCase();
    if (!TITLE_KEYWORDS.some((kw) => titleLower.includes(kw))) continue;

    let description = "";
    let postedAt: string | undefined;
    try {
      const detailRes = await fetch(`https://${slug}.gupy.io/jobs/${item.id}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (detailRes.ok) {
        const detailHtml = await detailRes.text();
        const detailMatch = detailHtml.match(
          /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/
        );
        if (detailMatch) {
          const detailData = JSON.parse(detailMatch[1]);
          const jobObj = detailData.props?.pageProps?.job;
          if (jobObj) {
            description = [jobObj.description, jobObj.prerequisites, jobObj.responsibilities]
              .filter(Boolean)
              .join("\n\n");
            if (jobObj.publishedAt) postedAt = new Date(jobObj.publishedAt).toISOString();
          }
        }
      }
    } catch {
      // keep listing-level data
    }

    const workplaceType = item.workplace?.workplaceType;
    let locationType: "remote" | "hybrid" | "onsite" = "onsite";
    if (workplaceType === "remote") locationType = "remote";
    else if (workplaceType === "hybrid") locationType = "hybrid";

    const loc = item.workplace?.address
      ? [item.workplace.address.city, item.workplace.address.state].filter(Boolean).join(" - ")
      : locationType === "remote"
        ? "Remoto"
        : "Brasil";

    const inferred = inferExperienceAndContract(title, description);
    const contractType =
      item.type === "vacancy_type_internship" ? "internship" : inferred.contractType;

    out.push({
      title,
      company: companyName,
      description,
      location: loc,
      locationType,
      contractType,
      experienceLevel: inferred.experienceLevel,
      technologies: extractGupyTech(title, description),
      tags: [],
      source: "gupy",
      sourceId: String(item.id),
      url: `https://${slug}.gupy.io/jobs/${item.id}`,
      postedAt,
    });

    await new Promise((r) => setTimeout(r, 350));
  }

  return out;
}

function extractGupyTech(title: string, desc: string): string[] {
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
    "R",
    "Analytics",
    "Excel",
    "Power BI",
    "LLM",
    "AI",
    "Supabase",
    "Tailwind",
  ];
  const text = `${title} ${desc}`.toLowerCase();
  return techs.filter((t) => text.includes(t.toLowerCase()));
}
