/**
 * Default career tracks — two equal primary verticals: Dev and Dados.
 * Frontend/Backend are optional Dev sub-tracks; AI/Mobile stay off until evidenced.
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
    label: "Dev · Full-Stack / Engenharia de Software",
    active: true,
    priority: 1,
    weight: 1,
    roleTitles: [
      "Estágio em Desenvolvimento de Software",
      "Desenvolvedor Full-Stack Júnior",
      "Product Engineer Júnior",
      "Software Engineer Júnior",
      "Desenvolvedor Frontend Júnior",
      "Desenvolvedor Backend Júnior",
    ],
    coreSkills: ["TypeScript", "React", "Next.js", "Node.js", "SQL", "APIs REST", "Git"],
    secondarySkills: ["PostgreSQL", "SQLite", "Drizzle ORM", "Tailwind CSS", "Vitest", "GitHub Actions"],
    headline:
      "Dev · Full-Stack | TypeScript, React, Next.js, Node.js | produtos web e APIs",
    resumeUrl: "https://barujafe.vercel.app/resume/curriculo-ptbr.pdf",
    markets: ["brazil", "portugal_cplp", "latin_america"],
    contracts: ["internship", "clt", "pj"],
    negativeKeywords: ["SDR", "BDR", "cold calling", "telemarketing"],
    notes:
      "Vertente Dev (esforço igual à de Dados). Evidências: Prism, Maestro, LançaEnsaio.",
  },
  {
    id: "track-data",
    key: "data_analytics",
    label: "Dados · Analista / Analytics · Estatística USP",
    active: true,
    priority: 1,
    weight: 1,
    roleTitles: [
      "Estágio em Dados / Analytics",
      "Analista de Dados Júnior",
      "Data Analyst Júnior",
      "Analytics Engineer Júnior",
      "Estágio em Estatística / Ciência de Dados",
      "Estágio em Business Intelligence",
    ],
    coreSkills: [
      "Python",
      "Pandas",
      "SQL",
      "Estatística",
      "Data Quality",
      "ETL",
      "Análise exploratória",
    ],
    secondarySkills: ["FastAPI", "PostgreSQL", "Power BI", "Recharts", "Excel", "Experimentação"],
    headline:
      "Dados · Analista / Analytics | Python, SQL, Estatística USP | qualidade de dados e produtos analíticos",
    resumeUrl: "https://barujafe.vercel.app/resume/curriculo-ptbr.pdf",
    markets: ["brazil", "portugal_cplp"],
    contracts: ["internship", "clt"],
    negativeKeywords: ["SDR", "estágio comercial", "telemarketing"],
    notes:
      "Vertente Dados (esforço igual à Dev). Alinha com Estatística e Ciência de Dados na USP. Evidências: DataFlow, OpsLedger, SignalHub.",
  },
  {
    id: "track-frontend",
    key: "frontend",
    label: "Dev · sub Front-End React / Next.js",
    active: true,
    priority: 3,
    weight: 0.7,
    roleTitles: ["Desenvolvedor Front-End React/Next.js Júnior", "Estágio Frontend"],
    coreSkills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "JavaScript"],
    secondarySkills: ["Recharts", "Vitest", "Acessibilidade"],
    headline: "Dev · Frontend React/Next.js | TypeScript",
    resumeUrl: null,
    markets: ["brazil"],
    contracts: ["internship", "clt"],
    negativeKeywords: [],
    notes: "Sub-track da vertente Dev — mesma família de esforço.",
  },
  {
    id: "track-backend",
    key: "backend",
    label: "Dev · sub Back-End Node.js / APIs",
    active: true,
    priority: 3,
    weight: 0.7,
    roleTitles: ["Desenvolvedor Back-End Node.js Júnior", "Estágio Backend"],
    coreSkills: ["Node.js", "TypeScript", "APIs REST", "SQL", "PostgreSQL"],
    secondarySkills: ["FastAPI", "SQLite", "Drizzle ORM", "GitHub Actions"],
    headline: "Dev · Backend / APIs | Node.js, TypeScript, SQL",
    resumeUrl: null,
    markets: ["brazil"],
    contracts: ["internship", "clt", "pj"],
    negativeKeywords: [],
    notes: "Sub-track da vertente Dev — mesma família de esforço.",
  },
  {
    id: "track-ai",
    key: "ai_automation",
    label: "Dados · sub AI aplicada / Automação",
    active: false,
    priority: 5,
    weight: 0.45,
    roleTitles: ["Estágio em Automação / Dados", "Desenvolvedor de Automação"],
    coreSkills: ["Python", "APIs REST", "Automação", "Integração de APIs"],
    secondarySkills: ["TypeScript", "GitHub Actions", "SQL"],
    headline: "Dados · Automação e integrações | Python",
    resumeUrl: null,
    markets: ["brazil"],
    contracts: ["internship", "freelancer"],
    negativeKeywords: [],
    notes: "Sub da vertente Dados. Só ativar com evidência — não se posicionar como AI Engineer.",
  },
  {
    id: "track-mobile",
    key: "mobile",
    label: "Dev · sub Mobile / React Native",
    active: false,
    priority: 6,
    weight: 0.4,
    roleTitles: ["Desenvolvedor Mobile React Native"],
    coreSkills: ["React Native", "Expo", "TypeScript", "JavaScript", "Supabase"],
    secondarySkills: ["PostgreSQL", "APIs REST"],
    headline: "Dev · Mobile React Native / Expo",
    resumeUrl: null,
    markets: ["brazil"],
    contracts: ["internship", "clt", "pj"],
    negativeKeywords: [],
    notes: "Sub da vertente Dev. Maestro / LançaEnsaio — só vagas aderentes.",
  },
];
