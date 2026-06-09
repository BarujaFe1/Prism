import type { FreelanceProjectData, FreelancePlatform, FreelanceEngagementType, FreelanceExperienceLevel } from "../types";
import { saveFreelanceBatch, logFreelanceSync, generateSimpleHash, inferExpiresAt, sanitizeDate } from "../utils";

const SEARCH_QUERIES = [
  "freelance developer remote",
  "freelance react remote",
  "freelance python remote",
  "freelance frontend remote",
  "freelance backend remote",
  "contract developer remote",
  "contract engineer remote",
  "freelance full stack remote",
  "freelance data science remote",
  "freelance devops remote",
  "freelance typescript remote",
  "freelance nodejs remote",
  "freelance machine learning remote",
  "freelance AI remote",
  "freelance designer remote",
  "freelance writer remote",
  "freelance rust remote",
  "freelance golang remote",
  "freelance java remote",
  "freelance csharp remote",
  "freelance swift remote",
  "freelance kotlin remote",
  "freelance graphql remote",
  "freelance aws remote",
  "freelance gcp remote",
  "freelance azure remote",
  "freelance angular remote",
  "freelance vue remote",
  "freelance svelte remote",
  "freelance django remote",
  "freelance rails remote",
  "freelance laravel remote",
  "freelance spring boot remote",
  "freelance nextjs remote",
  "freelance nuxt remote",
  "freelance tailwind remote",
  "freelance figma remote",
  "freelance ux remote",
  "freelance product manager remote",
  "freelance qa remote",
  "freelance testing remote",
  "freelance blockchain remote",
  "freelance security remote",
  "freelance database remote",
  "freelance sql remote",
  "freelance nosql remote",
  "freelance redis remote",
  "senior freelance developer remote",
  "junior freelance developer remote",
];

const TECH_KEYWORDS = [
  "react", "vue", "angular", "svelte", "nextjs", "nuxt", "typescript",
  "javascript", "nodejs", "python", "java", "csharp", "golang", "rust",
  "swift", "kotlin", "php", "ruby", "scala", "elixir", "clojure",
  "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ansible",
  "graphql", "rest", "api", "sql", "nosql", "postgresql", "mysql",
  "mongodb", "redis", "elasticsearch", "kafka", "rabbitmq",
  "django", "flask", "rails", "laravel", "spring", "express",
  "tailwind", "bootstrap", "sass", "figma", "sketch", "adobe",
  "machine learning", "deep learning", "ai", "llm", "data science",
  "devops", "ci/cd", "jenkins", "github actions", "gitlab",
  "react native", "flutter", "ios", "android", "mobile",
  "blockchain", "web3", "solidity", "smart contract",
  "security", "cybersecurity", "penetration testing",
  "testing", "qa", "jest", "cypress", "selenium", "playwright",
  "agile", "scrum", "jira", "confluence",
  "product management", "ux", "ui", "user research",
];

const JOB_TYPE_MAP: Record<string, FreelanceEngagementType | undefined> = {
  "contract": "full-time",
  "temporary": "occasional",
  "part-time": "part-time",
  "full-time": "full-time",
};

function extractTechSkills(job: any): string[] {
  const source = [
    ...(job.requirements || []),
    ...(job.uncategorized || []),
    ...(job.benefits || []),
  ].filter(Boolean).map((s: string) => s.toLowerCase());

  const matched = new Set<string>();
  for (const kw of TECH_KEYWORDS) {
    if (source.some((s: string) => s.includes(kw))) {
      matched.add(kw);
    }
  }
  const titleLower = (job.title || "").toLowerCase();
  for (const kw of TECH_KEYWORDS) {
    if (titleLower.includes(kw)) {
      matched.add(kw);
    }
  }

  return [...matched].map((s) => {
    return s.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  });
}

function extractLocation(job: any): string | undefined {
  const loc = job.location || "";
  if (!loc) return undefined;
  if (loc.toLowerCase().includes("remote")) return "Remote";
  return loc;
}

function extractSalaryInfo(job: any): { min?: number; max?: number; currency?: string } {
  const salary = job.salaryInfo || "";
  if (!salary) return {};

  const match = salary.match(/\$([\d,]+)\s*-\s*\$([\d,]+)/);
  if (match) {
    return {
      min: parseInt(match[1].replace(/,/g, "")),
      max: parseInt(match[2].replace(/,/g, "")),
      currency: "USD",
    };
  }
  return {};
}

function extractExperienceLevel(requirements: string[]): FreelanceExperienceLevel | undefined {
  const levels = requirements.map((r: string) => r.toLowerCase());
  if (levels.some((r) => r.includes("senior") || r.includes("lead") || r.includes("principal") || r.includes("staff"))) return "expert";
  if (levels.some((r) => r.includes("mid") || r.includes("intermediate") || r.includes("mid-level"))) return "intermediate";
  if (levels.some((r) => r.includes("junior") || r.includes("entry") || r.includes("entry-level"))) return "entry";
  return undefined;
}

export async function fetchSimplyHired(): Promise<{ new: number; duplicate: number }> {
  const start = Date.now();
  const allProjects: FreelanceProjectData[] = [];
  let lastError: string | undefined;
  const seen = new Set<string>();

  for (const query of SEARCH_QUERIES) {
    try {
      const url = `https://www.simplyhired.com/search?q=${encodeURIComponent(query)}&l=remote`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;

      const html = await res.text();
      const dataMatch = html.match(/__NEXT_DATA__[^>]*>([\s\S]*?)<\/script>/);
      if (!dataMatch) continue;

      const data = JSON.parse(dataMatch[1]);
      const jobs = data?.props?.pageProps?.jobs || [];

      for (const job of jobs) {
        const jobKey = job.jobKey;
        const title = job.title;
        if (!jobKey || !title || seen.has(jobKey)) continue;
        seen.add(jobKey);

        const skills = extractTechSkills(job);
        const engagementType = (job.jobTypes || [])
          .map((t: string) => JOB_TYPE_MAP[t.toLowerCase().trim()])
          .find(Boolean);
        const experienceLevel = extractExperienceLevel(job.requirements || []);
        const salary = extractSalaryInfo(job);

        const now = Date.now();
        const postedAt = job.dateOnIndeed
          ? sanitizeDate(job.dateOnIndeed) || new Date().toISOString()
          : new Date().toISOString();

        allProjects.push({
          externalId: jobKey,
          sourceId: "simplyhired",
          title,
          clientName: job.company || "SimplyHired Client",
          clientUrl: job.companyPageUrl || "",
          clientRating: job.companyRating > 0 ? job.companyRating : undefined,
          description: job.snippet || "",
          url: `https://www.simplyhired.com${job.encodedUrl || job.botUrl || `/job/${jobKey}`}`,
          platform: "simplyhired" as FreelancePlatform,
          projectType: engagementType === "full-time" ? "hourly" : engagementType === "occasional" ? "fixed" : "hourly",
          engagementType,
          experienceLevel,
          skills,
          hourlyRateMin: salary.min,
          hourlyRateMax: salary.max,
          proposalsCount: undefined,
          postedAt,
          expiresAt: inferExpiresAt("simplyhired", postedAt),
          budgetCurrency: salary.currency || "USD",
          contentHash: generateSimpleHash(title + jobKey + job.company),
        });
      }
    } catch (err: any) {
      lastError = err.message;
    }
  }

  const result = await saveFreelanceBatch(allProjects, "SimplyHired");
  await logFreelanceSync("SimplyHired", "simplyhired", result, lastError, Date.now() - start);
  return result;
}
