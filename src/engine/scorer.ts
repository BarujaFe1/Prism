import type { ProfileData, ScoreDetails, LocationType, ContractType, ExperienceLevel } from "@/types";

const TECH_KEYWORDS = [
  "TypeScript", "JavaScript", "Python", "Java", "Go", "Rust", "C++", "C#",
  "Ruby", "PHP", "Swift", "Kotlin", "Scala", "Elixir", "Clojure", "Haskell",
  "React", "Next.js", "Vue.js", "Angular", "Svelte", "Node.js", "Deno", "Bun",
  "Express", "Fastify", "NestJS", "Django", "Flask", "FastAPI", "Spring Boot",
  "Laravel", "Rails", "ASP.NET", "PostgreSQL", "MySQL", "SQLite", "MongoDB",
  "Redis", "Elasticsearch", "Kafka", "RabbitMQ", "Spark", "Flink", "Hadoop",
  "Docker", "Kubernetes", "Terraform", "AWS", "GCP", "Azure", "Cloudflare",
  "GraphQL", "REST", "gRPC", "WebSocket", "CSS", "Tailwind CSS", "Sass",
  "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "PyTorch",
  "TensorFlow", "Scikit-learn", "Pandas", "NumPy", "CUDA", "LLM", "AI",
  "CI/CD", "GitHub Actions", "GitLab CI", "Linux", "Nginx", "Prometheus",
  "Data Science", "Statistics", "A/B Testing", "Airflow", "dbt", "Snowflake",
  "BigQuery", "Databricks", "React Native", "Flutter", "iOS", "Android",
  "Excel", "Google Sheets", "ETL", "Data Pipeline", "Data Quality", "EDA",
  "Analytics", "Dashboard", "SQL", "R", "Supabase", "Vercel", "Expo", "Resend",
  "Selenium", "Git", "GitHub", "Scipy", "Statsmodels", "Matplotlib", "Seaborn",
  "Probability", "Regression", "Classification", "Time Series", "Clustering",
  "Power BI", "Tableau", "Looker", "Metabase", "Observability", "KPIs",
];

const TECH_RELATIONS: Record<string, string[]> = {
  "Pandas": ["Python", "Data Science", "Analytics", "EDA"],
  "Python": ["Pandas", "Data Science", "Machine Learning", "Scikit-learn", "FastAPI", "Django", "NumPy", "Scipy"],
  "SQL": ["PostgreSQL", "MySQL", "SQLite", "BigQuery", "Snowflake", "Data Pipeline"],
  "TypeScript": ["JavaScript", "React", "Next.js", "Node.js"],
  "React": ["TypeScript", "Next.js", "JavaScript", "Frontend"],
  "Next.js": ["React", "TypeScript", "Vercel", "Full-Stack"],
  "Node.js": ["TypeScript", "JavaScript", "Express", "API"],
  "Machine Learning": ["Python", "Data Science", "Scikit-learn", "TensorFlow", "PyTorch", "NLP"],
  "Data Science": ["Python", "Statistics", "Machine Learning", "Pandas", "Analytics"],
  "Statistics": ["Data Science", "Probability", "Python", "R", "A/B Testing"],
  "FastAPI": ["Python", "API", "Backend"],
  "React Native": ["React", "TypeScript", "Mobile", "Expo"],
  "Docker": ["DevOps", "Container", "Deployment", "CI/CD"],
  "AWS": ["Cloud", "Deployment", "Infrastructure"],
  "Git": ["GitHub", "Version Control", "CI/CD"],
};

export function extractTechnologies(description: string): string[] {
  const found = new Set<string>();
  const upper = description.toUpperCase();
  const lower = description.toLowerCase();
  for (const tech of TECH_KEYWORDS) {
    if (upper.includes(tech.toUpperCase()) || lower.includes(tech.toLowerCase())) {
      found.add(tech);
    }
  }
  return Array.from(found).sort();
}

const ROLE_CATEGORIES = [
  { keywords: ["estágio", "internship", "intern", "trainee", "estagiário", "student"], category: "internship" },
  { keywords: ["data science", "cientista de dados", "data scientist", "ml", "machine learning", "ai"], category: "data-science" },
  { keywords: ["analytics", "analista de dados", "data analyst", "business intelligence", "bi", "dashboard"], category: "analytics" },
  { keywords: ["engenharia de dados", "data engineer", "data engineering", "data pipeline", "etl"], category: "data-engineering" },
  { keywords: ["full stack", "fullstack", "full-stack", "desenvolvedor full"], category: "full-stack" },
  { keywords: ["backend", "back end", "desenvolvedor back"], category: "backend" },
  { keywords: ["frontend", "front end", "front-end", "desenvolvedor front", "ui"], category: "frontend" },
  { keywords: ["junior", "júnior", "jr", "pleno", "mid"], category: "junior-mid" },
  { keywords: ["senior", "sênior", "sr", "lead", "staff", "principal"], category: "senior" },
];

function detectRoleCategory(title: string, description: string | null): string[] {
  const text = `${title} ${description || ""}`.toLowerCase();
  const categories: string[] = [];
  for (const rc of ROLE_CATEGORIES) {
    if (rc.keywords.some((kw) => text.includes(kw))) {
      categories.push(rc.category);
    }
  }
  if (categories.length === 0) categories.push("general");
  return categories;
}

const AREA_WEIGHTS: Record<string, Record<string, number>> = {
  "data-science": { "data-science": 1, analytics: 0.8, "data-engineering": 0.7, "full-stack": 0.4, backend: 0.3, frontend: 0.2, general: 0.5 },
  analytics: { "data-science": 0.8, analytics: 1, "data-engineering": 0.7, "full-stack": 0.4, backend: 0.3, frontend: 0.2, general: 0.5 },
  "data-engineering": { "data-science": 0.7, analytics: 0.7, "data-engineering": 1, "full-stack": 0.5, backend: 0.5, frontend: 0.2, general: 0.4 },
  "full-stack": { "data-science": 0.4, analytics: 0.4, "data-engineering": 0.4, "full-stack": 1, backend: 0.8, frontend: 0.7, general: 0.5 },
  backend: { "data-science": 0.3, analytics: 0.3, "data-engineering": 0.5, "full-stack": 0.8, backend: 1, frontend: 0.5, general: 0.4 },
  frontend: { "data-science": 0.2, analytics: 0.2, "data-engineering": 0.2, "full-stack": 0.7, backend: 0.5, frontend: 1, general: 0.3 },
  internship: { internship: 1, "data-science": 0.8, analytics: 0.8, "data-engineering": 0.7, "full-stack": 0.7, backend: 0.6, frontend: 0.6, general: 0.8 },
};

function classifyDomain(title: string): string {
  const t = title.toLowerCase();

  // Data / Science / Stats
  if (/\b(data scientist|cientista de dados|science|cientista|estatistica|estatístico|statistics|modelagem|probability|probabilidade|analytics engineer)\b/i.test(t)) {
    if (t.includes("engineer") || t.includes("engenha")) return "data_engineering";
    return "data";
  }

  // Data Engineering
  if (/\b(data engineer|engenheiro de dados|etl|airflow|dbt|data pipeline|pipelines? de dados)\b/i.test(t)) {
    return "data_engineering";
  }

  // Analytics / BI
  if (/\b(analytics|analista de dados|data analyst|business intelligence|bi|dashboard|power bi|tableau|looker|metabase)\b/i.test(t)) {
    return "analytics";
  }

  // AI/LLM/Generative AI
  if (/\b(llm|ia|generativa|prompt|rag|agents|generative ai|evals|datasets|ai engineer|inteligencia artificial)\b/i.test(t)) {
    return "ai_llm";
  }

  // Design / UX
  if (/\b(designer|design|ui\/ux|ux\/ui|figma|photoshop|illustrator|creative director|motion|graphic designer|web designer)\b/i.test(t)) {
    return "design";
  }

  // Legal / Compliance
  if (/\b(privacy|compliance|lawyer|advogado|juridico|legal|dpo|lgpd)\b/i.test(t)) {
    return "legal";
  }

  // Sales / Marketing
  if (/\b(sales|vendas|marketing|growth|copywriter|social|customer success|commercial|comercial|business developer|account manager)\b/i.test(t)) {
    return "sales";
  }

  // Finance / Ops Non-data
  if (/\b(treasury|tesouraria|operations|operações|financeiro|finance|financial|billing|faturamento)\b/i.test(t)) {
    return "finance_ops";
  }

  // Admin / Support
  if (/\b(admin|administrator|suporte|support|virtual assistant|assistente|helpdesk|receptionist|recepcionista|secretaria|atendimento|sac)\b/i.test(t)) {
    return "admin_support";
  }

  // Full-Stack / Backend
  if (/\b(full stack|fullstack|full-stack|backend|back end|back-end|python|nodejs|typescript|node dev|node\.js|go dev|golang|rust dev)\b/i.test(t)) {
    return "fullstack_backend";
  }

  // Software Engineering
  if (/\b(software engineer|engenheiro de software|desenvolvedor|developer|programmer|programador|eng\. de software)\b/i.test(t)) {
    return "software_engineering";
  }

  return "unknown";
}

export function computeScore(job: {
  title: string;
  description: string | null;
  technologies: string[];
  locationType: LocationType | null;
  contractType: ContractType | null;
  experienceLevel: ExperienceLevel | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  postedAt?: string | null;
  location?: string | null;
}, profile: ProfileData | null): { score: number; details: ScoreDetails & Record<string, any> } {
  if (!profile) {
    return {
      score: 0,
      details: {
        title: 0,
        skills: 0,
        experience: 0,
        location: 0,
        salary: 0,
        contract: 0,
        total: 0,
        scoreLabel: "Sem perfil",
        fitLabel: "low" as any,
        penalties: [],
        warnings: [],
        explanation: "Perfil não configurado",
        explanationDetail: "",
      },
    };
  }

  // 1. Title/Domain gate
  const cleanTitle = job.title.trim().replace(/\s+/g, " ");
  const domain = classifyDomain(cleanTitle);

  const isIncompatibleDomain = ["design", "legal", "sales", "finance_ops", "admin_support"].includes(domain);

  const titleLower = cleanTitle.toLowerCase();
  const titleHasSkills = TECH_KEYWORDS.some(tech => {
    const t = tech.toLowerCase();
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    return regex.test(titleLower);
  });
  const isUnknownNoSkills = domain === "unknown" && !titleHasSkills;

  const profileIsEntry = !profile.experienceLevel || ["internship", "trainee", "junior"].includes(profile.experienceLevel);
  const jobIsSenior = /\b(senior|sênior|sr\.|lead|staff|principal|architect|manager|coordenador|diretor)\b/i.test(titleLower);
  const isSeniorMismatch = profileIsEntry && jobIsSenior;

  const isOnsite = job.locationType === "onsite";
  const isSaoCarlos = /s[ãa]o\s*carlos/i.test(job.location || "");
  const isOnsiteMismatch = isOnsite && !isSaoCarlos;

  const hasNegativeKeywords = /\b(sap|cobol|vba|delphi|mainframe)\b/i.test(titleLower);

  // 2. Subscores
  const skillScore = computeSkillScore(job.technologies, job.description, profile.skills);
  const areaScore = computeAreaScore(job.title, job.description, profile.desiredRoles);
  const experienceScore = computeExperienceScore(job.experienceLevel, profile.experienceLevel, job.title);
  const locationScore = computeLocationScore(job.locationType, profile.desiredLocationTypes);
  const salaryScore = computeSalaryScore(job.salaryMin, job.salaryMax, job.currency, profile.desiredSalaryMin, profile.desiredSalaryMax, profile.desiredCurrency);
  const contractScore = computeContractScore(job.contractType, profile.desiredContractTypes);
  const recencyScore = computeRecencyScore(job.postedAt);

  let total = skillScore * 0.35 + areaScore * 0.20 + experienceScore * 0.15 + locationScore * 0.10 + salaryScore * 0.08 + contractScore * 0.07 + recencyScore * 0.05;

  const textForPenalty = `${job.title} ${job.description || ""}`.toLowerCase();
  const negativeKeywords = (profile.negativeKeywords || []).map((k: string) => k.toLowerCase());

  let negativeMultiplier = 1;
  for (const kw of negativeKeywords) {
    if (textForPenalty.includes(kw)) {
      negativeMultiplier *= 0.7;
    }
  }
  total *= negativeMultiplier;

  const nonDevRoles = ["designer", "design", "ui/ux", "ux/ui", "figma", "photoshop", "illustrator", "video editor", "motion", "animator", "3d artist", "graphic design", "social media", "marketing", "sales", "vendas", "suporte", "support", "administrativo", "administrative", "recepcionista", "assistente virtual", "virtual assistant", "customer service", "atendimento", "recursos humanos", "hr", "rh", "contabilidade", "accounting", "financeiro", "finance", "copywriter", "content writer", "conteúdo", "community manager"];
  for (const nonDev of nonDevRoles) {
    if (titleLower.includes(nonDev)) {
      total *= 0.1;
      break;
    }
  }

  const wantsInternship = (profile.desiredRoles || []).some((r: string) => r.toLowerCase().includes("estágio") || r.toLowerCase().includes("internship") || r.toLowerCase().includes("trainee"));
  const titleIsInternship = /\b(est[áa]gio|internship|intern|estagi[áa]rio|trainee|jr)\b/i.test(titleLower);
  if (titleIsInternship && !wantsInternship) {
    total *= 0.2;
  }

  total = Math.max(0, Math.min(total, 1));

  if (skillScore >= 0.80 && total > 0.5) {
    total = Math.min(total + 0.05, 1);
  }

  // 3. Apply Gates
  const penalties: string[] = [];
  const warnings: string[] = [];

  if (isIncompatibleDomain) {
    total = Math.min(total, 0.30);
    penalties.push("Domínio incompatível (" + domain + ")");
  }
  if (isUnknownNoSkills) {
    total = Math.min(total, 0.55);
    penalties.push("Domínio desconhecido sem termos técnicos no título");
  }
  if (isSeniorMismatch) {
    total = Math.min(total, 0.55);
    penalties.push("Senioridade incompatível (vaga sênior/liderança)");
  }
  if (isOnsiteMismatch) {
    total = Math.min(total, 0.60);
    penalties.push("Vaga presencial fora de São Carlos");
  }
  if (hasNegativeKeywords) {
    total = Math.min(total, 0.35);
    penalties.push("Tecnologia fora de interesse (SAP, Cobol, VBA, Delphi, Mainframe)");
  }

  total = Math.round(total * 100) / 100;

  // 4. Fit Label
  let fitLabel: "high" | "good" | "partial" | "low" = "low";
  let scoreLabel = "Baixo fit";
  if (isIncompatibleDomain) {
    scoreLabel = "Fora do foco";
    fitLabel = "low";
  } else if (total >= 0.85 && penalties.length === 0) {
    scoreLabel = "Excelente fit";
    fitLabel = "high";
  } else if (total >= 0.70 && penalties.length === 0) {
    scoreLabel = "Bom fit";
    fitLabel = "good";
  } else if (total >= 0.50) {
    scoreLabel = "Revisar";
    fitLabel = "partial";
  }

  let explanation = "";
  if (scoreLabel === "Fora do foco") {
    explanation = "Suprimida: domínio '" + domain + "' incompatível com o perfil";
  } else if (penalties.length > 0) {
    explanation = "Revisar: " + penalties.join("; ");
  } else {
    const extracted = job.description ? extractTechnologies(job.description) : [];
    const allJobTechs = new Set([...job.technologies, ...extracted].map((t) => t.toLowerCase().trim()).filter(Boolean));
    const profileSkills = profile.skills.map(s => s.toLowerCase().trim());
    const matchedTechs = [...allJobTechs].filter(t => profileSkills.includes(t)).map(t => capitalize(t));

    if (matchedTechs.length > 0) {
      explanation = scoreLabel + ": foca em " + matchedTechs.slice(0, 3).join(", ");
    } else {
      explanation = scoreLabel + " para " + cleanTitle;
    }
  }

  const explanationDetail = `Classificação de Domínio: ${domain}. ` +
    (penalties.length > 0 ? `Alertas/Gates aplicados: ${penalties.join(", ")}.` : `Correspondência de senioridade e requisitos técnicos excelente.`);

  return {
    score: total,
    details: {
      title: Math.round(areaScore * 100) / 100,
      skills: Math.round(skillScore * 100) / 100,
      experience: Math.round(experienceScore * 100) / 100,
      location: Math.round(locationScore * 100) / 100,
      salary: Math.round(salaryScore * 100) / 100,
      contract: Math.round(contractScore * 100) / 100,
      total: total,
      scoreLabel,
      fitLabel,
      domain,
      domainMatch: !isIncompatibleDomain,
      seniorityMatch: !isSeniorMismatch,
      penalties,
      warnings,
      explanation,
      explanationDetail,
    },
  };
}

function computeRecencyScore(postedAt: string | null | undefined): number {
  if (!postedAt) return 0.5;
  const diff = Date.now() - new Date(postedAt).getTime();
  const days = diff / 86400000;
  if (days < 7) return 1.0;
  if (days < 14) return 0.7;
  if (days < 30) return 0.4;
  return 0.1;
}

function computeSkillScore(technologies: string[], description: string | null, profileSkills: string[]): number {
  if (!profileSkills.length) return 0.5;

  const extracted = description ? extractTechnologies(description) : [];
  const allJobTechs = new Set([...technologies, ...extracted].map((t) => t.toLowerCase().trim()).filter(Boolean));
  const skills = profileSkills.map((s) => s.toLowerCase().trim()).filter(Boolean);

  if (allJobTechs.size === 0) return 0.4;

  let exactMatches = 0;
  let partialMatches = 0;

  for (const jobTech of allJobTechs) {
    let matched = false;
    for (const skill of skills) {
      if (skill === jobTech || jobTech.includes(skill) || skill.includes(jobTech)) {
        exactMatches++;
        matched = true;
        break;
      }
    }
    if (!matched) {
      for (const skill of skills) {
        const relations = TECH_RELATIONS[capitalize(skill)] || [];
        if (relations.some((r) => r.toLowerCase() === jobTech || jobTech.includes(r.toLowerCase()))) {
          partialMatches++;
          break;
        }
      }
    }
  }

  const totalMatches = exactMatches + partialMatches * 0.6;
  const maxPossible = Math.max(allJobTechs.size, 1);
  return Math.min(totalMatches / maxPossible, 1);
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function computeAreaScore(title: string, description: string | null, desiredRoles: string[]): number {
  if (!desiredRoles.length) return 0.5;

  const jobCategories = detectRoleCategory(title, description);
  const desiredWords = desiredRoles.map((r) => r.toLowerCase());

  const isInternshipOrTrainee = desiredWords.some((w) => w.includes("estágio") || w.includes("internship") || w.includes("trainee") || w.includes("junior") || w.includes("júnior"));
  const titleLower = title.toLowerCase();
  const titleIsInternship = titleLower.includes("estágio") || titleLower.includes("internship") || titleLower.includes("intern") || titleLower.includes("estagiário") || titleLower.includes("trainee") || titleLower.includes("jr");

  const areaMatch = desiredWords.some((role) => {
    if (role.includes("dados") || role.includes("data")) {
      return jobCategories.some((c) => c.includes("data") || c.includes("analytics") || c.includes("estat"));
    }
    if (role.includes("analytics") || role.includes("bi") || role.includes("intelligence")) {
      return jobCategories.some((c) => c.includes("analytics") || c.includes("data"));
    }
    if (role.includes("engenharia") || role.includes("engineer")) {
      return jobCategories.some((c) => c.includes("engineering") || c.includes("backend") || c.includes("full"));
    }
    if (role.includes("full") || role.includes("stack")) {
      return jobCategories.some((c) => c.includes("full") || c.includes("backend") || c.includes("frontend"));
    }
    const roleWords = role.split(/\s+/);
    return roleWords.some((w) => titleLower.includes(w));
  });

  if (!areaMatch) return 0.3;

  if (isInternshipOrTrainee && titleIsInternship) return 1;
  if (titleIsInternship) return 0.9;
  if (isInternshipOrTrainee && !titleLower.includes("senior") && !titleLower.includes("sr") && !titleLower.includes("lead")) return 0.8;

  return 0.7;
}

function computeExperienceScore(jobLevel: ExperienceLevel | null, profileLevel: string | null, title: string): number {
  const levels: Record<string, number> = { internship: 0, trainee: 1, junior: 2, mid: 3, senior: 4, lead: 5 };

  const isProfileEntryLevel = !profileLevel || levels[profileLevel] === undefined || levels[profileLevel] <= 2;

  const t = title.toLowerCase();
  const jobIsSenior = t.includes("senior") || t.includes("sênior") || t.includes("sr.") || t.includes("lead") || t.includes("staff") || t.includes("principal");
  const jobIsEntry = t.includes("estágio") || t.includes("internship") || t.includes("intern") || t.includes("trainee") || t.includes("junior") || t.includes("júnior") || t.includes("jr") || t.includes("pleno") || t.includes("mid");

  if (isProfileEntryLevel && jobIsSenior) return 0.1;
  if (isProfileEntryLevel && jobIsEntry) return 1;
  if (isProfileEntryLevel && !jobIsSenior) return 0.7;

  if (!jobLevel || !profileLevel) {
    if (jobIsEntry) return 0.8;
    if (jobIsSenior) return 0.3;
    return 0.5;
  }

  const j = levels[jobLevel] ?? 2;
  const p = levels[profileLevel] ?? 2;
  const diff = Math.abs(j - p);

  if (diff === 0) return 1;
  if (diff === 1) return 0.5;
  return 0.0;
}

function computeLocationScore(jobLocation: LocationType | null, desiredLocations: string[]): number {
  if (!jobLocation || !desiredLocations.length) return 0.5;
  if (desiredLocations.includes(jobLocation)) return 1;
  if (desiredLocations.includes("remote") && jobLocation === "hybrid") return 0.8;
  if (desiredLocations.includes("remote") && jobLocation === "onsite") return 0.3;
  if (desiredLocations.includes("hybrid") && jobLocation === "onsite") return 0.5;
  if (desiredLocations.includes("hybrid") && jobLocation === "remote") return 0.8;
  return 0.2;
}

function computeSalaryScore(
  jobMin: number | null, jobMax: number | null, jobCurrency: string | null,
  desiredMin: number | null, desiredMax: number | null, desiredCurrency: string | null
): number {
  if (!jobMin && !jobMax) return 0.6;
  if (!desiredMin && !desiredMax) return 0.5;

  const jMin = jobMin ?? 0;
  const jMax = jobMax ?? (jMin > 0 ? jMin * 1.5 : 5000);
  const dMin = desiredMin ?? 0;
  const dMax = desiredMax ?? 999999;

  if (jMax >= dMin && jMin <= dMax) return 1;
  if (jMax >= dMin * 0.5) return 0.7;
  return 0.4;
}

function computeContractScore(jobContract: ContractType | null, desiredContracts: string[]): number {
  if (!jobContract || !desiredContracts.length) return 0.5;
  if (desiredContracts.includes(jobContract)) return 1;
  if (jobContract === "internship" && desiredContracts.some((d) => d.includes("intern") || d === "clt")) return 0.8;
  if (jobContract === "clt" && desiredContracts.includes("internship")) return 0.7;
  return 0.3;
}
