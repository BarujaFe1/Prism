/**
 * Deterministic synthetic demo dataset for Prism.
 * Safe for public demos — no real applications, notes, or personal contacts.
 *
 * Usage:
 *   DATABASE_URL=file:demo.db npm run demo:seed
 *   DATABASE_URL=file:demo.db CONFIRM=1 npm run demo:reset
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { computeScore } from "../src/engine/scorer";
import type { ProfileData, LocationType, ContractType, ExperienceLevel, JobStatus } from "../src/types";

const url = process.env.DATABASE_URL || "file:demo.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;
const client = createClient(authToken ? { url, authToken } : { url });
const db = drizzle(client, { schema });

const DAYS = (n: number) => new Date(Date.UTC(2026, 6, 20) - n * 86400000).toISOString();

type DemoJob = {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  locationType: LocationType;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  salaryPeriod: "monthly" | "yearly" | "hourly";
  contractType: ContractType;
  experienceLevel: ExperienceLevel;
  technologies: string[];
  tags: string[];
  source: string;
  sourceId: string;
  url: string;
  postedAt: string;
  status: JobStatus;
};

const DEMO_JOBS: DemoJob[] = [
  {
    id: "demo-job-001",
    title: "Estágio Full-Stack TypeScript",
    company: "Orbita Labs",
    description:
      "Estágio em produto web com React, Next.js, TypeScript e APIs Node. Mentoria, code review e foco em entregas pequenas. SQL básico desejável.",
    location: "São Paulo, SP (híbrido)",
    locationType: "hybrid",
    salaryMin: 1800,
    salaryMax: 2500,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "internship",
    experienceLevel: "internship",
    technologies: ["TypeScript", "React", "Next.js", "Node.js", "SQL"],
    tags: ["internship", "product"],
    source: "manual",
    sourceId: "demo-001",
    url: "https://example.com/jobs/demo-001",
    postedAt: DAYS(1),
    status: "high_priority",
  },
  {
    id: "demo-job-002",
    title: "Desenvolvedor(a) Júnior React",
    company: "Nexus Digital",
    description:
      "Time de front-end construindo dashboards com React, TypeScript e testes. Trabalho com designers e product. Inglês para leitura de docs.",
    location: "Remoto — Brasil",
    locationType: "remote",
    salaryMin: 4500,
    salaryMax: 6500,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "clt",
    experienceLevel: "junior",
    technologies: ["React", "TypeScript", "Tailwind CSS", "Jest"],
    tags: ["frontend", "remote-br"],
    source: "gupy",
    sourceId: "demo-002",
    url: "https://example.com/jobs/demo-002",
    postedAt: DAYS(2),
    status: "preparing",
  },
  {
    id: "demo-job-003",
    title: "Backend Node.js Júnior",
    company: "Atlas Data",
    description:
      "APIs REST com Node.js, TypeScript, PostgreSQL e filas. Observabilidade básica. Cultura de testes e PRs pequenos.",
    location: "Campinas, SP",
    locationType: "hybrid",
    salaryMin: 5000,
    salaryMax: 7000,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "clt",
    experienceLevel: "junior",
    technologies: ["Node.js", "TypeScript", "PostgreSQL", "SQL"],
    tags: ["backend", "apis"],
    source: "linkedin",
    sourceId: "demo-003",
    url: "https://example.com/jobs/demo-003",
    postedAt: DAYS(3),
    status: "applied",
  },
  {
    id: "demo-job-004",
    title: "Trainee Engenharia de Software",
    company: "Mercado Livre",
    description:
      "Programa trainee full-stack. Java ou Node, SQL, cloud basics. Processo seletivo longo com cases.",
    location: "São Paulo, SP",
    locationType: "hybrid",
    salaryMin: 5500,
    salaryMax: 6500,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "clt",
    experienceLevel: "trainee",
    technologies: ["Java", "SQL", "AWS", "Git"],
    tags: ["trainee", "scale"],
    source: "gupy",
    sourceId: "demo-004",
    url: "https://example.com/jobs/demo-004",
    postedAt: DAYS(4),
    status: "reviewing",
  },
  {
    id: "demo-job-005",
    title: "Analista de Dados Júnior",
    company: "Insight BR",
    description:
      "Pipelines leves, SQL, Python/Pandas e dashboards. Colaboração com produto. Estatística aplicada é um diferencial.",
    location: "Remoto — Brasil",
    locationType: "remote",
    salaryMin: 4800,
    salaryMax: 6200,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "clt",
    experienceLevel: "junior",
    technologies: ["Python", "SQL", "Pandas", "Power BI"],
    tags: ["data", "analytics"],
    source: "linkedin",
    sourceId: "demo-005",
    url: "https://example.com/jobs/demo-005",
    postedAt: DAYS(5),
    status: "saved",
  },
  {
    id: "demo-job-006",
    title: "Full-Stack Developer (Next.js)",
    company: "Studio Norte",
    description:
      "Produto B2B com Next.js App Router, React 19, Drizzle e SQLite/libSQL. Ownership de features ponta a ponta.",
    location: "Remoto",
    locationType: "remote",
    salaryMin: 7000,
    salaryMax: 10000,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "pj",
    experienceLevel: "junior",
    technologies: ["Next.js", "React", "TypeScript", "Drizzle", "SQLite"],
    tags: ["fullstack", "product"],
    source: "remoteok",
    sourceId: "demo-006",
    url: "https://example.com/jobs/demo-006",
    postedAt: DAYS(1),
    status: "interview",
  },
  {
    id: "demo-job-007",
    title: "Software Engineer — Intern",
    company: "Globex",
    description:
      "Internship building internal tools with TypeScript and React. Pair programming and weekly demos.",
    location: "Remote — Worldwide",
    locationType: "remote",
    salaryMin: 20,
    salaryMax: 25,
    currency: "USD",
    salaryPeriod: "hourly",
    contractType: "internship",
    experienceLevel: "internship",
    technologies: ["TypeScript", "React", "Git"],
    tags: ["international", "internship"],
    source: "wellfound",
    sourceId: "demo-007",
    url: "https://example.com/jobs/demo-007",
    postedAt: DAYS(6),
    status: "new",
  },
  {
    id: "demo-job-008",
    title: "Desenvolvedor Mobile React Native",
    company: "AppCasa",
    description:
      "Apps iOS/Android com React Native e TypeScript. Integração com APIs REST e publicação nas stores.",
    location: "Rio de Janeiro, RJ",
    locationType: "onsite",
    salaryMin: 6000,
    salaryMax: 8500,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "clt",
    experienceLevel: "junior",
    technologies: ["React Native", "TypeScript", "Expo"],
    tags: ["mobile"],
    source: "linkedin",
    sourceId: "demo-008",
    url: "https://example.com/jobs/demo-008",
    postedAt: DAYS(8),
    status: "new",
  },
  {
    id: "demo-job-009",
    title: "Senior Staff Platform Architect",
    company: "MegaCorp",
    description:
      "Lead multi-region Kafka event sourcing Kubernetes mesh for mission-critical billing. 12+ years required. Rockstar ninja wizard culture.",
    location: "New York, NY",
    locationType: "onsite",
    salaryMin: 250000,
    salaryMax: 320000,
    currency: "USD",
    salaryPeriod: "yearly",
    contractType: "international",
    experienceLevel: "lead",
    technologies: ["Kubernetes", "Kafka", "Go", "Terraform"],
    tags: ["senior", "red-flag"],
    source: "linkedin",
    sourceId: "demo-009",
    url: "https://example.com/jobs/demo-009",
    postedAt: DAYS(10),
    status: "ignored",
  },
  {
    id: "demo-job-010",
    title: "Sales Development Representative",
    company: "QuotaUp",
    description:
      "Cold calling, outbound sales, CRM hunting. Marketing campaigns and quota crushing. No coding.",
    location: "São Paulo, SP",
    locationType: "onsite",
    salaryMin: 3000,
    salaryMax: 5000,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "clt",
    experienceLevel: "junior",
    technologies: [],
    tags: ["sales", "mismatch"],
    source: "linkedin",
    sourceId: "demo-010",
    url: "https://example.com/jobs/demo-010",
    postedAt: DAYS(2),
    status: "ignored",
  },
  {
    id: "demo-job-011",
    title: "Product Engineer Júnior",
    company: "Harbor",
    description:
      "Engenharia orientada a produto: Next.js, Node, SQL, analytics de funil. Escrever RFCs curtas e medir impacto.",
    location: "Remoto — Brasil",
    locationType: "remote",
    salaryMin: 5500,
    salaryMax: 8000,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "pj",
    experienceLevel: "junior",
    technologies: ["Next.js", "TypeScript", "Node.js", "SQL", "PostgreSQL"],
    tags: ["product-engineer"],
    source: "wellfound",
    sourceId: "demo-011",
    url: "https://example.com/jobs/demo-011",
    postedAt: DAYS(0),
    status: "saved",
  },
  {
    id: "demo-job-012",
    title: "Estágio em Ciência de Dados",
    company: "USP Spinoff Demo",
    description:
      "Estágio em modelagem estatística, Python, SQL e comunicação de achados. Projetos com dados públicos brasileiros.",
    location: "São Carlos, SP",
    locationType: "hybrid",
    salaryMin: 1500,
    salaryMax: 2200,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "internship",
    experienceLevel: "internship",
    technologies: ["Python", "SQL", "Statistics", "Pandas"],
    tags: ["data", "internship"],
    source: "manual",
    sourceId: "demo-012",
    url: "https://example.com/jobs/demo-012",
    postedAt: DAYS(3),
    status: "new",
  },
  {
    id: "demo-job-013",
    title: "QA Automation Junior",
    company: "Quality Grid",
    description:
      "Testes E2E com Playwright, CI no GitHub Actions, revisão de acessibilidade básica.",
    location: "Remoto — Brasil",
    locationType: "remote",
    salaryMin: 4200,
    salaryMax: 5800,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "clt",
    experienceLevel: "junior",
    technologies: ["Playwright", "TypeScript", "GitHub Actions"],
    tags: ["qa", "ci"],
    source: "gupy",
    sourceId: "demo-013",
    url: "https://example.com/jobs/demo-013",
    postedAt: DAYS(7),
    status: "new",
  },
  {
    id: "demo-job-014",
    title: "Desenvolvedor(a) Full-Stack PJ",
    company: "Consultoria Delta",
    description:
      "Projetos curtos com React, Node e SQL. Cliente fintech. Disponibilidade parcial 20h/semana.",
    location: "Remoto",
    locationType: "remote",
    salaryMin: 80,
    salaryMax: 120,
    currency: "BRL",
    salaryPeriod: "hourly",
    contractType: "pj",
    experienceLevel: "junior",
    technologies: ["React", "Node.js", "SQL", "TypeScript"],
    tags: ["freelance-like", "pj"],
    source: "manual",
    sourceId: "demo-014",
    url: "https://example.com/jobs/demo-014",
    postedAt: DAYS(4),
    status: "offer",
  },
  {
    id: "demo-job-015",
    title: "Frontend Mid-Level Angular",
    company: "Legacy Soft",
    description:
      "Manutenção de monolito AngularJS legado, jQuery e IE11. Pouco TypeScript moderno.",
    location: "Belo Horizonte, MG",
    locationType: "onsite",
    salaryMin: 9000,
    salaryMax: 12000,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "clt",
    experienceLevel: "mid",
    technologies: ["AngularJS", "jQuery", "JavaScript"],
    tags: ["legacy", "partial-fit"],
    source: "linkedin",
    sourceId: "demo-015",
    url: "https://example.com/jobs/demo-015",
    postedAt: DAYS(12),
    status: "rejected",
  },
  {
    id: "demo-job-016",
    title: "Junior Platform Engineer",
    company: "Cloudseed",
    description:
      "CI/CD, Docker, monitoramento e scripts TypeScript. Contato com times de produto.",
    location: "Remoto — LATAM",
    locationType: "remote",
    salaryMin: 2500,
    salaryMax: 3500,
    currency: "USD",
    salaryPeriod: "monthly",
    contractType: "international",
    experienceLevel: "junior",
    technologies: ["Docker", "TypeScript", "GitHub Actions", "Linux"],
    tags: ["platform", "devops-lite"],
    source: "remoteok",
    sourceId: "demo-016",
    url: "https://example.com/jobs/demo-016",
    postedAt: DAYS(2),
    status: "new",
  },
  {
    id: "demo-job-017",
    title: "Estágio Front-End",
    company: "Pixel&Code",
    description:
      "Landing pages responsivas com React e Tailwind. Acessibilidade e performance básicas.",
    location: "Curitiba, PR",
    locationType: "hybrid",
    salaryMin: 1400,
    salaryMax: 2000,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "internship",
    experienceLevel: "internship",
    technologies: ["React", "Tailwind CSS", "HTML", "CSS"],
    tags: ["frontend", "internship"],
    source: "manual",
    sourceId: "demo-017",
    url: "https://example.com/jobs/demo-017",
    postedAt: DAYS(1),
    status: "testing",
  },
  {
    id: "demo-job-018",
    title: "Data Engineer Júnior",
    company: "PipeBR",
    description:
      "ETL com Python, SQL e orquestração simples. Documentar qualidade de dados e alertas.",
    location: "São Paulo, SP",
    locationType: "hybrid",
    salaryMin: 6000,
    salaryMax: 8500,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "clt",
    experienceLevel: "junior",
    technologies: ["Python", "SQL", "Airflow", "PostgreSQL"],
    tags: ["data-eng"],
    source: "gupy",
    sourceId: "demo-018",
    url: "https://example.com/jobs/demo-018",
    postedAt: DAYS(9),
    status: "new",
  },
  {
    id: "demo-job-019",
    title: "Full-Stack TypeScript — Portugal",
    company: "Lisboa Soft",
    description:
      "Produto SaaS com Next.js e Node. Visto/relocação possível. Inglês avançado.",
    location: "Lisboa, Portugal",
    locationType: "hybrid",
    salaryMin: 1800,
    salaryMax: 2400,
    currency: "EUR",
    salaryPeriod: "monthly",
    contractType: "international",
    experienceLevel: "junior",
    technologies: ["TypeScript", "Next.js", "Node.js", "PostgreSQL"],
    tags: ["portugal", "relocation"],
    source: "linkedin",
    sourceId: "demo-019",
    url: "https://example.com/jobs/demo-019",
    postedAt: DAYS(5),
    status: "saved",
  },
  {
    id: "demo-job-020",
    title: "Automation Engineer (scripts + APIs)",
    company: "OpsFlow",
    description:
      "Automações com TypeScript/Python, scraping ético de fontes públicas, webhooks e relatórios.",
    location: "Remoto — Brasil",
    locationType: "remote",
    salaryMin: 5000,
    salaryMax: 7500,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "pj",
    experienceLevel: "junior",
    technologies: ["TypeScript", "Python", "APIs", "Node.js"],
    tags: ["automation"],
    source: "manual",
    sourceId: "demo-020",
    url: "https://example.com/jobs/demo-020",
    postedAt: DAYS(3),
    status: "new",
  },
  {
    id: "demo-job-021",
    title: "Desenvolvedor(a) Júnior — Fintech",
    company: "CarteiraX",
    description:
      "Microsserviços Node, SQL, testes e on-call leve. Compliance e dados sensíveis — sem atalhos de segurança.",
    location: "São Paulo, SP",
    locationType: "hybrid",
    salaryMin: 6500,
    salaryMax: 9000,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "clt",
    experienceLevel: "junior",
    technologies: ["Node.js", "TypeScript", "PostgreSQL", "Jest"],
    tags: ["fintech", "security"],
    source: "greenhouse",
    sourceId: "demo-021",
    url: "https://example.com/jobs/demo-021",
    postedAt: DAYS(2),
    status: "archived",
  },
  {
    id: "demo-job-022",
    title: "Junior Full Stack (duplicate A)",
    company: "Twin Co",
    description: "React TypeScript Node SQL product team building dashboards.",
    location: "Remote",
    locationType: "remote",
    salaryMin: 5000,
    salaryMax: 7000,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "clt",
    experienceLevel: "junior",
    technologies: ["React", "TypeScript", "Node.js", "SQL"],
    tags: ["dedupe"],
    source: "remoteok",
    sourceId: "demo-022a",
    url: "https://example.com/jobs/demo-022-a",
    postedAt: DAYS(1),
    status: "new",
  },
  {
    id: "demo-job-023",
    title: "Junior Full Stack (duplicate B)",
    company: "Twin Co",
    description: "React TypeScript Node SQL product team building dashboards.",
    location: "Remote",
    locationType: "remote",
    salaryMin: 5000,
    salaryMax: 7000,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "clt",
    experienceLevel: "junior",
    technologies: ["React", "TypeScript", "Node.js", "SQL"],
    tags: ["dedupe"],
    source: "remotive",
    sourceId: "demo-022b",
    url: "https://example.com/jobs/demo-022-b",
    postedAt: DAYS(1),
    status: "new",
  },
  {
    id: "demo-job-024",
    title: "Support Engineer (no code)",
    company: "HelpDesk Pro",
    description: "Customer support tickets, Zendesk, phone shifts. No programming required.",
    location: "Recife, PE",
    locationType: "onsite",
    salaryMin: 2800,
    salaryMax: 3500,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "clt",
    experienceLevel: "junior",
    technologies: [],
    tags: ["support", "mismatch"],
    source: "linkedin",
    sourceId: "demo-024",
    url: "https://example.com/jobs/demo-024",
    postedAt: DAYS(11),
    status: "ignored",
  },
  {
    id: "demo-job-025",
    title: "Estágio Backend Node",
    company: "API First",
    description:
      "Estágio em APIs REST, validação de input, SQL e documentação OpenAPI. Pairing diário.",
    location: "Remoto — Brasil",
    locationType: "remote",
    salaryMin: 1600,
    salaryMax: 2200,
    currency: "BRL",
    salaryPeriod: "monthly",
    contractType: "internship",
    experienceLevel: "internship",
    technologies: ["Node.js", "TypeScript", "SQL", "PostgreSQL"],
    tags: ["backend", "internship"],
    source: "manual",
    sourceId: "demo-025",
    url: "https://example.com/jobs/demo-025",
    postedAt: DAYS(0),
    status: "high_priority",
  },
];

const DEMO_PROFILE: ProfileData = {
  name: "Demo Candidate",
  headline: "Full-Stack júnior · Estatística e Ciência de Dados (USP)",
  summary:
    "Perfil sintético para demonstração do Prism. Skills alinhadas a TypeScript, React/Next.js, Node, SQL e dados — sem dados pessoais reais.",
  skills: [
    "TypeScript",
    "JavaScript",
    "React",
    "Next.js",
    "Node.js",
    "SQL",
    "PostgreSQL",
    "Python",
    "Pandas",
    "Git",
    "APIs REST",
  ],
  desiredRoles: [
    "Full Stack",
    "Frontend",
    "Backend",
    "Product Engineer",
    "Estágio",
    "Trainee",
    "Data Analyst",
  ],
  desiredSalaryMin: 2000,
  desiredSalaryMax: 9000,
  desiredCurrency: "BRL",
  desiredLocationTypes: ["remote", "hybrid"],
  desiredContractTypes: ["internship", "clt", "pj"],
  experienceLevel: "junior",
  languages: ["pt", "en"],
  negativeKeywords: ["sales", "marketing", "cold calling"],
};

function assertDemoUrl(target: string) {
  const allowed =
    target.includes("demo") ||
    target.includes("ci.db") ||
    process.env.PRISM_ALLOW_DEMO_SEED === "1";
  if (!allowed) {
    throw new Error(
      `Refusing to seed non-demo DATABASE_URL (${target}). Use file:demo.db or set PRISM_ALLOW_DEMO_SEED=1.`
    );
  }
}

export async function resetDemo(opts?: { skipConfirm?: boolean }) {
  assertDemoUrl(url);
  if (!opts?.skipConfirm && process.env.CONFIRM !== "1") {
    throw new Error("demo:reset requires CONFIRM=1");
  }

  // Order matters for FKs — wipe known demo tables used by the UI
  await db.delete(schema.applicationTasks);
  await db.delete(schema.jobFollowups);
  await db.delete(schema.jobEvents);
  await db.delete(schema.jobSources);
  await db.delete(schema.jobs);
  await db.delete(schema.connectorLogs);
  await db.delete(schema.sources);
  await db.delete(schema.settings).where(eq(schema.settings.id, "default"));
  await db.delete(schema.profile).where(eq(schema.profile.id, "default"));
  console.log("Demo database cleared.");
}

export async function seedDemo() {
  assertDemoUrl(url);

  const existing = await db.select({ id: schema.jobs.id }).from(schema.jobs).limit(1);
  if (existing.length > 0 && process.env.FORCE !== "1") {
    console.log("Database already has jobs. Re-run with FORCE=1 after demo:reset, or use a fresh file:demo.db");
    return;
  }

  if (process.env.FORCE === "1") {
    await resetDemo({ skipConfirm: true });
  }

  const now = new Date().toISOString();

  for (const job of DEMO_JOBS) {
    const { score, details } = computeScore(
      {
        title: job.title,
        description: job.description,
        technologies: job.technologies,
        locationType: job.locationType,
        contractType: job.contractType,
        experienceLevel: job.experienceLevel,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        currency: job.currency,
        salaryPeriod: job.salaryPeriod,
        postedAt: job.postedAt,
        location: job.location,
        company: job.company,
      },
      DEMO_PROFILE
    );

    const fitLabel =
      (details as { fitLabel?: string }).fitLabel ||
      (score >= 0.75 ? "high" : score >= 0.5 ? "good" : score >= 0.3 ? "partial" : "low");

    await db.insert(schema.jobs).values({
      id: job.id,
      title: job.title,
      company: job.company,
      description: job.description,
      location: job.location,
      locationType: job.locationType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      currency: job.currency,
      salaryPeriod: job.salaryPeriod,
      contractType: job.contractType,
      experienceLevel: job.experienceLevel,
      technologies: job.technologies,
      tags: job.tags,
      source: job.source,
      sourceId: job.sourceId,
      url: job.url,
      postedAt: job.postedAt,
      fetchedAt: now,
      isNormalized: true,
      score: Math.round(score * 100) / 100,
      scoreDetails: details,
      fitLabel: fitLabel as "high" | "good" | "partial" | "low",
      status: job.status,
      hash: `demo-hash-${job.id}`,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(schema.jobEvents).values({
      id: `demo-event-${job.id}`,
      jobId: job.id,
      eventType: "discovered",
      description: `Vaga sintética de demo via ${job.source}`,
      occurredAt: job.postedAt,
    });
  }

  await db.insert(schema.sources).values([
    { id: "demo-src-manual", name: "Manual (demo)", type: "manual", config: null },
    { id: "demo-src-gupy", name: "Gupy (demo)", type: "gupy", config: null },
    { id: "demo-src-remoteok", name: "Remote OK (demo)", type: "remoteok", config: null },
  ]);

  await db.insert(schema.profile).values({
    id: "default",
    name: DEMO_PROFILE.name,
    headline: DEMO_PROFILE.headline,
    summary: DEMO_PROFILE.summary,
    skills: DEMO_PROFILE.skills,
    desiredRoles: DEMO_PROFILE.desiredRoles,
    desiredSalaryMin: DEMO_PROFILE.desiredSalaryMin,
    desiredSalaryMax: DEMO_PROFILE.desiredSalaryMax,
    desiredCurrency: DEMO_PROFILE.desiredCurrency,
    desiredLocationTypes: DEMO_PROFILE.desiredLocationTypes,
    desiredContractTypes: DEMO_PROFILE.desiredContractTypes,
    experienceLevel: DEMO_PROFILE.experienceLevel,
    languages: DEMO_PROFILE.languages,
    negativeKeywords: DEMO_PROFILE.negativeKeywords,
    updatedAt: now,
  });

  await db.insert(schema.settings).values({
    id: "default",
    syncFrequency: "0",
    notificationsEnabled: false,
    dailyBriefingEnabled: true,
  });

  console.log(`Seeded ${DEMO_JOBS.length} synthetic demo jobs into ${url}`);
}

async function main() {
  const mode = process.argv[2] || "seed";
  if (mode === "reset") {
    await resetDemo();
  } else {
    await seedDemo();
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
