import type { FreelanceProjectData, FreelanceScoreResult, FreelanceFlag, FreelanceProfile, FreelanceGrade } from "../freelance/types";

const NON_TECH_ROLES = [
  "designer", "graphic design", "graphic designer", "ui/ux", "ux/ui", "figma", "photoshop",
  "illustrator", "logo", "branding", "brand identity", "motion graphic", "animator", "animation",
  "3d model", "3d artist", "blender", "vfx", "video editor", "video editing", "video production",
  "photo editing", "photo retouch", "photographer",
  "social media", "marketing", "digital marketing", "seo", "sem", "content marketing",
  "copywriter", "copy writing", "content writer", "blog writer", "article writer", "ghostwriter",
  "transcri", "translation", "translator", "proofreading", "proofread",
  "virtual assistant", "admin", "administrative", "data entry", "customer service", "support",
  "sales", "vendas", "telemarketing", "lead generation", "cold email",
  "hr", "recrutamento", "recruitment", "recruiting",
  "accounting", "bookkeeping", "financeiro", "financial",
  "voice over", "voiceover", "narration", "audio editing",
  "architecture", "architect", "civil engineering", "engenharia civil",
  "legal", "lawyer", "advogado",
];

export function scoreFreelanceProject(
  project: FreelanceProjectData,
  profile: FreelanceProfile
): FreelanceScoreResult {
  const redFlags: FreelanceFlag[] = [];
  const greenFlags: FreelanceFlag[] = [];

  const isNonTech = detectNonTechRole(project);
  if (isNonTech) {
    redFlags.push({ type: "red", level: "high", label: "nao_tech", message: "Projeto de área não-tech (design/marketing/escrita/etc.)" });
    return {
      total: 15,
      grade: "D" as FreelanceGrade,
      breakdown: { skillFit: 0, clientQuality: 0, financialFit: 0, competition: 0, projectClarity: 0 },
      redFlags,
      greenFlags,
      recommendation: "skip",
      estimatedWinProbability: 0,
    };
  }

  const titleLower = (project.title || "").toLowerCase();
  const descriptionLower = (project.description || "").toLowerCase();
  const textLower = `${titleLower} ${descriptionLower} ${(project.skills || []).join(" ")}`.toLowerCase();

  // Kotlin, iOS/Swift/Objective-C, Pentest/Cybersecurity negative flags
  const hasNegativeTech = /\b(kotlin|ios|swift|objective-c|cocoa|pentest|pentesting|cybersecurity|security audit|hacking|ethical hack|ethical hacking|infosec|pentester)\b/i.test(textLower);
  
  if (hasNegativeTech) {
    redFlags.push({ type: "red", level: "high", label: "tecnologia_fora_interesse", message: "Projeto foca em tecnologias fora de interesse (Kotlin, iOS/Swift, Pentest)" });
  }

  // High competition with low budget penalty
  const isHighCompetition = project.proposalsCount && project.proposalsCount > 20;
  const isLowBudget = (project.budgetMax && project.budgetMax < 250) || (project.hourlyRateMax && project.hourlyRateMax < 20);
  if (isHighCompetition && isLowBudget) {
    redFlags.push({
      type: "red",
      level: "medium",
      label: "comp_alta_recompensa_baixa",
      message: "Competição alta com baixa recompensa financeira estimada"
    });
  }

  const isDataOrAutomation = /\b(scrape|scraping|crawler|automations?|automati[zs]ar|pipeline|etl|pandas|fastapi|dashboard|bi|looker|metabase|analytics|data analysis|analise de dados|cientista de dados|data science|sqlite|postgresql|supabase)\b/i.test(textLower);
  
  if (isDataOrAutomation) {
    greenFlags.push({ type: "green", label: "data_automation_fit", message: "Projeto altamente alinhado com dados, scraping ou automação" });
  }

  const skillFit = calculateSkillFit(project, profile, redFlags, greenFlags);
  const clientQuality = calculateClientQuality(project, redFlags, greenFlags);
  const financialFit = calculateFinancialFit(project, profile, redFlags, greenFlags);
  const competition = calculateCompetition(project, greenFlags);
  const projectClarity = calculateProjectClarity(project, redFlags, greenFlags);

  const weights = { skillFit: 0.35, clientQuality: 0.25, financialFit: 0.20, competition: 0.10, projectClarity: 0.10 };
  let total = Math.round(
    skillFit * weights.skillFit +
    clientQuality * weights.clientQuality +
    financialFit * weights.financialFit +
    competition * weights.competition +
    projectClarity * weights.projectClarity
  );

  // Apply tech/data automation bonus
  if (isDataOrAutomation) {
    total = Math.min(100, total + 20);
  }

  // Apply negative tech penalty / cap
  if (hasNegativeTech) {
    total = Math.min(30, total);
  }

  const grade = getGrade(total);
  const winProb = calculateWinProbability(competition, clientQuality, skillFit);
  const recommendation = getRecommendation(total, redFlags, competition);

  if (project.title?.toLowerCase().includes("test") || project.title?.toLowerCase().includes("sample")) {
    redFlags.push({ type: "red", level: "high", label: "pode_ser_teste", message: "Título sugere ser um projeto de teste/amostra" });
  }
  if (!project.clientName || project.clientName === "Private" || project.clientName === "Anonymous") {
    redFlags.push({ type: "red", level: "medium", label: "cliente_anonimo", message: "Cliente anônimo ou privado — sem histórico visível" });
  }
  if (project.hourlyRateMin && profile.minHourlyRate && project.hourlyRateMin < profile.minHourlyRate * 0.5) {
    redFlags.push({ type: "red", level: "high", label: "taxa_muito_baixa", message: `Taxa horária ($${project.hourlyRateMin}) muito abaixo do mínimo ($${profile.minHourlyRate})` });
  }

  return {
    total,
    grade,
    breakdown: { skillFit, clientQuality, financialFit, competition, projectClarity },
    redFlags,
    greenFlags,
    recommendation,
    estimatedWinProbability: winProb,
  };
}

function calculateSkillFit(
  project: FreelanceProjectData,
  profile: FreelanceProfile,
  redFlags: FreelanceFlag[],
  greenFlags: FreelanceFlag[]
): number {
  const projectSkills = project.skills || [];
  if (projectSkills.length === 0) return 50;

  const userSkillSet = new Set(profile.skills.map((s) => s.toLowerCase()));
  let matchCount = 0;
  let missingCount = 0;

  for (const skill of projectSkills) {
    if (userSkillSet.has(skill.toLowerCase())) matchCount++;
    else missingCount++;
  }

  const ratio = projectSkills.length > 0 ? matchCount / projectSkills.length : 0;
  const baseScore = ratio * 100;

  if (ratio >= 0.8) {
    greenFlags.push({ type: "green", label: "perfect_skill_match", message: `Match de ${Math.round(ratio * 100)}% nas skills requeridas` });
  } else if (ratio < 0.3) {
    redFlags.push({ type: "red", level: "high", label: "skills_mismatch", message: `Menos de 30% das skills requeridas no perfil (${matchCount}/${projectSkills.length})` });
  }

  return Math.round(baseScore);
}

function calculateClientQuality(
  project: FreelanceProjectData,
  redFlags: FreelanceFlag[],
  greenFlags: FreelanceFlag[]
): number {
  let score = 50;

  if (project.clientRating != null) {
    if (project.clientRating >= 4.8) { score = 100; greenFlags.push({ type: "green", label: "premium_client", message: "Cliente Top Rated com alto histórico de gastos" }); }
    else if (project.clientRating >= 4.5) score = 85;
    else if (project.clientRating >= 4.0) score = 65;
    else if (project.clientRating >= 3.5) score = 45;
    else { score = 30; redFlags.push({ type: "red", level: "high", label: "low_client_rating", message: `Cliente com rating ${project.clientRating} — abaixo de 4.0` }); }
  }

  if (project.clientTotalSpent != null) {
    if (project.clientTotalSpent > 10000) score += 15;
    else if (project.clientTotalSpent > 1000) score += 8;
    else if (project.clientTotalSpent < 100) score -= 15;
  }

  if (project.clientHireRate != null) {
    if (project.clientHireRate > 80) score += 12;
    else if (project.clientHireRate > 50) score += 5;
    else if (project.clientHireRate < 20) { score -= 15; redFlags.push({ type: "red", level: "medium", label: "low_hire_rate", message: "Cliente contrata menos de 20% de quem entrevista" }); }
  }

  if (project.clientTotalHires != null && project.clientTotalHires > 10) score += 8;

  return Math.min(100, Math.max(0, score));
}

function calculateFinancialFit(
  project: FreelanceProjectData,
  profile: FreelanceProfile,
  redFlags: FreelanceFlag[],
  greenFlags: FreelanceFlag[]
): number {
  const minRate = profile.minHourlyRate || 30;
  let effectiveRate: number | null = null;

  if (project.hourlyRateMin != null) effectiveRate = project.hourlyRateMin;
  else if (project.hourlyRateMax != null) effectiveRate = project.hourlyRateMax * 0.8;
  else if (project.budgetMin != null && project.budgetMax != null) {
    const avg = (project.budgetMin + project.budgetMax) / 2;
    if (project.duration) {
      if (project.duration.includes("1 mês") || project.duration.includes("< 1")) effectiveRate = avg / 40;
      else if (project.duration.includes("1-3")) effectiveRate = avg / 80;
      else if (project.duration.includes("3-6")) effectiveRate = avg / 160;
      else effectiveRate = avg / 80;
    } else effectiveRate = avg / 80;
  }

  if (effectiveRate == null) return 40;

  const ratio = effectiveRate / minRate;
  if (ratio >= 1.5) { greenFlags.push({ type: "green", label: "premium_rate", message: `Taxa $${effectiveRate}/hr é 1.5x+ sua expectativa mínima` }); return 100; }
  if (ratio >= 1.0) return 80;
  if (ratio >= 0.8) return 55;
  return 25;
}

function calculateCompetition(
  project: FreelanceProjectData,
  greenFlags: FreelanceFlag[]
): number {
  const count = project.proposalsCount;
  if (count == null) return 60;

  if (count === 0) { greenFlags.push({ type: "green", label: "low_competition", message: "Nenhuma proposta ainda — primeira janela de oportunidade" }); return 100; }
  if (count <= 5) { greenFlags.push({ type: "green", label: "low_competition", message: `Menos de 5 propostas — janela de oportunidade` }); return 90; }
  if (count <= 10) return 70;
  if (count <= 20) return 50;
  if (count <= 50) return 30;
  return 10;
}

function calculateProjectClarity(
  project: FreelanceProjectData,
  redFlags: FreelanceFlag[],
  greenFlags: FreelanceFlag[]
): number {
  let score = 0;

  if (project.budgetMin != null) score += 25;
  else if (project.hourlyRateMin != null) score += 20;
  else redFlags.push({ type: "red", level: "low", label: "no_budget_defined", message: "Orçamento não definido" });

  if (project.duration) score += 25;

  if (project.description) {
    if (project.description.length > 500) score += 25;
    else if (project.description.length > 200) score += 15;
    else if (project.description.length < 100) redFlags.push({ type: "red", level: "medium", label: "vague_description", message: "Descrição muito vaga (< 100 palavras)" });
  }

  if (project.skills && project.skills.length > 0) score += 25;

  return score;
}

function getGrade(score: number): FreelanceGrade {
  if (score >= 90) return "S";
  if (score >= 75) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}

function calculateWinProbability(competitionScore: number, clientQuality: number, skillFit: number): number {
  const compFactor = competitionScore / 100;
  const qualityFactor = (clientQuality / 100) * 0.3 + 0.7;
  const skillFactor = skillFit / 100;
  return Math.round(Math.min(0.95, compFactor * qualityFactor * skillFactor * 0.8) * 100) / 100;
}

function detectNonTechRole(project: FreelanceProjectData): boolean {
  const text = `${project.title || ""} ${project.description || ""} ${(project.skills || []).join(" ")}`.toLowerCase();
  for (const role of NON_TECH_ROLES) {
    if (text.includes(role)) return true;
  }
  return false;
}

function getRecommendation(total: number, redFlags: FreelanceFlag[], competitionScore: number): "apply_now" | "apply_soon" | "consider" | "skip" {
  if (total >= 75 && competitionScore >= 70) return "apply_now";
  if (total >= 60) return "apply_soon";
  if (total >= 40 && redFlags.filter((f) => f.level === "high").length === 0) return "consider";
  return "skip";
}
