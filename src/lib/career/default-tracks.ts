/**
 * Default career tracks for Felipe's Career OS.
 */
export type CareerTrackSeed = {
  id: string;
  key: string;
  label: string;
  active: boolean;
  priority: number;
  weight: number;
  roleTitles: string[];
  coreSkills: string[];
  secondarySkills: string[];
  headline: string;
  resumeUrl: string | null;
  markets: string[];
  contracts: string[];
  negativeKeywords: string[];
  notes: string;
};

export const DEFAULT_CAREER_TRACKS: CareerTrackSeed[] = [
  {
    id: "track-fullstack",
    key: "fullstack_product",
    label: "Full-Stack / Product Engineering",
    active: true,
    priority: 1,
    weight: 1,
    roleTitles: [
      "Estágio em Desenvolvimento de Software",
      "Desenvolvedor Full-Stack Júnior",
      "Product Engineer Júnior",
      "Software Engineer Júnior",
    ],
    coreSkills: ["TypeScript", "React", "Next.js", "Node.js", "SQL", "APIs REST", "Git"],
    secondarySkills: ["PostgreSQL", "SQLite", "Drizzle ORM", "Tailwind CSS", "Vitest", "GitHub Actions"],
    headline:
      "Desenvolvedor Full-Stack | TypeScript, React, Next.js, Node.js, Python e SQL | Estatística e Ciência de Dados na USP",
    resumeUrl: "https://barujafe.vercel.app/resume/curriculo-ptbr.pdf",
    markets: ["brazil", "portugal_cplp", "latin_america"],
    contracts: ["internship", "clt", "pj"],
    negativeKeywords: ["SDR", "BDR", "cold calling", "telemarketing"],
    notes: "Track principal. Priorizar evidências Prism, DataFlow, Maestro.",
  },
  {
    id: "track-data",
    key: "data_analytics",
    label: "Data / Analytics / Data Products",
    active: true,
    priority: 2,
    weight: 0.85,
    roleTitles: ["Estágio em Dados / Analytics", "Data Analyst Júnior", "Analytics Engineer Júnior"],
    coreSkills: ["Python", "Pandas", "SQL", "Data Quality", "ETL", "APIs REST"],
    secondarySkills: ["FastAPI", "Recharts", "PostgreSQL", "Estatística aplicada"],
    headline: "Dados e produtos analíticos | Python, SQL, qualidade de dados | Estatística USP",
    resumeUrl: "https://barujafe.vercel.app/resume/curriculo-ptbr.pdf",
    markets: ["brazil", "portugal_cplp"],
    contracts: ["internship", "clt"],
    negativeKeywords: ["SDR", "estágio comercial"],
    notes: "Diferencial da formação. DataFlow / OpsLedger / SignalHub.",
  },
  {
    id: "track-frontend",
    key: "frontend",
    label: "Front-End React / Next.js",
    active: true,
    priority: 3,
    weight: 0.75,
    roleTitles: ["Desenvolvedor Front-End React/Next.js Júnior", "Estágio Frontend"],
    coreSkills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "JavaScript"],
    secondarySkills: ["Recharts", "Vitest", "Acessibilidade"],
    headline: "Frontend React/Next.js | TypeScript | produtos web",
    resumeUrl: null,
    markets: ["brazil"],
    contracts: ["internship", "clt"],
    negativeKeywords: [],
    notes: "Fortalecer com Playwright/a11y no Prism.",
  },
  {
    id: "track-backend",
    key: "backend",
    label: "Back-End Node.js / APIs",
    active: true,
    priority: 4,
    weight: 0.75,
    roleTitles: ["Desenvolvedor Back-End Node.js Júnior", "Estágio Backend"],
    coreSkills: ["Node.js", "TypeScript", "APIs REST", "SQL", "PostgreSQL"],
    secondarySkills: ["FastAPI", "SQLite", "Drizzle ORM", "GitHub Actions"],
    headline: "Backend / APIs | Node.js, TypeScript, SQL",
    resumeUrl: null,
    markets: ["brazil"],
    contracts: ["internship", "clt", "pj"],
    negativeKeywords: [],
    notes: "Evidência via Prism APIs + FastAPI nos labs.",
  },
  {
    id: "track-ai",
    key: "ai_automation",
    label: "AI Applied / Automation",
    active: false,
    priority: 5,
    weight: 0.5,
    roleTitles: ["Desenvolvedor de Automação"],
    coreSkills: ["Python", "APIs REST", "Automação", "Integração de APIs"],
    secondarySkills: ["TypeScript", "GitHub Actions"],
    headline: "Automação e integrações | Python / TypeScript",
    resumeUrl: null,
    markets: ["brazil"],
    contracts: ["internship", "freelancer"],
    negativeKeywords: [],
    notes: "Só ativar com evidência de eval/fallback — não posicionar como AI Engineer.",
  },
  {
    id: "track-mobile",
    key: "mobile",
    label: "Mobile / React Native",
    active: false,
    priority: 6,
    weight: 0.45,
    roleTitles: ["Desenvolvedor Mobile React Native"],
    coreSkills: ["React Native", "Expo", "TypeScript", "JavaScript", "Supabase"],
    secondarySkills: ["PostgreSQL", "APIs REST"],
    headline: "Mobile React Native / Expo | produtos operacionais",
    resumeUrl: null,
    markets: ["brazil"],
    contracts: ["internship", "clt", "pj"],
    negativeKeywords: [],
    notes: "Maestro / LançaEnsaio — ativar só em vagas aderentes.",
  },
];
