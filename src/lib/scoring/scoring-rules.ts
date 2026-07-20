import type { ExperienceLevel } from "@/types";

export type EligibilityStatus =
  | "eligible"
  | "stretch"
  | "over_senior"
  | "wrong_track"
  | "requires_degree"
  | "sales_business_role"
  | "freelance_noise"
  | "hard_no";

export type ActionabilityLabel =
  | "APPLY_NOW"
  | "PREPARE_FIRST"
  | "WATCH"
  | "LEARN_FIRST"
  | "SUPPRESSED";

export type SuppressionReason =
  | "seniority_mismatch"
  | "sales_role"
  | "phd_required"
  | "wrong_domain"
  | "freelance_noise"
  | "compensation_outlier"
  | "negative_keyword"
  | "irrelevant_admin_role";

/**
 * Remove rodapés institucionais, benefícios, diversidade, LGPD e outros boilerplates
 * para focar a extração de skills nas áreas de Requisitos e Atribuições da vaga.
 */
export function normalizeJobTextForScoring(rawDescription: string): string {
  if (!rawDescription) return "";

  // Regex para remover blocos institucionais comuns até o próximo parágrafo ou próxima seção de interesse
  let text = rawDescription;
  
  // Lista de padrões de início de blocos institucionais
  const patterns = [
    /(?:benef[íi]cios|benefits|o\s+que\s+oferecemos|what\s+we\s+offer|nossos\s+benef[íi]cios)[\s\S]*?(?=\n\s*\n|\n\s*(?:requirements|requisitos|qualifications|qualifica[çc][oõ]es|what\s+you\s+will\s+do|responsibilities|responsabilidades|must\s+have|nice\s+to\s+have|stack|technical\s+requirements|tecnologias)\b|\z)/gi,
    /(?:sobre\s+a\s+empresa|sobre\s+n[oó]s|quem\s+somos|about\s+us|who\s+we\s+are|nossa\s+hist[oó]ria|our\s+story|cultura|culture|nossa\s+cultura)[\s\S]*?(?=\n\s*\n|\n\s*(?:requirements|requisitos|qualifications|qualifica[çc][oõ]es|what\s+you\s+will\s+do|responsibilities|responsabilidades|must\s+have|nice\s+to\s+have|stack|technical\s+requirements|tecnologias)\b|\z)/gi,
    /(?:equal\s+opportunity|oportunidades\s+iguais|diversidade|diversity|inclus[ãa]o|inclusion|a\s+empresa\s+valoriza)[\s\S]*?(?=\n\s*\n|\n\s*(?:requirements|requisitos|qualifications|qualifica[çc][oõ]es|what\s+you\s+will\s+do|responsibilities|responsabilidades|must\s+have|nice\s+to\s+have|stack|technical\s+requirements|tecnologias)\b|\z)/gi,
    /(?:lgpd|privacy\s+notice|pol[íi]tica\s+de\s+privacidade|lei\s+geral\s+de\s+prote[çc][ãa]o)[\s\S]*?(?=\n\s*\n|\n\s*(?:requirements|requisitos|qualifications|qualifica[çc][oõ]es|what\s+you\s+will\s+do|responsibilities|responsabilidades|must\s+have|nice\s+to\s+have|stack|technical\s+requirements|tecnologias)\b|\z)/gi
  ];

  for (const pattern of patterns) {
    text = text.replace(pattern, "");
  }

  return text.trim();
}

/**
 * Checa a elegibilidade real de Felipe para a vaga com base no perfil ativo.
 */
export function checkEligibility(
  title: string,
  description: string,
  profileExperienceLevel: string | null,
  negativeKeywords: string[] = []
): {
  status: EligibilityStatus;
  reason?: SuppressionReason;
  explanation?: string;
} {
  const t = title.toLowerCase();
  const d = description.toLowerCase();
  
  // Felipe é estudante, perfil Júnior / Estágio / Trainee / Intern.
  const profileIsEntry = !profileExperienceLevel || 
    ["internship", "trainee", "junior"].includes(profileExperienceLevel.toLowerCase());

  // 1. Negative keywords do perfil (Hard switch)
  for (const kw of negativeKeywords) {
    if (t.includes(kw.toLowerCase())) {
      return {
        status: "hard_no",
        reason: "negative_keyword",
        explanation: `Título contém palavra-chave negativa: "${kw}"`,
      };
    }
  }

  // 2. Kill switch: Senioridade (se o perfil de Felipe for Júnior/Estágio)
  if (profileIsEntry) {
    const seniorKeywords = [
      /\b(senior|sênior|sr\b|sr\.)/i,
      /\bstaff\b/i,
      /\bprincipal\b/i,
      /\blead\b/i,
      /\bmanager\b/i,
      /\bdirector|diretor\b/i,
      /\bhead\b/i,
      /\barchitect|arquiteto\b/i,
      /founding\s+engineer/i,
      /tech\s+lead/i,
      /specialist\s+senior|especialista\s+s[êe]nior/i,
      /\bgerente\b/i,
      /\bcoordenador\b/i
    ];
    for (const pattern of seniorKeywords) {
      if (pattern.test(t)) {
        return {
          status: "over_senior",
          reason: "seniority_mismatch",
          explanation: "Suprimida por senioridade incompatível com perfil atual",
        };
      }
    }
  }

  // 3. Kill switch: Acadêmico incompatível (requer PhD)
  const phdKeywords = [
    /\bphd\b/i,
    /\bdoctorate\b/i,
    /\bdoctoral\b/i,
    /p[óo]s-doutorado/i,
    /research\s+scientist\s+phd/i,
    /intern\s+requiring\s+phd/i,
    /phd\s+student\s+required/i
  ];
  for (const pattern of phdKeywords) {
    if (pattern.test(t) || (pattern.test(d) && /must\s+have\s+phd|required\s+phd|obrigat[oó]rio\s+phd/i.test(d))) {
      return {
        status: "requires_degree",
        reason: "phd_required",
        explanation: "Suprimida: vaga exige doutorado ou PhD acadêmico",
      };
    }
  }

  // 4. Kill switch: Vendas / Business / Comercial
  const salesKeywords = [
    /account\s+executive/i,
    /\bsales\b/i,
    /\bvendas\b/i,
    /\bsdr\b/i,
    /\bbdr\b/i,
    /business\s+development/i,
    /customer\s+success/i,
    /account\s+manager/i,
    /\brevenue\b/i,
    /\bquota\b/i,
    /pipeline\s+comercial/i,
    /ppc\s+strategist/i,
    /amazon\s+ppc/i,
    /advertising\s+specialist/i
  ];
  for (const pattern of salesKeywords) {
    if (pattern.test(t)) {
      return {
        status: "sales_business_role",
        reason: "sales_role",
        explanation: "Suprimida: vaga de caráter comercial/vendas",
      };
    }
  }

  // 5. Kill switch: Fora da trilha (design, WordPress, Elementor, HR/RH, legal/jurídico, marketing, administrativo)
  const wrongTrackKeywords = [
    /graphic\s+designer|designer\s+gr[áa]fico/i,
    /\bwordpress\b/i,
    /\belementor\b/i,
    /\bhr\b/i,
    /recursos\s+humanos/i,
    /\brh\b/i,
    /\brecruiter|recrutador\b/i,
    /\blegal\b/i,
    /privacy\s+analyst/i,
    /administrative\s+analyst|analista\s+administrativo/i,
    /\bmarketing\b/i,
    /social\s+media/i,
    /\bsap\b/i,
    /\bcobol\b/i,
    /\bmainframe\b/i
  ];
  for (const pattern of wrongTrackKeywords) {
    if (pattern.test(t)) {
      // Diferenciar se for vaga de dados/BI disfarçada
      const isDataBI = /\b(data|dados|bi|analytics|sql)\b/i.test(t);
      if (!isDataBI) {
        return {
          status: "wrong_track",
          reason: "wrong_domain",
          explanation: "Suprimida por cargo/domínio fora do escopo de dados/engenharia",
        };
      }
    }
  }

  // Pleno / Mid-level é stretch para perfil entry/junior
  if (profileIsEntry && /\b(pleno|mid|pl\b|pl\.)/i.test(t)) {
    return {
      status: "stretch",
      explanation: "Vaga Pleno/Mid-level (Perfil Stretch)",
    };
  }

  return {
    status: "eligible",
    explanation: "Perfil compatível",
  };
}
