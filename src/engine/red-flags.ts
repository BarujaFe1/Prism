export interface RedFlag {
  type: "critical" | "warning" | "info";
  label: string;
  evidence: string;
}

interface JobInput {
  title: string;
  description: string | null;
  company: string;
  location: string | null;
  locationType: string | null;
  contractType: string | null;
  experienceLevel: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  salaryPeriod: string | null;
  technologies: string[] | null;
}

export function detectJobRedFlags(job: JobInput): RedFlag[] {
  const flags: RedFlag[] = [];
  const title = job.title?.toLowerCase() || "";
  const desc = job.description?.toLowerCase() || "";
  const text = `${title} ${desc}`;

  // --- CRITICAL flags ---

  // "Rockstar", "Ninja", "Guru" nonsense
  if (/\b(rockstar|ninja|guru|superstar|wizard)\b/i.test(text)) {
    flags.push({ type: "critical", label: "cargo_inflado", evidence: "Usa termos como 'rockstar', 'ninja' ou 'guru' — sinal de cultura tóxica ou expectativas irreais" });
  }

  // Presencial disfarçado (vaga remota mas pede presença)
  if (job.locationType === "remote" && /presencial|escritório 5x|office\s*5\s*days/i.test(desc)) {
    flags.push({ type: "critical", label: "presencial_disfarcado", evidence: "Vaga anunciada como remota, mas descrição sugere presença obrigatória" });
  }

  // "PJ com horário CLT"
  if (job.contractType === "pj" && /horário.*fixo|8h.*diária|bater.*ponto|horário.*comercial|expediente.*fixo/i.test(desc)) {
    flags.push({ type: "critical", label: "pj_clt", evidence: "Contrato PJ com exigências de horário fixo — relação de emprego disfarçada" });
  }

  // Stack muito extensa para vaga júnior
  const techCount = job.technologies?.length || 0;
  const isJunior = job.experienceLevel === "internship" || job.experienceLevel === "trainee" || job.experienceLevel === "junior" || /junior|jr|estágio|trainee|internship|entry.level/i.test(title);
  if (isJunior && techCount >= 8) {
    flags.push({ type: "critical", label: "stack_excessiva_junior", evidence: `${techCount} tecnologias exigidas para vaga júnior — escopo irreal` });
  }

  // Senioridade exigindo anos demais
  const yearMatches = desc.match(/(\d+)\s*[+]?\s*(anos?|years?)\s*(de|of)?\s*(experiência|experience)/i);
  if (yearMatches) {
    const years = parseInt(yearMatches[1]);
    if (years >= 5 && isJunior) {
      flags.push({ type: "critical", label: "anos_excesso_junior", evidence: `Exige ${years} anos de experiência para vaga de nível júnior — incompatível` });
    }
  }

  // --- WARNING flags ---

  // Descrição muito curta (vaga sem informação)
  if (job.description && job.description.length < 100) {
    flags.push({ type: "warning", label: "descricao_curta", evidence: "Descrição muito curta — pode ser vaga fantasma ou sem planejamento" });
  }

  // Sem salário
  if (!job.salaryMin && !job.salaryMax && job.contractType !== "internship") {
    flags.push({ type: "warning", label: "sem_salario", evidence: "Salário não informado — transparência baixa" });
  }

  // Salário muito baixo para o tipo de contrato
  if (job.salaryMin && job.salaryMin < 3000 && job.currency === "BRL" && job.contractType !== "internship") {
    flags.push({ type: "warning", label: "salario_baixo", evidence: `Salário mínimo de ${job.salaryMin} abaixo do mercado para a função` });
  }

  // Empresa não identificada
  if (!job.company || job.company === "Unknown" || job.company === "Confidencial" || job.company === "Private") {
    flags.push({ type: "warning", label: "empresa_anonima", evidence: "Empresa não identificada — pode ser consultoria ou vaga fantasma" });
  }

  // Descrição genérica
  if (desc.split(" ").length < 30 && job.description && job.description.length > 0) {
    flags.push({ type: "warning", label: "descricao_generica", evidence: "Descrição muito genérica — pode indicar falta de clareza sobre a vaga" });
  }

  // Múltiplas funções (acúmulo)
  const roleKeywords = ["analista e desenvolvedor", "dev e designer", "desenvolvedor e suporte", "developer and designer", "developer and support", "fullstack and devops", "developer and qa"];
  if (roleKeywords.some((kw) => text.includes(kw))) {
    flags.push({ type: "warning", label: "acumulo_funcao", evidence: "Vaga acumula funções distintas — pode indicar falta de equipe estruturada" });
  }

  // --- INFO flags ---

  // Descrição em inglês para vaga BR (pode ser ok, mas informar)
  const hasPortuguese = /[\u00E0-\u00FC]|português|você|você|nós|nossa/i.test(desc);
  const hasEnglish = /(we are looking for|you will|the ideal candidate|requirements|qualifications|we offer)/i.test(desc);
  if (hasEnglish && hasPortuguese && job.currency === "BRL") {
    flags.push({ type: "info", label: "idioma_misto", evidence: "Descrição em português e inglês — pode exigir inglês avançado" });
  }

  // Vaga "urgente" (possível desespero)
  if (/\b(urgente|urgent|imediato|immediate|asap|hiring immediately)\b/i.test(text)) {
    flags.push({ type: "info", label: "urgencia", evidence: "Vaga marcada como urgente — pode indicar alta rotatividade ou desespero" });
  }

  return flags;
}

export function calculateJobGap(job: JobInput, profileSkills: string[]): {
  strongMatches: string[];
  missingButLearnable: string[];
  hardGaps: string[];
} {
  const allJobTechs = (job.technologies || []).map((t) => t.toLowerCase());
  const profileLower = profileSkills.map((s) => s.toLowerCase());
  const desc = job.description?.toLowerCase() || "";
  const title = job.title?.toLowerCase() || "";

  // Extract tech from description too
  const knownTechs = [
    "typescript", "javascript", "python", "java", "go", "rust", "c++", "c#", "ruby", "php",
    "react", "next.js", "vue", "angular", "svelte", "node.js", "deno", "express",
    "django", "flask", "fastapi", "spring boot", "laravel", "rails",
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "kafka",
    "docker", "kubernetes", "terraform", "aws", "gcp", "azure",
    "graphql", "rest", "grpc",
    "machine learning", "deep learning", "nlp", "computer vision", "pytorch", "tensorflow",
    "pandas", "numpy", "scikit-learn", "data science", "analytics", "sql",
    "ci/cd", "github actions", "linux", "nginx",
    "react native", "flutter", "swift", "kotlin",
    "excel", "power bi", "tableau", "looker",
    "git", "github",
  ];

  for (const tech of knownTechs) {
    if (desc.includes(tech) && !allJobTechs.includes(tech)) {
      allJobTechs.push(tech);
    }
  }

  const strongMatches: string[] = [];
  const missingButLearnable: string[] = [];
  const hardGaps: string[] = [];

  for (const jobTech of [...new Set(allJobTechs)]) {
    if (profileLower.includes(jobTech)) {
      strongMatches.push(jobTech);
    } else if (isLearnable(jobTech)) {
      missingButLearnable.push(jobTech);
    } else {
      hardGaps.push(jobTech);
    }
  }

  // Seniority gap
  const isSeniorRole = /senior|sênior|sr\.|lead|staff|principal/i.test(title);
  const profileIsEntry = profileSkills.length === 0 || true; // heuristic
  if (isSeniorRole && profileIsEntry && hardGaps.length === 0) {
    hardGaps.push("Senioridade (vaga sênior, perfil júnior/pleno)");
  }

  return { strongMatches, missingButLearnable, hardGaps };
}

function isLearnable(tech: string): boolean {
  const easy = [
    "typescript", "javascript", "react", "next.js", "node.js", "express", "fastify",
    "python", "django", "flask", "fastapi", "sql", "postgresql", "mysql", "sqlite",
    "docker", "git", "github", "github actions", "ci/cd",
    "pandas", "numpy", "scikit-learn", "matplotlib", "seaborn", "scipy",
    "css", "tailwind css", "sass", "html",
    "rest", "graphql", "api", "apis",
    "excel", "analytics", "dashboard",
    "linux", "bash", "shell",
  ];
  return easy.some((e) => tech.includes(e));
}
