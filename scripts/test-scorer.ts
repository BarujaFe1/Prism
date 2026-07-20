import { computeScore } from "../src/engine/scorer";
import { parseCompensation } from "../src/lib/freelance/utils";
import type { ProfileData } from "../src/types";

const mockProfile: ProfileData = {
  name: "Felipe Baruja",
  headline: "Estudante de Estatística e Ciência de Dados | USP",
  summary: "Interesse em dados, analítica, automação e Python/SQL.",
  skills: ["Python", "SQL", "Pandas", "TypeScript", "Next.js", "FastAPI", "Google Sheets", "Selenium", "Data Quality", "Statistics", "A/B Testing"],
  desiredRoles: ["Estágio em Dados", "Júnior em Dados", "Analista de Dados Júnior"],
  desiredSalaryMin: 1500,
  desiredSalaryMax: 5000,
  desiredCurrency: "BRL",
  desiredLocationTypes: ["remote", "hybrid"],
  desiredContractTypes: ["internship", "clt", "pj"],
  experienceLevel: "junior",
  languages: ["Português"],
  negativeKeywords: ["SAP", "COBOL", "VBA", "Delphi", "Vendas"],
  skillsEvidence: [
    { id: "e1", projectName: "DataFlow", associatedSkills: ["Python", "Pandas", "Data Quality"], projectUrl: "https://github.com/baruja/dataflow", metrics: "Reduziu 80% do retrabalho", approvedResumeBullet: "Desenvolvi validador de dados..." },
    { id: "e2", projectName: "StatLab", associatedSkills: ["Statistics", "A/B Testing"] }
  ],
  learningBacklog: [
    { id: "l1", skill: "Airflow", status: "todo", title: "Aprender Airflow" }
  ]
};

const testJobs = [
  {
    id: "1",
    title: "Junior Data Analyst",
    description: "Requirements: Python, SQL, Pandas",
    technologies: ["Python", "SQL"],
    locationType: "remote" as const,
    contractType: "clt" as const,
    experienceLevel: "junior" as const,
    salaryMin: 3500,
    salaryMax: 4500,
    currency: "BRL",
  },
  {
    id: "2",
    title: "Junior Data Engineer",
    description: "Requirements: Python, SQL, ETL, API. Airflow is a plus.",
    technologies: ["Python", "SQL", "ETL", "API"],
    locationType: "remote" as const,
    contractType: "pj" as const,
    experienceLevel: "junior" as const,
    salaryMin: 5000,
    salaryMax: 7000,
    currency: "BRL",
  },
  {
    id: "3",
    title: "Account Executive AI Native",
    description: "Work with sales of our AI Native platform. Direct B2B sales experience required.",
    technologies: ["AI"],
    locationType: "remote" as const,
    contractType: "clt" as const,
    experienceLevel: "junior" as const,
    salaryMin: null,
    salaryMax: null,
    currency: null,
  },
  {
    id: "4",
    title: "Senior Staff Full Stack Rust Go",
    description: "Requires Senior/Staff full stack experience with Rust and Go to lead design of platform.",
    technologies: ["Rust", "Go"],
    locationType: "remote" as const,
    contractType: "pj" as const,
    experienceLevel: "senior" as const,
    salaryMin: null,
    salaryMax: null,
    currency: null,
  },
  {
    id: "5",
    title: "PhD Data Scientist Intern",
    description: "Must have a PhD or Doctorate in computer science. Intern requiring PhD student status.",
    technologies: ["Python", "Statistics"],
    locationType: "hybrid" as const,
    contractType: "internship" as const,
    experienceLevel: "internship" as const,
    salaryMin: null,
    salaryMax: null,
    currency: null,
  },
  {
    id: "6",
    title: "Administrative Analyst",
    description: "Support daily office and administrative operations of the company.",
    technologies: ["Excel"],
    locationType: "onsite" as const,
    contractType: "clt" as const,
    experienceLevel: "junior" as const,
    salaryMin: 2000,
    salaryMax: 2500,
    currency: "BRL",
  },
  {
    id: "7",
    title: "Graphic Designer / WordPress Developer",
    description: "Requires Elementor and WordPress design experience. Build landing pages.",
    technologies: ["WordPress", "Elementor"],
    locationType: "remote" as const,
    contractType: "freelancer" as const,
    experienceLevel: "junior" as const,
    salaryMin: null,
    salaryMax: null,
    currency: null,
  },
  {
    id: "8",
    title: "Amazon PPC Strategist",
    description: "Manage Amazon PPC campaigns and advertising operations.",
    technologies: ["PPC"],
    locationType: "remote" as const,
    contractType: "freelancer" as const,
    experienceLevel: "junior" as const,
    salaryMin: null,
    salaryMax: null,
    currency: null,
  },
  {
    id: "9",
    title: "Junior Analyst",
    description: "About us: We are a global company valuing diversity and inclusion. Our benefits include health insurance. Requirements: Python, SQL.",
    technologies: ["Python", "SQL"],
    locationType: "remote" as const,
    contractType: "clt" as const,
    experienceLevel: "junior" as const,
    salaryMin: 3500,
    salaryMax: 4500,
    currency: "BRL",
  },
  {
    id: "10",
    title: "Data Analyst",
    description: "Salary range: $75,000 - $120,000 base salary per year. Work with SQL.",
    technologies: ["SQL"],
    locationType: "remote" as const,
    contractType: "pj" as const,
    experienceLevel: "junior" as const,
    salaryMin: 75000,
    salaryMax: 120000,
    currency: "USD",
    salaryPeriod: "hourly", // Parse error mock
  }
];

console.log("=== INICIANDO VALIDAÇÃO DO MOTOR DE SCORING E OUTLIERS ===\n");

let scoreFailed = false;

for (const job of testJobs) {
  const result = computeScore(job, mockProfile);
  console.log(`VAGA: "${job.title}"`);
  console.log(`- Actionability Score (job.score): ${result.score}`);
  console.log(`- Fit Técnico Bruto: ${result.details.fitScore}`);
  console.log(`- Elegibilidade: ${result.details.eligibility}`);
  console.log(`- Decisão Sugerida: ${result.details.decisionLabel}`);
  console.log(`- Alertas/Penalidades: ${result.details.penalties.join(", ") || "nenhuma"}`);
  console.log(`- Gaps Identificados: ${result.details.missingGaps.join(", ") || "nenhum"}`);
  
  // Validation checks
  if (job.title === "Junior Data Analyst" && result.score < 0.6) {
    console.error("❌ ERRO: Junior Data Analyst deveria ter score alto.");
    scoreFailed = true;
  }
  if (job.title === "Junior Data Engineer" && result.score < 0.6) {
    console.error("❌ ERRO: Junior Data Engineer deveria ter score alto.");
    scoreFailed = true;
  }
  if (job.title === "Account Executive AI Native" && result.details.decisionLabel !== "SUPPRESSED") {
    console.error("❌ ERRO: Account Executive deveria ser suprimida.");
    scoreFailed = true;
  }
  if (job.title === "Senior Staff Full Stack Rust Go" && result.details.decisionLabel !== "SUPPRESSED") {
    console.error("❌ ERRO: Senior/Staff deveria ser suprimida.");
    scoreFailed = true;
  }
  if (job.title === "PhD Data Scientist Intern" && result.details.decisionLabel !== "SUPPRESSED") {
    console.error("❌ ERRO: Requisito de PhD deveria ser suprimida.");
    scoreFailed = true;
  }
  if (job.title === "Administrative Analyst" && result.details.decisionLabel !== "SUPPRESSED" && result.details.eligibility !== "wrong_track") {
    console.error("❌ ERRO: Administrative Analyst deveria ser wrong_track/suprimida.");
    scoreFailed = true;
  }
  if (job.title === "Graphic Designer / WordPress Developer" && result.details.decisionLabel !== "SUPPRESSED") {
    console.error("❌ ERRO: WordPress/Designer deveria ser suprimida.");
    scoreFailed = true;
  }
  if (job.title === "Amazon PPC Strategist" && result.details.decisionLabel !== "SUPPRESSED") {
    console.error("❌ ERRO: PPC Strategist deveria ser suprimida.");
    scoreFailed = true;
  }
  if (job.title === "Data Analyst" && job.id === "10") {
    // Should detect that hourly $75,000 - $120,000 with "base salary per year" is yearly and NOT hourly,
    // and thus not an hourly outlier, but parsed correctly as yearly.
    if (result.details.compensationOutlier) {
      console.error("❌ ERRO: Data Analyst com $75k/ano não deveria ser outlier de hora, mas sim corrigido para anual.");
      scoreFailed = true;
    }
  }

  console.log("-".repeat(50) + "\n");
}

console.log("=== INICIANDO VALIDAÇÃO DO PARSER DE REMUNERAÇÃO ===\n");

const compTests = [
  { text: "$320,000-$485,000 USD", expectedType: "annual", min: 320000, max: 485000 },
  { text: "$80/hr", expectedType: "hourly", min: 80, max: 80 },
  { text: "$25,000/hr", expectedType: "annual", min: 25000, max: 25000 }, // converted from hourly >= 1000
  { text: "R$ 2.000 - R$ 5.000", expectedType: "monthly", min: 2000, max: 5000 }
];

let parserFailed = false;

for (const t of compTests) {
  const res = parseCompensation(t.text);
  console.log(`TEXTO: "${t.text}"`);
  console.log(`- Tipo Parseado: ${res.type}`);
  console.log(`- Faixa: ${res.min} - ${res.max} ${res.currency}`);
  console.log(`- Confiança: ${res.confidence}`);
  
  if (res.type !== t.expectedType) {
    console.error(`❌ ERRO: Tipo esperado '${t.expectedType}', recebeu '${res.type}'`);
    parserFailed = true;
  }
  if (res.min !== t.min || res.max !== t.max) {
    console.error(`❌ ERRO: Valores esperados ${t.min}-${t.max}, recebeu ${res.min}-${res.max}`);
    parserFailed = true;
  }
  console.log("-".repeat(50) + "\n");
}

if (scoreFailed || parserFailed) {
  console.error("❌ ALGUNS TESTES FALHARAM.");
  process.exit(1);
} else {
  console.log("✅ TODOS OS TESTES PASSARAM COM SUCESSO!");
  process.exit(0);
}
