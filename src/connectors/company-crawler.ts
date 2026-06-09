import { db } from "@/db";
import { targetCompanies } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { RawJobData } from "@/types";

export async function fetchCompanyJobBoards(): Promise<{ new: number; duplicate: number; total: number; errors: string[] }> {
  const companies = await db
    .select()
    .from(targetCompanies)
    .where(eq(targetCompanies.isActive, true))
    .all();

  let totalNew = 0;
  let totalDup = 0;
  let totalJobs = 0;
  const errors: string[] = [];

  for (const company of companies) {
    try {
      const result = await crawlCompany(company);
      totalNew += result.new;
      totalDup += result.duplicate;
      totalJobs += result.total;

      await db.update(targetCompanies)
        .set({ lastCrawledAt: new Date().toISOString(), lastError: null })
        .where(eq(targetCompanies.id, company.id))
        .run();
    } catch (err: any) {
      errors.push(`${company.name}: ${err.message}`);
      await db.update(targetCompanies)
        .set({ lastCrawledAt: new Date().toISOString(), lastError: err.message })
        .where(eq(targetCompanies.id, company.id))
        .run();
    }
  }

  return { new: totalNew, duplicate: totalDup, total: totalJobs, errors };
}

async function crawlCompany(company: typeof targetCompanies.$inferSelect): Promise<{ new: number; duplicate: number; total: number }> {
  const ats = company.atsType;
  const slug = company.domain.split(".")[0];

  const { saveJobs } = await import("./utils");

  switch (ats) {
    case "greenhouse":
      return crawlGreenhouse(slug, company.name);
    case "lever":
      return crawlLever(slug, company.name);
    case "ashby":
      return crawlAshby(slug, company.name);
    default:
      return { new: 0, duplicate: 0, total: 0 };
  }
}

async function crawlGreenhouse(slug: string, companyName: string): Promise<{ new: number; duplicate: number; total: number }> {
  const { saveJobs } = await import("./utils");
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`, {
    headers: { "User-Agent": "Prism/1.0" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Greenhouse ${slug}: ${res.status}`);
  const data = await res.json();
  const items = data?.jobs || [];
  if (!Array.isArray(items)) return { new: 0, duplicate: 0, total: 0 };

  const jobsData: RawJobData[] = [];
  for (const job of items) {
    if (!job.title) continue;
    jobsData.push({
      title: job.title,
      company: companyName,
      description: job.content || "",
      location: job.offices?.[0]?.name || job.location?.name || "Remote",
      locationType: "remote",
      contractType: "clt",
      technologies: extractCompanyTech(job.title, job.content || ""),
      source: "greenhouse",
      sourceId: String(job.id),
      url: job.absolute_url || `https://boards.greenhouse.io/${slug}/jobs/${job.id}`,
      postedAt: job.updated_at ? new Date(job.updated_at).toISOString() : undefined,
    });
  }

  return saveJobs(jobsData, `Greenhouse/${companyName}`);
}

async function crawlLever(slug: string, companyName: string): Promise<{ new: number; duplicate: number; total: number }> {
  const { saveJobs } = await import("./utils");
  const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`, {
    headers: { "User-Agent": "Prism/1.0" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Lever ${slug}: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) return { new: 0, duplicate: 0, total: 0 };

  const jobsData: RawJobData[] = [];
  for (const job of data) {
    if (!job.text || !job.text) continue;
    const title = job.text || "";
    const desc = job.descriptionPlain || job.description || "";
    const locs = job.categories?.location?.split("/") || [];

    jobsData.push({
      title,
      company: companyName,
      description: desc,
      location: locs[0]?.trim() || "Remote",
      locationType: "remote",
      contractType: "clt",
      technologies: extractCompanyTech(title, desc),
      source: "lever",
      sourceId: job.id || `${slug}-${title}`,
      url: job.hostedUrl || `https://jobs.lever.co/${slug}/${job.id}`,
      postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
    });
  }

  return saveJobs(jobsData, `Lever/${companyName}`);
}

async function crawlAshby(slug: string, companyName: string): Promise<{ new: number; duplicate: number; total: number }> {
  const { saveJobs } = await import("./utils");
  const res = await fetch(`https://jobs.ashbyhq.com/${slug}/api/job-board`, {
    headers: { "User-Agent": "Prism/1.0" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Ashby ${slug}: ${res.status}`);
  const data = await res.json();
  const items = data?.jobs || [];
  if (!Array.isArray(items)) return { new: 0, duplicate: 0, total: 0 };

  const jobsData: RawJobData[] = [];
  for (const job of items) {
    if (!job.title) continue;
    jobsData.push({
      title: job.title,
      company: companyName,
      description: job.descriptionHtml || job.descriptionPlain || "",
      location: job.location || "Remote",
      locationType: "remote",
      contractType: "clt",
      technologies: extractCompanyTech(job.title, job.descriptionHtml || ""),
      source: "greenhouse",
      sourceId: job.id || `${slug}-${job.title}`,
      url: job.jobUrl || `https://jobs.ashbyhq.com/${slug}`,
      postedAt: job.publishedDate ? new Date(job.publishedDate).toISOString() : undefined,
    });
  }

  return saveJobs(jobsData, `Ashby/${companyName}`);
}

function extractCompanyTech(title: string, content: string): string[] {
  const techs = ["Python", "SQL", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "R", "Analytics", "LLM", "AI", "GPT", "RAG", "LangChain"];
  const text = `${title} ${content}`.toLowerCase();
  return techs.filter((t) => text.includes(t.toLowerCase()));
}
