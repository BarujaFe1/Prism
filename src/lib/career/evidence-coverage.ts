/**
 * Evidence coverage / heatmap — distinguishes real gaps from unregistered evidence.
 */
export type EvidenceLike = {
  associatedSkills?: string[] | null;
  confidence?: string | null;
  projectUrl?: string | null;
  metrics?: string | null;
  approvedResumeBullet?: string | null;
  verifiedByUser?: boolean | null;
};

export type CoverageStatus =
  | "strong"
  | "partial"
  | "pending"
  | "real_gap"
  | "unregistered_evidence"
  | "in_learning";

export type CoverageRow = {
  skill: string;
  status: CoverageStatus;
  label: string;
  evidenceCount: number;
  jobDemand: number;
};

export function normalizeSkill(s: string): string {
  return s.toLowerCase().trim();
}

export function evidencesForSkill(skill: string, evidences: EvidenceLike[]): EvidenceLike[] {
  const key = normalizeSkill(skill);
  return evidences.filter((e) =>
    (e.associatedSkills || []).some((x) => normalizeSkill(x) === key)
  );
}

export function classifySkillCoverage(
  skill: string,
  evidences: EvidenceLike[],
  opts?: {
    inLearningBacklog?: boolean;
    jobDemand?: number;
    /** Skill listed on profile but no evidence rows */
    onProfile?: boolean;
  }
): CoverageRow {
  const evs = evidencesForSkill(skill, evidences);
  const jobDemand = opts?.jobDemand ?? 0;
  const inLearning = !!opts?.inLearningBacklog;

  if (evs.length > 0) {
    const hasStrong = evs.some((e) => e.confidence === "high");
    const hasLink = evs.some((e) => !!e.projectUrl);
    const hasMetric = evs.some((e) => !!e.metrics);
    const hasBullet = evs.some((e) => !!e.approvedResumeBullet);

    if (hasStrong && hasLink && hasMetric && hasBullet) {
      return {
        skill,
        status: "strong",
        label: "Forte",
        evidenceCount: evs.length,
        jobDemand,
      };
    }
    if (!hasLink || !hasMetric || !hasBullet) {
      return {
        skill,
        status: "partial",
        label: !hasLink ? "Evidência parcial (sem link)" : !hasMetric ? "Evidência parcial (sem métrica)" : "Evidência parcial (sem bullet)",
        evidenceCount: evs.length,
        jobDemand,
      };
    }
    return {
      skill,
      status: "pending",
      label: "Pendente de validação",
      evidenceCount: evs.length,
      jobDemand,
    };
  }

  if (inLearning) {
    return {
      skill,
      status: "in_learning",
      label: "Em estudo",
      evidenceCount: 0,
      jobDemand,
    };
  }

  // Demand without profile skill → real gap; profile skill without evidence → unregistered
  if (opts?.onProfile) {
    return {
      skill,
      status: "unregistered_evidence",
      label: "Evidência não cadastrada",
      evidenceCount: 0,
      jobDemand,
    };
  }

  return {
    skill,
    status: "real_gap",
    label: jobDemand >= 2 ? "Gap recorrente" : "Gap",
    evidenceCount: 0,
    jobDemand,
  };
}

export function buildCoverageHeatmap(input: {
  profileSkills: string[];
  evidences: EvidenceLike[];
  learningSkills?: string[];
  jobTechCounts?: Record<string, number>;
}): {
  strong: CoverageRow[];
  partial: CoverageRow[];
  pending: CoverageRow[];
  unregistered: CoverageRow[];
  realGaps: CoverageRow[];
  inLearning: CoverageRow[];
  all: CoverageRow[];
} {
  const learning = new Set((input.learningSkills || []).map(normalizeSkill));
  const profileSet = new Set(input.profileSkills.map(normalizeSkill));
  const demand = input.jobTechCounts || {};

  const allSkills = new Set<string>();
  input.profileSkills.forEach((s) => allSkills.add(s));
  (input.learningSkills || []).forEach((s) => allSkills.add(s));
  Object.keys(demand).forEach((t) => {
    if ((demand[t] || 0) >= 2) allSkills.add(t);
  });

  // Also include skills proven only via evidence
  for (const ev of input.evidences) {
    for (const s of ev.associatedSkills || []) allSkills.add(s);
  }

  const all: CoverageRow[] = [];
  for (const skill of allSkills) {
    const key = normalizeSkill(skill);
    const row = classifySkillCoverage(skill, input.evidences, {
      inLearningBacklog: learning.has(key),
      jobDemand: demand[skill] || demand[Object.keys(demand).find((k) => normalizeSkill(k) === key) || ""] || 0,
      onProfile: profileSet.has(key),
    });
    all.push(row);
  }

  return {
    strong: all.filter((r) => r.status === "strong"),
    partial: all.filter((r) => r.status === "partial"),
    pending: all.filter((r) => r.status === "pending"),
    unregistered: all.filter((r) => r.status === "unregistered_evidence"),
    realGaps: all.filter((r) => r.status === "real_gap"),
    inLearning: all.filter((r) => r.status === "in_learning"),
    all,
  };
}

/** Map DB/JSON evidence into profile.skillsEvidence dual-write shape */
export function toSkillsEvidenceJson(rows: Array<{
  id: string;
  projectName: string;
  projectUrl?: string | null;
  description?: string | null;
  metrics?: string | null;
  approvedResumeBullet?: string | null;
  confidence?: string | null;
  associatedSkills?: string[] | null;
}>): unknown[] {
  return rows.map((r) => ({
    id: r.id,
    projectName: r.projectName,
    projectUrl: r.projectUrl ?? null,
    description: r.description ?? null,
    metrics: r.metrics ?? null,
    approvedResumeBullet: r.approvedResumeBullet ?? null,
    confidence: r.confidence ?? "medium",
    associatedSkills: r.associatedSkills ?? [],
  }));
}
