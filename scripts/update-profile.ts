import { db } from "../src/db/index";
import { profile } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const data = {
    name: "Felipe Alirio Baruja",
    headline: "Dados imperfeitos, decisões claras | Estatística e Ciência de Dados na USP/ICMC | Python, SQL, Data Quality e Analytics Engineering",
    summary: "Estudante de Estatística e Ciência de Dados na USP/ICMC, com perfil híbrido entre dados, automação, engenharia e produto. Construo ferramentas que transformam dados operacionais bagunçados, processos manuais e bases sem rastreabilidade em pipelines, dashboards, diagnósticos de qualidade e produtos analíticos úteis para decisão. Tenho experiência prática com Python, Pandas, SQL, APIs REST, automação, Google Sheets, FastAPI, Supabase, Next.js e React Native. Meus projetos principais incluem DataFlow, StatLab Experiments, Maestro, LançaEnsaio e Form2Dashboard, com foco em qualidade de dados, experimentação estatística, Ingestão, validação, automação operacional e redução de retrabalho manual.",
    skills: [
      "Python",
      "SQL",
      "Pandas",
      "TypeScript",
      "JavaScript",
      "React",
      "Next.js",
      "React Native",
      "Expo",
      "FastAPI",
      "PostgreSQL",
      "SQLite",
      "Supabase",
      "Google Sheets API",
      "Selenium",
      "Git",
      "GitHub",
      "REST APIs",
      "API Integration",
      "ETL",
      "ELT",
      "Data Pipelines",
      "Data Quality",
      "Data Profiling",
      "Data Validation",
      "Data Modeling",
      "Analytics Engineering",
      "Business Intelligence",
      "Dashboards",
      "Data Visualization",
      "Statistics",
      "Statistical Modeling",
      "A/B Testing",
      "Experimentation",
      "Machine Learning",
      "Automation",
      "Web Scraping",
      "Data Automation"
    ],
    desiredRoles: [
      "Estágio em Dados",
      "Estágio em Ciência de Dados",
      "Estágio em Engenharia de Dados",
      "Estagiário de Engenharia de Dados",
      "Estagiário em Analytics",
      "Estagiário em BI",
      "Estagiário em IA Generativa",
      "Estagiário em LLMs",
      "Analista de Dados Júnior",
      "Analista de BI Júnior",
      "Analista de Analytics Júnior",
      "Analytics Engineer Júnior",
      "Engenheiro de Dados Júnior",
      "Cientista de Dados Júnior",
      "Analista de Modelagem Júnior",
      "Data Analyst Intern",
      "Data Science Intern",
      "Data Engineering Intern",
      "Analytics Engineer Intern",
      "Junior Data Analyst",
      "Junior Data Engineer",
      "Junior Analytics Engineer",
      "Junior BI Analyst",
      "Data Product Intern",
      "Data Automation Intern"
    ],
    experienceLevel: "junior",
    desiredLocationTypes: [
      "remote",
      "hybrid"
    ],
    desiredContractTypes: [
      "clt",
      "internship",
      "pj",
      "freelancer",
      "international"
    ],
    negativeKeywords: [
      "Product Designer",
      "UX Designer",
      "UI Designer",
      "Graphic Designer",
      "Figma",
      "Social Media",
      "Marketing",
      "Copywriter",
      "Sales",
      "Vendas",
      "Comercial",
      "SDR",
      "BDR",
      "Customer Success",
      "Atendimento",
      "Suporte Técnico",
      "Help Desk",
      "RH",
      "Recursos Humanos",
      "Recruiter",
      "Talent Acquisition",
      "Privacy Analyst",
      "DPO",
      "Legal",
      "Jurídico",
      "Compliance",
      "WordPress",
      "Shopify",
      "Website Admin",
      "No-code",
      "Low-code",
      "SAP",
      "ABAP",
      "Cobol",
      "Delphi",
      "Mainframe",
      "Infraestrutura de Redes",
      "Técnico de Campo",
      "Manutenção",
      "Telemarketing"
    ],
    desiredSalaryMin: 2000,
    desiredSalaryMax: 8000,
    desiredCurrency: "BRL",
    freelanceMinHourlyRate: 20.0,
    freelancePreferredCurrency: "USD",
    freelanceAvailableHoursPerWeek: 15,
    freelanceOpenToFixedPrice: true,
    freelanceMinFixedProjectValue: 300.0,
    freelanceExperienceYears: 2,
    freelanceSpecialization: "data-automation"
  };

  const existing = await db.select().from(profile).where(eq(profile.id, "default")).get();
  if (existing) {
    await db.update(profile).set(data).where(eq(profile.id, "default"));
    console.log("Profile updated successfully!");
  } else {
    await db.insert(profile).values({ id: "default", ...data });
    console.log("Profile created successfully!");
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
