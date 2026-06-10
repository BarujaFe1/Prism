import { db } from "@/db";
import { monitoredCompanies, jobs } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { RawJobData } from "@/types";

export async function fetchCompanyJobBoards(filters?: { priority?: string; sector?: string; companyId?: string }): Promise<{ new: number; duplicate: number; total: number; errors: string[] }> {
  let companies = await db
    .select()
    .from(monitoredCompanies)
    .where(eq(monitoredCompanies.isActive, true))
    .all();

  if (filters) {
    if (filters.priority) {
      companies = companies.filter((c) => c.priority === filters.priority);
    }
    if (filters.sector) {
      companies = companies.filter((c) => c.sector === filters.sector);
    }
    if (filters.companyId) {
      companies = companies.filter((c) => c.id === filters.companyId);
    }
  }

  let totalNew = 0;
  let totalDup = 0;
  let totalJobs = 0;
  const errors: string[] = [];

  for (const company of companies) {
    // Only crawl if detectedAts is supported
    if (!company.detectedAts || company.detectedAts === "unknown") {
      continue;
    }

    try {
      console.log(`Crawling company: ${company.name} (${company.detectedAts})...`);
      const result = await crawlCompany(company);
      totalNew += result.new;
      totalDup += result.duplicate;
      totalJobs += result.total;

      await db.update(monitoredCompanies)
        .set({ 
          lastSyncAttemptAt: new Date().toISOString(), 
          lastSuccessfulSyncAt: new Date().toISOString(),
          lastError: null,
          status: "active"
        })
        .where(eq(monitoredCompanies.id, company.id))
        .run();

      // Recalculate and update stats
      await updateCompanyStats(company.id, company.name);

    } catch (err: any) {
      console.error(`Error crawling ${company.name}: ${err.message}`);
      errors.push(`${company.name}: ${err.message}`);
      
      await db.update(monitoredCompanies)
        .set({ 
          lastSyncAttemptAt: new Date().toISOString(), 
          lastError: err.message,
          status: "error"
        })
        .where(eq(monitoredCompanies.id, company.id))
        .run();
    }

    // Polite delay between companies to avoid rate-limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return { new: totalNew, duplicate: totalDup, total: totalJobs, errors };
}

function extractSlug(urlStr: string, ats: string, companyName: string): string {
  const normalized = companyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();

  const genericKeywords = ["jobs", "vagas", "careers", "career", "oportunidades", "work-with-us", "trabalhe-conosco", "trabalheconosco", "openings", "positions", "about", "join", "team", "people", "trabalhe", "vaga", "job", "trabalhe-conosco-1"];

  if (!urlStr) return normalized;
  
  try {
    const url = new URL(urlStr);
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname;
    
    let slug = "";
    if (ats === "gupy") {
      if (host.includes("gupy.io")) {
        slug = host.split(".")[0];
      }
    } else if (ats === "greenhouse") {
      if (host.includes("greenhouse.io")) {
        const parts = pathname.split("/").filter(Boolean);
        slug = parts[0] === "embed" ? parts[1] : parts[0];
      }
    } else if (ats === "lever") {
      if (host.includes("lever.co")) {
        const parts = pathname.split("/").filter(Boolean);
        slug = parts[0] || "";
      }
    } else if (ats === "ashby") {
      if (host.includes("ashbyhq.com")) {
        const parts = pathname.split("/").filter(Boolean);
        slug = parts[0] || "";
      }
    }

    if (slug && !genericKeywords.includes(slug.toLowerCase())) {
      return slug;
    }
  } catch {}
  
  // Fallback: extract last segment of URL
  const lastSegment = urlStr.replace(/\/$/, "").split("/").pop() || "";
  if (lastSegment && !genericKeywords.includes(lastSegment.toLowerCase())) {
    return lastSegment;
  }
  
  return normalized;
}

export async function crawlCompany(company: typeof monitoredCompanies.$inferSelect): Promise<{ new: number; duplicate: number; total: number }> {
  const ats = company.detectedAts || "unknown";
  const slug = extractSlug(company.careerUrl || "", ats, company.name);
  
  if (!slug && ats !== "custom") {
    throw new Error(`Could not extract company slug/identifier from career URL: ${company.careerUrl}`);
  }

  switch (ats) {
    case "greenhouse":
      return crawlGreenhouse(slug, company.name);
    case "lever":
      return crawlLever(slug, company.name);
    case "ashby":
      return crawlAshby(slug, company.name);
    case "gupy":
      return crawlGupy(slug, company.name);
    case "custom":
      if (!company.careerUrl) throw new Error("No career URL configured for custom structured data crawling.");
      return crawlJobPosting(company.careerUrl, company.name);
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
  if (!res.ok) throw new Error(`Greenhouse ${slug} API returned ${res.status}`);
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
  if (!res.ok) throw new Error(`Lever ${slug} API returned ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) return { new: 0, duplicate: 0, total: 0 };

  const jobsData: RawJobData[] = [];
  for (const job of data) {
    if (!job.text) continue;
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
  if (!res.ok) throw new Error(`Ashby ${slug} API returned ${res.status}`);
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
      source: "ashby",
      sourceId: job.id || `${slug}-${job.title}`,
      url: job.jobUrl || `https://jobs.ashbyhq.com/${slug}`,
      postedAt: job.publishedDate ? new Date(job.publishedDate).toISOString() : undefined,
    });
  }

  return saveJobs(jobsData, `Ashby/${companyName}`);
}

async function crawlGupy(slug: string, companyName: string): Promise<{ new: number; duplicate: number; total: number }> {
  const { saveJobs } = await import("./utils");
  const url = `https://${slug}.gupy.io/`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Gupy ${slug} page returned status ${res.status}`);
  const html = await res.text();
  
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
  if (!match) throw new Error(`Gupy ${slug}: Failed to locate __NEXT_DATA__ scripts.`);
  
  const data = JSON.parse(match[1]);
  const items = data.props?.pageProps?.jobs || [];
  if (!Array.isArray(items)) return { new: 0, duplicate: 0, total: 0 };

  const jobsData: RawJobData[] = [];
  
  // Broad filter to identify candidate data / software roles before querying details
  const targetKeywords = ["dado", "data", "analyst", "analista", "bi", "business intelligence", "eng", "engineer", "software", "dev", "developer", "programador", "estagio", "estágio", "junior", "júnior", "intern", "machine learning", "ml", "ia", "ai", "dashboard", "dbt", "python", "sql", "excel", "etl", "full stack", "fullstack", "backend"];

  for (const item of items) {
    if (!item.title) continue;
    
    const titleLower = item.title.toLowerCase();
    const isPotentialMatch = targetKeywords.some(kw => titleLower.includes(kw));
    
    if (!isPotentialMatch) continue;

    let description = "";
    let postedAt = new Date().toISOString();
    
    try {
      const detailUrl = `https://${slug}.gupy.io/jobs/${item.id}`;
      const detailRes = await fetch(detailUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        signal: AbortSignal.timeout(6000)
      });
      if (detailRes.ok) {
        const detailHtml = await detailRes.text();
        const detailMatch = detailHtml.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
        if (detailMatch) {
          const detailData = JSON.parse(detailMatch[1]);
          const jobObj = detailData.props?.pageProps?.job;
          if (jobObj) {
            description = (jobObj.description || "") + "\n\n" + (jobObj.prerequisites || "") + "\n\n" + (jobObj.responsibilities || "");
            if (jobObj.publishedAt) {
              postedAt = new Date(jobObj.publishedAt).toISOString();
            }
          }
        }
      }
    } catch (err: any) {
      console.warn(`Gupy detail page fetch failed for job ${item.id}: ${err.message}`);
    }

    const workplaceType = item.workplace?.workplaceType;
    let locationType: "remote" | "hybrid" | "onsite" = "onsite";
    if (workplaceType === "remote") locationType = "remote";
    else if (workplaceType === "hybrid") locationType = "hybrid";

    const loc = item.workplace?.address
      ? [item.workplace.address.city, item.workplace.address.state].filter(Boolean).join(" - ")
      : "Brasil";

    jobsData.push({
      title: item.title,
      company: companyName,
      description,
      location: loc,
      locationType,
      contractType: item.type === "vacancy_type_internship" ? "internship" : "clt",
      technologies: extractCompanyTech(item.title, description),
      source: "gupy",
      sourceId: String(item.id),
      url: `https://${slug}.gupy.io/jobs/${item.id}`,
      postedAt,
    });

    // Rate limit delay between jobs
    await new Promise(r => setTimeout(r, 600));
  }

  return saveJobs(jobsData, `Gupy/${companyName}`);
}

async function crawlJobPosting(url: string, companyName: string): Promise<{ new: number; duplicate: number; total: number }> {
  const { saveJobs } = await import("./utils");
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    },
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) throw new Error(`Custom JobPosting board returned status ${res.status}`);
  const html = await res.text();
  
  const postings = extractJobPostings(html);
  const jobsData: RawJobData[] = [];
  
  for (const job of postings) {
    const title = job.title;
    const desc = job.description || "";
    if (!title) continue;
    
    let locationType: "remote" | "hybrid" | "onsite" = "onsite";
    const locStr = typeof job.jobLocation === "string" 
      ? job.jobLocation 
      : job.jobLocation?.address?.addressLocality || "Brasil";
    
    const lower = `${title} ${desc}`.toLowerCase();
    if (lower.includes("remoto") || lower.includes("home office") || lower.includes("remote")) locationType = "remote";
    else if (lower.includes("hibrido") || lower.includes("híbrido") || lower.includes("hybrid")) locationType = "hybrid";
    
    jobsData.push({
      title,
      company: companyName,
      description: desc.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      location: locStr,
      locationType,
      contractType: lower.includes("estagio") || lower.includes("intern") ? "internship" : "clt",
      technologies: extractCompanyTech(title, desc),
      source: "jobposting",
      sourceId: `${companyName}-${title}`,
      url: job.url || url,
      postedAt: job.datePosted ? new Date(job.datePosted).toISOString() : undefined,
    });
  }
  
  return saveJobs(jobsData, `JobPosting/${companyName}`);
}

function extractJobPostings(html: string): any[] {
  const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  const postings: any[] = [];
  
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1].trim());
      const traverse = (obj: any) => {
        if (!obj || typeof obj !== "object") return;
        if (obj["@type"] === "JobPosting") {
          postings.push(obj);
        }
        if (Array.isArray(obj)) {
          obj.forEach(traverse);
        } else {
          if (obj["@graph"] && Array.isArray(obj["@graph"])) {
            obj["@graph"].forEach(traverse);
          }
          for (const key in obj) {
            if (typeof obj[key] === "object") {
              traverse(obj[key]);
            }
          }
        }
      };
      traverse(data);
    } catch {}
  }
  return postings;
}

export async function updateCompanyStats(companyId: string, companyName: string) {
  try {
    const allJobs = await db
      .select({ id: jobs.id, score: jobs.score, fitLabel: jobs.fitLabel, status: jobs.status })
      .from(jobs)
      .where(eq(jobs.company, companyName))
      .all();

    const totalJobsFound = allJobs.length;
    const totalRelevantJobs = allJobs.filter(j => j.fitLabel === "high" || j.fitLabel === "good" || (j.score ?? 0) >= 0.70).length;
    const totalSavedJobs = allJobs.filter(j => j.status === "saved").length;
    const totalAppliedJobs = allJobs.filter(j => ["applied", "interview", "offer"].includes(j.status)).length;
    
    const usefulnessRate = totalJobsFound > 0 
      ? (totalSavedJobs + totalAppliedJobs + totalRelevantJobs) / totalJobsFound
      : 0.0;

    await db
      .update(monitoredCompanies)
      .set({
        totalJobsFound,
        totalRelevantJobs,
        totalSavedJobs,
        totalAppliedJobs,
        usefulnessRate: Math.round(usefulnessRate * 100) / 100,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(monitoredCompanies.id, companyId))
      .run();
  } catch (err: any) {
    console.error(`Failed to update stats for company ${companyName}:`, err.message);
  }
}

function extractCompanyTech(title: string, content: string): string[] {
  const techs = ["Python", "SQL", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "R", "Analytics", "LLM", "AI", "GPT", "RAG", "LangChain", "Excel", "Power BI", "Tableau", "Looker", "Metabase", "dbt", "Airflow", "Snowflake", "BigQuery", "Databricks"];
  const text = `${title} ${content}`.toLowerCase();
  return techs.filter((t) => text.includes(t.toLowerCase()));
}
