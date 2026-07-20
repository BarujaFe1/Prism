import type { JobWithStatus } from "@/types";
import { domainToVertical, type CareerVertical } from "@/lib/career/verticals";

export type DailyAction = {
  id: string;
  kind: "apply" | "follow_up" | "prepare" | "learn" | "review";
  title: string;
  reason: string;
  href: string;
  score?: number;
  vertical?: CareerVertical;
};

export type WipSnapshot = {
  preparing: number;
  learningTodo: number;
  maxPreparing: number;
  maxLearning: number;
  maxPortfolio: number;
  preparingOver: boolean;
  learningOver: boolean;
};

const SUPPRESSED = new Set([
  "over_senior",
  "wrong_track",
  "requires_degree",
  "sales_business_role",
  "freelance_noise",
  "hard_no",
]);

function scoreDetails(job: JobWithStatus): Record<string, unknown> {
  try {
    const raw = job.scoreDetails;
    return (typeof raw === "string" ? JSON.parse(raw) : raw) || {};
  } catch {
    return {};
  }
}

function jobVertical(job: JobWithStatus): CareerVertical {
  const details = scoreDetails(job);
  if (details.vertical === "dev" || details.vertical === "dados" || details.vertical === "other") {
    return details.vertical;
  }
  return domainToVertical(typeof details.domain === "string" ? details.domain : null);
}

function eligiblePool(jobs: JobWithStatus[]): JobWithStatus[] {
  return jobs
    .filter((j) => {
      if (j.status !== "new" && j.status !== "saved") return false;
      const details = scoreDetails(j);
      const eligibility = String(details.eligibility || "");
      if (SUPPRESSED.has(eligibility)) return false;
      if (details.decisionLabel === "SUPPRESSED") return false;
      return (j.score ?? 0) >= 0.5;
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

/**
 * Top opportunities with Dev/Dados diversification when both exist.
 * Ensures at least one of each vertical in the top N when possible.
 */
export function selectTopOpportunities(jobs: JobWithStatus[], limit = 3): JobWithStatus[] {
  const pool = eligiblePool(jobs);
  if (pool.length <= limit) return pool;

  const byVertical = {
    dev: pool.filter((j) => jobVertical(j) === "dev"),
    dados: pool.filter((j) => jobVertical(j) === "dados"),
    other: pool.filter((j) => jobVertical(j) === "other"),
  };

  const picked: JobWithStatus[] = [];
  const used = new Set<string>();

  const take = (list: JobWithStatus[]) => {
    for (const j of list) {
      if (picked.length >= limit) return;
      if (used.has(j.id)) continue;
      used.add(j.id);
      picked.push(j);
      return;
    }
  };

  // Equal effort: seat for Dev and Dados first when both have candidates
  if (byVertical.dev.length && byVertical.dados.length) {
    take(byVertical.dev);
    take(byVertical.dados);
  }

  // Fill remaining by overall score
  for (const j of pool) {
    if (picked.length >= limit) break;
    if (used.has(j.id)) continue;
    used.add(j.id);
    picked.push(j);
  }

  return picked;
}

/** Split ranked lists for dual-vertical UI panels */
export function selectByVertical(
  jobs: JobWithStatus[],
  vertical: "dev" | "dados",
  limit = 5
): JobWithStatus[] {
  return eligiblePool(jobs)
    .filter((j) => jobVertical(j) === vertical)
    .slice(0, limit);
}

export function selectFollowUpsOverdue(
  jobs: JobWithStatus[],
  followUpDays = 5
): JobWithStatus[] {
  const now = Date.now();
  const threshold = followUpDays * 86400000;
  return jobs.filter((j) => {
    if (!["applied", "reviewing", "interview"].includes(j.status)) return false;
    return now - new Date(j.updatedAt).getTime() > threshold;
  });
}

export function buildDailyActions(input: {
  jobs: JobWithStatus[];
  followUpDays?: number;
  learningTitle?: string | null;
  learningHref?: string;
}): DailyAction[] {
  const actions: DailyAction[] = [];
  const followUps = selectFollowUpsOverdue(input.jobs, input.followUpDays ?? 5);
  for (const j of followUps.slice(0, 2)) {
    actions.push({
      id: `fu-${j.id}`,
      kind: "follow_up",
      title: `Follow-up: ${j.title}`,
      reason: `${j.company} · sem atualização há ${input.followUpDays ?? 5}+ dias`,
      href: `/jobs/${j.id}`,
      score: j.score ?? undefined,
      vertical: jobVertical(j),
    });
  }

  const tops = selectTopOpportunities(input.jobs, 3);
  for (const j of tops) {
    if (actions.length >= 3) break;
    const v = jobVertical(j);
    const vLabel = v === "dev" ? "Dev" : v === "dados" ? "Dados" : "Radar";
    actions.push({
      id: `top-${j.id}`,
      kind: "apply",
      title: j.title,
      reason: `${vLabel} · Score ${(j.score ?? 0).toFixed(2)} · ${j.company}`,
      href: `/jobs/${j.id}`,
      score: j.score ?? undefined,
      vertical: v,
    });
  }

  if (actions.length < 3 && input.learningTitle) {
    actions.push({
      id: "learn-1",
      kind: "learn",
      title: input.learningTitle,
      reason: "Lacuna de alto ROI no backlog de estudos",
      href: input.learningHref || "/profile#learning-backlog-card",
    });
  }

  return actions.slice(0, 3);
}

export function computeWip(input: {
  preparingCount: number;
  learningTodoCount: number;
  maxPreparing?: number;
  maxLearning?: number;
  maxPortfolio?: number;
}): WipSnapshot {
  const maxPreparing = input.maxPreparing ?? 5;
  const maxLearning = input.maxLearning ?? 2;
  const maxPortfolio = input.maxPortfolio ?? 1;
  return {
    preparing: input.preparingCount,
    learningTodo: input.learningTodoCount,
    maxPreparing,
    maxLearning,
    maxPortfolio,
    preparingOver: input.preparingCount > maxPreparing,
    learningOver: input.learningTodoCount > maxLearning,
  };
}

export function clampWipWarning(wip: WipSnapshot): string | null {
  if (wip.preparingOver && wip.learningOver) {
    return `WIP estourado: ${wip.preparing}/${wip.maxPreparing} em preparação e ${wip.learningTodo}/${wip.maxLearning} estudos ativos. Pause algo antes de abrir frentes novas.`;
  }
  if (wip.preparingOver) {
    return `WIP: ${wip.preparing} candidaturas em preparação (limite ${wip.maxPreparing}).`;
  }
  if (wip.learningOver) {
    return `WIP: ${wip.learningTodo} metas de estudo ativas (limite ${wip.maxLearning}).`;
  }
  return null;
}
