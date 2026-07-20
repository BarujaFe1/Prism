import type { ContractType, ExperienceLevel } from "@/types";

/** Infer seniority/contract from title+description (PT/EN). */
export function inferExperienceAndContract(
  title: string,
  description = ""
): { experienceLevel: ExperienceLevel; contractType: ContractType } {
  const t = `${title} ${description}`.toLowerCase();

  let experienceLevel: ExperienceLevel = "junior";
  if (
    /\b(est[áa]gio|estagi[aá]rio|internship|intern\b|trainee)\b/i.test(t)
  ) {
    experienceLevel = /trainee/i.test(t) ? "trainee" : "internship";
  } else if (/\b(s[êe]nior|senior|staff|principal|lead|head|diretor)\b/i.test(t)) {
    experienceLevel = "senior";
  } else if (/\b(pleno|mid[\s-]?level|mid)\b/i.test(t)) {
    experienceLevel = "mid";
  } else if (/\b(j[uú]nior|junior|jr\b|entry[\s-]?level)\b/i.test(t)) {
    experienceLevel = "junior";
  }

  let contractType: ContractType = "clt";
  if (/\b(est[áa]gio|internship|intern\b)\b/i.test(t)) contractType = "internship";
  else if (/\b(pj|pessoa jur[ií]dica|contractor)\b/i.test(t)) contractType = "pj";
  else if (/\b(freelance|freelancer)\b/i.test(t)) contractType = "freelancer";
  else if (/\b(portugal|europe|latam|worldwide|international)\b/i.test(t)) {
    contractType = "international";
  }

  return { experienceLevel, contractType };
}
