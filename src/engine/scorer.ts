import type { ProfileData, ScoreDetails, LocationType, ContractType, ExperienceLevel } from "@/types";
import { checkEligibility, normalizeJobTextForScoring } from "../lib/scoring/scoring-rules";
import { domainToVertical, verticalDomainScore } from "@/lib/career/verticals";

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

export function classifyDomain(title: string): string {
  const t = title.toLowerCase();

  // 1. Incompatible Domains (Hard Gates)
  if (/\b(designer|design|ui\/ux|ux\/ui|figma|photoshop|illustrator|creative director|motion|graphic designer|web designer)\b/i.test(t)) {
    return "design";
  }
  if (/\b(privacy|compliance|lawyer|advogado|juridico|legal|dpo|lgpd)\b/i.test(t)) {
    return "legal";
  }
  if (/\b(sales|vendas|marketing|growth|copywriter|social|customer success|commercial|comercial|business developer|account manager)\b/i.test(t)) {
    return "sales";
  }
  if (/\b(treasury|tesouraria|operations|operações|financeiro|finance|financial|billing|faturamento)\b/i.test(t) && 
      !/\b(data|analyst|analytics|dados|sql|bi)\b/i.test(t)) {
    return "finance_ops";
  }
  if (/\b(admin|administrator|suporte|support|virtual assistant|assistente|helpdesk|receptionist|recepcionista|secretaria|atendimento|sac)\b/i.test(t)) {
    return "admin_support";
  }
  if (/\b(wordpress|elementor|hr|recursos humanos|rh|recruiter|recrutador|talent acquisition)\b/i.test(t)) {
    return "hr_web";
  }

  // 2. Data & Tech Search Families (Felipe's Core Focus)
  if (/\b(data engineer|engenheiro de dados|etl|elt|data pipeline|pipelines? de dados)\b/i.test(t)) {
    return "data_engineering";
  }
  if (/\b(data scientist|cientista de dados|science|cientista|data analyst|analista de dados|estágio em dados|data intern|junior data analyst)\b/i.test(t)) {
    return "data";
  }
  if (/\b(bi|business intelligence|analytics|analytics engineer|product analytics|revenue analytics|marketing analytics|customer analytics|operations analytics|dashboard|power bi|tableau|looker|metabase)\b/i.test(t)) {
    return "bi_analytics";
  }
  if (/\b(produto de dados|data product|data quality|data governance|data profiling|data ops|data automation|qualidade de dados|governança de dados)\b/i.test(t)) {
    return "produto_dados";
  }
  if (/\b(estat[ií]stica|estat[ií]stico|statistics|experimenta[cç][aã]o|teste a\/b|ab testing|causal inference|inference|infer[eê]ncia|modelagem|probabilidade|probability)\b/i.test(t)) {
    return "estatistica";
  }
  if (/\b(ia|ai|inteligência artificial|inteligencia artificial|machine learning|ml|llm|generative ai|prompt engineering|ai evaluation|data labeling|evals|datasets|rag)\b/i.test(t)) {
    return "ia_aplicada";
  }
  if (/\b(fullstack data|full stack data|fullstack analytics|dashboard developer|internal tools|automação|automacao|python developer data|backend data|api analytics)\b/i.test(t)) {
    return "fullstack_dados";
  }
  if (/\b(product engineer|engenheiro de produto)\b/i.test(t)) {
    return "fullstack_backend";
  }
  if (/\b(front[\s-]?end|react developer|ui engineer)\b/i.test(t)) {
    return "frontend";
  }
  if (/\b(full stack|fullstack|full-stack|backend|back end|back-end|nodejs|typescript|node\.js)\b/i.test(t)) {
    return "fullstack_backend";
  }
  if (/\b(software engineer|engenheiro de software|desenvolvedor|developer|programmer|programador|eng\. de software)\b/i.test(t)) {
    return "software_engineering";
  }

  return "unknown";
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
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
  salaryPeriod?: string | null;
  postedAt?: string | null;
  location?: string | null;
  company?: string | null;
  companyPriority?: string | null;
  isOfficialSource?: boolean | null;
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
        fitLabel: "low",
        penalties: [],
        warnings: [],
        explanation: "Perfil não configurado",
        explanationDetail: "",
        fitScore: 0,
        actionabilityScore: 0,
        eligibility: "hard_no",
        decisionLabel: "DISCARD",
      },
    };
  }

  const cleanTitle = job.title.trim().replace(/\s+/g, " ");
  const domain = classifyDomain(cleanTitle);
  const titleLower = cleanTitle.toLowerCase();

  // --- Preprocess Salary Outliers & Corrections ---
  let salaryPeriod = job.salaryPeriod;
  const salaryMin = job.salaryMin;
  const salaryMax = job.salaryMax;
  const currency = job.currency;

  let isOutlier = false;
  let needsReview = false;

  // Correct annual range parsed as hourly
  if (salaryPeriod === "hourly" && currency === "USD") {
    const desc = (job.description || "").toLowerCase();
    const hasAnnualSignals = /year|annually|annual|base salary|salary range/i.test(desc);
    const hasLargeValue = (salaryMin && salaryMin >= 20000 && salaryMin <= 600000) || 
                           (salaryMax && salaryMax >= 20000 && salaryMax <= 600000);
                           
    if (hasAnnualSignals || hasLargeValue) {
      salaryPeriod = "yearly";
    }
  }

  // Detect hourly outliers (>150/h for junior, >250/h for any)
  if (salaryPeriod === "hourly" && currency === "USD") {
    const maxVal = salaryMax || salaryMin || 0;
    if (maxVal > 250) {
      needsReview = true;
      isOutlier = true;
    } else if (maxVal > 150) {
      const profileIsEntry = !profile.experienceLevel || 
        ["internship", "trainee", "junior"].includes(profile.experienceLevel.toLowerCase());
      if (profileIsEntry) {
        isOutlier = true;
      }
    }
  }

  // --- 1. Seniority/Eligibility Gate ---
  const normalizedDesc = normalizeJobTextForScoring(job.description || "");
  const eligibilityResult = checkEligibility(cleanTitle, job.description || "", profile.experienceLevel, profile.negativeKeywords || []);
  let eligibility = eligibilityResult.status;
  const penalties: string[] = [];
  const warnings: string[] = [];

  if (isOutlier) {
    penalties.push("Outlier de remuneração detectado");
    eligibility = "hard_no";
  }

  if (eligibilityResult.explanation && !["eligible", "stretch"].includes(eligibility) && !isOutlier) {
    penalties.push(eligibilityResult.explanation);
  }

  const isIncompatibleDomain = ["design", "legal", "sales", "finance_ops", "admin_support", "hr_web"].includes(domain);

  // --- 2. Fit Score (Brute Technical Match) ---
  const jobTechs = new Set([...(job.technologies || []), ...extractTechnologies(normalizedDesc)].map(t => t.toLowerCase().trim()).filter(Boolean));
  const profileSkills = (profile.skills || []).map(s => s.toLowerCase().trim()).filter(Boolean);

  let techMatches = 0;
  let partialMatches = 0;

  for (const jobTech of jobTechs) {
    if (profileSkills.includes(jobTech)) {
      techMatches++;
    } else {
      // Related skills lookups
      for (const skill of profileSkills) {
        const relations = TECH_RELATIONS[capitalize(skill)] || [];
        if (relations.some(r => r.toLowerCase() === jobTech)) {
          partialMatches++;
          break;
        }
      }
    }
  }

  const skillMatchCount = techMatches + partialMatches * 0.6;
  const fitScore = jobTechs.size > 0 ? Math.min(skillMatchCount / Math.max(jobTechs.size, 1), 1) : 0.4;

  // --- 3. Evidence Score (Checking profile project evidences) ---
  let evidenceScore = 0;
  const matchedEvidences: string[] = [];
  const profileEvidences = profile.skillsEvidence || [];

  if (techMatches > 0) {
    let matchesWithEvidence = 0;
    for (const jobTech of jobTechs) {
      if (profileSkills.includes(jobTech)) {
        // Find if this technology is present in any project evidence
        const hasEvidence = profileEvidences.some((ev: any) => {
          const associated = (ev.associatedSkills || []).map((s: string) => s.toLowerCase().trim());
          return associated.includes(jobTech);
        });

        if (hasEvidence) {
          matchesWithEvidence++;
          matchedEvidences.push(capitalize(jobTech));
        }
      }
    }
    evidenceScore = matchesWithEvidence / techMatches;
  }

  // --- 4. Subscores Calculations for Actionability ---
  // A. Domain / Track Match (20% weight) — Dev e Dados com esforço igual
  const vertical = domainToVertical(domain);
  let domainScore = 0.5;
  if (isIncompatibleDomain) {
    domainScore = 0.0;
  } else if (vertical === "dev" || vertical === "dados") {
    domainScore = verticalDomainScore(vertical);
  }

  // B. Eligibility Score (25% weight)
  let eligibilityScore = 1.0;
  if (eligibility === "stretch") eligibilityScore = 0.7;
  else if (eligibility === "over_senior") eligibilityScore = 0.2;
  else if (["wrong_track", "requires_degree", "sales_business_role", "freelance_noise"].includes(eligibility)) eligibilityScore = 0.1;
  else if (eligibility === "hard_no") eligibilityScore = 0.0;

  // C. Skills Match Score (25% weight)
  const skillsScore = fitScore;

  // D. Evidence Score (15% weight)
  const finalEvidenceScore = evidenceScore;

  // E. Location/Modality/Contract (10% weight)
  let locationScore = 0.5;
  if (job.locationType === "remote" || job.locationType === "hybrid") {
    locationScore = 1.0;
  } else if (job.locationType === "onsite") {
    const isSaoCarlos = /s[ãa]o\s*carlos/i.test(job.location || "");
    locationScore = isSaoCarlos ? 1.0 : 0.2;
    if (!isSaoCarlos) {
      penalties.push("Vaga presencial fora de São Carlos");
    }
  }

  let contractScore = 0.5;
  if (job.contractType && (profile.desiredContractTypes || []).includes(job.contractType)) {
    contractScore = 1.0;
  }

  const modalityScore = (locationScore + contractScore) / 2;

  // F. Salary Transparency & Source (5% weight)
  const salaryScore = (job.salaryMin || job.salaryMax) ? 1.0 : 0.5;
  if (!(job.salaryMin || job.salaryMax) && job.contractType !== "internship") {
    warnings.push("Salário não informado (opacidade)");
  }

  // --- Combined Weighted Actionability Score ---
  let actionabilityScore = 
    domainScore * 0.20 + 
    eligibilityScore * 0.25 + 
    skillsScore * 0.25 + 
    finalEvidenceScore * 0.15 + 
    modalityScore * 0.10 + 
    salaryScore * 0.05;

  // --- Apply Watchlist and Official Source Bonuses ---
  let companyBonus = 0;
  if (job.companyPriority === "P0") companyBonus = 0.12;
  else if (job.companyPriority === "P1") companyBonus = 0.08;
  else if (job.companyPriority === "P2") companyBonus = 0.04;

  const officialBonus = job.isOfficialSource ? 0.03 : 0;

  actionabilityScore += companyBonus + officialBonus;
  actionabilityScore = Math.max(0, Math.min(actionabilityScore, 1));

  // --- Cap Actionability for Ineligibles ---
  const isSuppressed = [
    "over_senior",
    "wrong_track",
    "requires_degree",
    "sales_business_role",
    "freelance_noise",
    "hard_no"
  ].includes(eligibility);

  if (isSuppressed) {
    actionabilityScore = eligibility === "hard_no" ? 0.0 : Math.min(actionabilityScore, 0.20);
  } else if (eligibility === "stretch") {
    actionabilityScore = Math.min(actionabilityScore, 0.60);
  }

  actionabilityScore = Math.round(actionabilityScore * 100) / 100;

  // --- Decision Label Mapping ---
  let decisionLabel: "APPLY_NOW" | "PREPARE_FIRST" | "WATCH" | "LEARN_FIRST" | "SUPPRESSED" | "DISCARD" = "DISCARD";
  let scoreLabel = "Descartar";
  let fitLabel: "high" | "good" | "partial" | "low" = "low";

  if (isSuppressed) {
    decisionLabel = "SUPPRESSED";
    scoreLabel = "Suprimida";
    fitLabel = "low";
  } else {
    if (actionabilityScore >= 0.78) {
      decisionLabel = "APPLY_NOW";
      scoreLabel = "Aplicar agora";
      fitLabel = "high";
    } else if (actionabilityScore >= 0.65) {
      decisionLabel = "PREPARE_FIRST";
      scoreLabel = "Preparar antes";
      fitLabel = "good";
    } else if (actionabilityScore >= 0.48) {
      decisionLabel = "WATCH";
      scoreLabel = "Observar";
      fitLabel = "partial";
    } else if (actionabilityScore >= 0.32) {
      decisionLabel = "LEARN_FIRST";
      scoreLabel = "Estudar primeiro";
      fitLabel = "partial";
    }
  }

  // --- Explanations ---
  let explanation = "";
  if (isSuppressed) {
    explanation = eligibilityResult.explanation || "Suprimida por senioridade/cargo incompatível com perfil atual";
  } else if (decisionLabel === "DISCARD") {
    explanation = penalties.length > 0 ? `Descartar: ${penalties.join("; ")}` : "Baixa aderência geral";
  } else {
    const highlights = matchedEvidences.slice(0, 2);
    if (highlights.length > 0) {
      explanation = `${scoreLabel} · Evidências: ${highlights.join(", ")}`;
    } else {
      explanation = `${scoreLabel} · Aderência técnica e trilha compatível`;
    }
    if (job.companyPriority) {
      explanation += ` (${job.companyPriority} Watchlist)`;
    }
  }

  const explanationDetail = `Vertente: ${vertical}. Domínio: ${domain}. Elegibilidade: ${eligibility}. Evidências: ${matchedEvidences.join(", ") || "nenhuma"}.`;

  const missingGaps = Array.from(jobTechs).filter(t => !profileSkills.includes(t)).map(capitalize);

  return {
    score: actionabilityScore,
    details: {
      title: Math.round(domainScore * 100) / 100,
      skills: Math.round(skillsScore * 100) / 100,
      experience: Math.round(eligibilityScore * 100) / 100,
      location: Math.round(locationScore * 100) / 100,
      salary: Math.round(salaryScore * 100) / 100,
      contract: Math.round(contractScore * 100) / 100,
      total: actionabilityScore,
      scoreLabel,
      fitLabel,
      domain,
      vertical,
      penalties,
      warnings,
      explanation,
      explanationDetail,
      fitScore: Math.round(fitScore * 100) / 100,
      actionabilityScore,
      eligibility,
      decisionLabel,
      matchedEvidences,
      missingGaps,
      needsManualCompensationReview: needsReview,
      compensationOutlier: isOutlier,
    },
  };
}

export function computeRecencyScore(postedAt: string | null | undefined): number {
  if (!postedAt) return 0.5;
  const diff = Date.now() - new Date(postedAt).getTime();
  const days = diff / 86400000;
  if (days < 7) return 1.0;
  if (days < 14) return 0.7;
  if (days < 30) return 0.4;
  return 0.1;
}
