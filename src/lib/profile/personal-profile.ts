/**
 * Perfil pessoal de Felipe Alírio Baruja para uso local do Prism.
 * Não usar na demo pública (scripts/demo-seed.ts permanece sintético).
 */
import type { ContractType, ExperienceLevel, LocationType, ProfileData } from "@/types";

export type SkillEvidence = {
  id: string;
  projectName: string;
  projectUrl: string | null;
  description: string | null;
  metrics: string | null;
  approvedResumeBullet: string | null;
  confidence: "high" | "medium" | "low";
  associatedSkills: string[];
};

export type LearningTask = {
  id: string;
  skill: string;
  title: string;
  reason: string;
  priority: "high" | "medium" | "low";
  evidenceExpected: string;
  status: "todo" | "done";
  dueAt: string | null;
  createdAt: string;
  completedAt?: string | null;
};

export type ApplicationPlan = {
  id: string;
  title: string;
  weeklyTarget: number;
  roleFocus: string[];
  channels: string[];
  notes: string;
  active: boolean;
};

const now = () => new Date().toISOString();
const dueInDays = (days: number) =>
  new Date(Date.now() + days * 86400000).toISOString();

export const PERSONAL_NEGATIVE_KEYWORDS = [
  "cold calling",
  "inside sales",
  "field sales",
  "SDR",
  "BDR",
  "closer",
  "telemarketing",
  "representante comercial",
  "vendedor externo",
  "estágio em marketing",
  "estágio comercial",
  "suporte N1",
  "help desk N1",
  "atendimento ao cliente",
  "cobrança",
  "SAP ABAP",
  "COBOL",
  "Delphi",
  "VBA",
  "Mainframe",
  "WordPress exclusivamente",
  "PHP legado exclusivamente",
];

export const PERSONAL_SKILLS = [
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
  "FastAPI",
  "Supabase",
  "React Native",
  "Expo",
  "SQLite",
  "Drizzle ORM",
  "Tailwind CSS",
  "Recharts",
  "GitHub Actions",
  "Vitest",
  "Data Quality",
  "ETL",
  "Automação",
  "Integração de APIs",
  "Modelagem de Dados",
];

export const PERSONAL_EVIDENCES: SkillEvidence[] = [
  {
    id: "ev-dataflow",
    projectName: "DataFlow",
    projectUrl: "https://github.com/BarujaFe1/DataFlow",
    description:
      "Produto full-stack de qualidade de dados que recebe bases tabulares, executa profiling e limpeza, identifica inconsistências, calcula um Health Score explicável, apresenta evidências estatísticas com limitações declaradas, mascara dados pessoais e gera um relatório executivo.",
    metrics:
      "Snapshot sintético versionado com 305 registros, 17 colunas mapeadas, 300 registros válidos, taxa de validade de 98,4% e Health Score de 82/100. Métricas da demonstração técnica, não de usuários ou produção.",
    approvedResumeBullet:
      "Desenvolvi o DataFlow, produto full-stack de qualidade de dados que transforma CSVs inconsistentes em profiling, issues priorizadas, Health Score explicável, evidências estatísticas e relatório executivo; o snapshot demonstrativo processa 305 registros e apresenta 98,4% de validade.",
    confidence: "high",
    associatedSkills: [
      "Python",
      "Pandas",
      "TypeScript",
      "React",
      "Next.js",
      "FastAPI",
      "APIs REST",
      "Tailwind CSS",
      "Recharts",
      "Git",
      "Data Quality",
      "ETL",
      "GitHub Actions",
    ],
  },
  {
    id: "ev-prism",
    projectName: "Prism",
    projectUrl: "https://github.com/BarujaFe1/Prism",
    description:
      "Sistema local-first para coletar, normalizar, classificar e acompanhar vagas e projetos freelance. Possui conectores, scoring explicável, hard gates, filtros, CRM de candidaturas, timeline, monitoramento de fontes e analytics de conversão.",
    metrics:
      "Repositório ~99,6% TypeScript e watchlist catalogada com ~559 empresas brasileiras. Composição técnica e cobertura cadastrada — não usuários ativos.",
    approvedResumeBullet:
      "Construí o Prism, aplicação full-stack em TypeScript e Next.js que integra fontes de oportunidades, normaliza e deduplica dados, calcula aderência por regras explicáveis e organiza candidaturas em radar, pipeline, timeline e analytics.",
    confidence: "high",
    associatedSkills: [
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "SQL",
      "SQLite",
      "Drizzle ORM",
      "APIs REST",
      "Tailwind CSS",
      "Git",
      "Integração de APIs",
      "Modelagem de Dados",
      "Recharts",
      "GitHub Actions",
    ],
  },
  {
    id: "ev-maestro",
    projectName: "Maestro",
    projectUrl: "https://github.com/BarujaFe1/Maestro",
    description:
      "Aplicativo mobile para gestão pedagógica de uma escola de música, centralizando alunos, aulas, presença, evolução, gráficos e relatórios em operação compartilhada por equipe.",
    metrics:
      "Uso operacional relatado pelo autor durante cinco meses, com mais de 120 alunos gerenciados. Substituiu cadernos/planilhas por dados centralizados.",
    approvedResumeBullet:
      "Desenvolvi o Maestro, aplicativo React Native e Supabase usado na gestão pedagógica de mais de 120 alunos, centralizando cadastros, aulas, presença, evolução e relatórios com autenticação e isolamento de dados por usuário.",
    confidence: "high",
    associatedSkills: [
      "JavaScript",
      "React Native",
      "Expo",
      "Supabase",
      "PostgreSQL",
      "APIs REST",
      "Git",
    ],
  },
  {
    id: "ev-lancaensaio",
    projectName: "LançaEnsaio",
    projectUrl: "https://github.com/BarujaFe1/LancaEnsaio",
    description:
      "Aplicativo mobile que substitui fichas físicas no registro de ensaios musicais, com validação, persistência local e envio ao Google Sheets via Supabase Edge Functions.",
    metrics:
      "APK Android em uso operacional relatado pelo autor, com fluxo app → Supabase Edge Functions → Google Sheets API. Sem volume público de registros.",
    approvedResumeBullet:
      "Entreguei aplicativo mobile em TypeScript e React Native para padronizar registros de ensaios, com validação, persistência local e integração segura entre Supabase Edge Functions e Google Sheets API.",
    confidence: "high",
    associatedSkills: [
      "TypeScript",
      "React Native",
      "Expo",
      "Supabase",
      "APIs REST",
      "Git",
      "Automação",
      "Integração de APIs",
    ],
  },
  {
    id: "ev-opsledger",
    projectName: "OpsLedger",
    projectUrl: "https://github.com/BarujaFe1/opsledger",
    description:
      "Laboratório full-stack de reconciliação operacional que cruza pedidos, pagamentos e estoque, detecta divergências e prioriza por severidade e próxima ação.",
    metrics:
      "Demonstração sintética com 152 pedidos, 148 pagamentos, 257 movimentos de estoque e sete regras de reconciliação testáveis.",
    approvedResumeBullet:
      "Criei o OpsLedger, aplicação Next.js e FastAPI que reconcilia pedidos, pagamentos e estoque por sete regras testáveis, priorizando divergências por severidade, impacto financeiro e ação recomendada.",
    confidence: "medium",
    associatedSkills: [
      "TypeScript",
      "React",
      "Next.js",
      "Python",
      "FastAPI",
      "SQL",
      "SQLite",
      "Pandas",
      "APIs REST",
      "Git",
      "Modelagem de Dados",
      "Vitest",
    ],
  },
  {
    id: "ev-signalhub",
    projectName: "SignalHub APIs",
    projectUrl: "https://github.com/BarujaFe1/SignalHub-APIs",
    description:
      "Laboratório de observabilidade para ingestão de APIs públicas, com conectores, validação de qualidade/freshness, API FastAPI e dashboard Next.js.",
    metrics:
      "Snapshot técnico documentado com oito endpoints, cinco páginas, três conectores e sete tabelas validadas.",
    approvedResumeBullet:
      "Desenvolvi laboratório de ingestão e observabilidade de APIs públicas com FastAPI e Next.js, estruturando três conectores, persistência de execuções, métricas de qualidade e freshness e dashboard operacional.",
    confidence: "medium",
    associatedSkills: [
      "Python",
      "FastAPI",
      "TypeScript",
      "React",
      "Next.js",
      "SQL",
      "SQLite",
      "APIs REST",
      "Git",
      "Integração de APIs",
      "Data Quality",
    ],
  },
];

export const PERSONAL_LEARNING_BACKLOG: LearningTask[] = [
  {
    id: "learn-ci-prism",
    skill: "GitHub Actions",
    title: "Integrar quality gates à branch principal do Prism",
    reason:
      "GitHub Actions aparece em vagas; evidência pública forte ainda precisa ser a pipeline completa na main (lint/typecheck/test/build).",
    priority: "high",
    evidenceExpected:
      "Workflow na main em PRs com npm ci, lint, typecheck, testes e build; badge no README; PR verde.",
    status: "todo",
    dueAt: dueInDays(7),
    createdAt: now(),
  },
  {
    id: "learn-api-prism",
    skill: "Node.js",
    title: "Fortalecer as APIs do Prism com validação e testes",
    reason: "Node.js e APIs REST são requisitos recorrentes; tornar a evidência mais verificável.",
    priority: "high",
    evidenceExpected:
      "Schemas de runtime, erros padronizados, filtros seguros, testes de integração e docs dos endpoints críticos.",
    status: "todo",
    dueAt: dueInDays(14),
    createdAt: now(),
  },
  {
    id: "learn-postgres",
    skill: "PostgreSQL",
    title: "Demonstrar PostgreSQL além do uso indireto pelo Supabase",
    reason: "PostgreSQL é requisito frequente; fortalecer evidência além do Maestro/Supabase.",
    priority: "high",
    evidenceExpected:
      "Schema, migrations, índices, constraints, transações, SQL + EXPLAIN básico e RLS quando aplicável.",
    status: "todo",
    dueAt: dueInDays(30),
    createdAt: now(),
  },
  {
    id: "learn-playwright",
    skill: "Playwright",
    title: "Adicionar testes E2E e auditoria de acessibilidade ao Prism",
    reason: "Fortalecer evidência de qualidade front-end e confiabilidade.",
    priority: "high",
    evidenceExpected:
      "Playwright cobrindo radar, detalhes, pipeline e analytics; axe sem violações críticas; Lighthouse publicado.",
    status: "todo",
    dueAt: dueInDays(21),
    createdAt: now(),
  },
  {
    id: "learn-docker",
    skill: "Docker",
    title: "Criar ambiente reprodutível para um projeto full-stack",
    reason: "Docker e cloud aparecem com frequência em vagas full-stack/backend.",
    priority: "medium",
    evidenceExpected:
      "Dockerfile e compose para app + banco, docs de execução e deploy com health check.",
    status: "todo",
    dueAt: dueInDays(45),
    createdAt: now(),
  },
  {
    id: "learn-ai-eval",
    skill: "IA aplicada",
    title: "Avaliar extração semântica de habilidades no Prism",
    reason:
      "Evidência real de IA aplicada sem transformar o rules engine em claim falso de ML.",
    priority: "medium",
    evidenceExpected:
      "Baseline determinístico, vagas rotuladas, integração opcional com saída estruturada, fallback, custo/latência e comparação de precisão.",
    status: "todo",
    dueAt: dueInDays(60),
    createdAt: now(),
  },
];

export const PERSONAL_APPLICATION_PLANS: ApplicationPlan[] = [
  {
    id: "plan-fullstack-br",
    title: "Full-Stack / Product Engineer (Brasil)",
    weeklyTarget: 10,
    roleFocus: ["Full Stack", "Product Engineer", "Estágio"],
    channels: ["Gupy", "LinkedIn", "carreiras oficiais", "indicação"],
    notes: "75% do volume. Priorizar SP remoto/híbrido e São Carlos. 12–18 apps/semana no total.",
    active: true,
  },
  {
    id: "plan-frontend",
    title: "Frontend React/Next (estágio/júnior)",
    weeklyTarget: 3,
    roleFocus: ["Frontend", "Estágio"],
    channels: ["Gupy", "Programathor", "LinkedIn"],
    notes: "Usar bullets Prism + DataFlow com ênfase em UI/React Query.",
    active: true,
  },
  {
    id: "plan-data",
    title: "Data Analyst / Data Product",
    weeklyTarget: 3,
    roleFocus: ["Data Analyst", "Estágio"],
    channels: ["Gupy", "LinkedIn", "portfólio DataFlow"],
    notes: "Currículo dados (PDF atual). Não forçar trainee agora (formatura 2028).",
    active: true,
  },
  {
    id: "plan-intl",
    title: "Portugal / CPLP / remoto LatAm",
    weeklyTarget: 2,
    roleFocus: ["Full Stack", "Product Engineer"],
    channels: ["LinkedIn", "Wellfound", "carreiras PT"],
    notes: "≈10–15% do volume. Inglês ok; destacar case study EN.",
    active: true,
  },
];

export function buildPersonalProfilePayload() {
  const profile: ProfileData & Record<string, unknown> = {
    name: "Felipe Alirio Baruja",
    headline:
      "Desenvolvedor Full-Stack | TypeScript, React, Next.js, Node.js, Python e SQL | Estatística e Ciência de Dados na USP",
    summary:
      "Estudante de Estatística e Ciência de Dados na USP e desenvolvedor full-stack orientado a produto. Construo aplicações, APIs, automações e produtos de dados com TypeScript, React/Next.js, Node.js, Python, SQL e PostgreSQL, com projetos operacionais e demos públicas.",
    skills: PERSONAL_SKILLS,
    desiredRoles: [
      "Full Stack",
      "Product Engineer",
      "Estágio",
      "Data Analyst",
      "Frontend",
      "Backend",
    ],
    desiredSalaryMin: 2000,
    desiredSalaryMax: 7000,
    desiredCurrency: "BRL",
    desiredLocationTypes: ["remote", "hybrid"] as LocationType[],
    desiredContractTypes: [
      "internship",
      "clt",
      "pj",
      "freelancer",
      "international",
    ] as ContractType[],
    experienceLevel: "internship" as ExperienceLevel,
    languages: ["Português", "Inglês"],
    negativeKeywords: PERSONAL_NEGATIVE_KEYWORDS,
    githubUrl: "https://github.com/BarujaFe1",
    linkedinUrl: "https://www.linkedin.com/in/barujafe/",
    portfolioUrl: "https://barujafe.vercel.app/",
    resumeUrl: "https://barujafe.vercel.app/resume/curriculo-ptbr.pdf",
    resumeFilename: "curriculo-ptbr.pdf",
    contactEmail: "felipe.baruja@gmail.com",
    skillsEvidence: PERSONAL_EVIDENCES,
    learningBacklog: PERSONAL_LEARNING_BACKLOG,
    freelanceMinHourlyRate: 20,
    freelancePreferredCurrency: "USD",
    freelanceAvailableHoursPerWeek: 10,
    freelanceOpenToFixedPrice: true,
    freelanceMinFixedProjectValue: 300,
    freelanceExperienceYears: 2,
    freelancePortfolioUrl: "https://barujafe.vercel.app/",
    freelanceSpecialization: "full-stack",
    applicationPlans: PERSONAL_APPLICATION_PLANS,
  };

  return profile;
}
