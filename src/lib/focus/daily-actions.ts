import type { JobWithStatus } from "@/types";

export type DailyAction = {
  id: string;
  kind: "apply" | "follow_up" | "prepare" | "learn" | "review";
  title: string;
  reason: string;
  href: string;
  score?: number;
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

/** Top opportunities worth acting on today (max 3). */
export function selectTopOpportunities(jobs: JobWithStatus[], limit = 3): JobWithStatus[] {
  return jobs
    .filter((j) => {
      if (j.status !== "new" && j.status !== "saved") return false;
      const details = scoreDetails(j);
      const eligibility = String(details.eligibility || "");
      if (SUPPRESSED.has(eligibility)) return false;
      if (details.decisionLabel === "SUPPRESSED") return false;
      return (j.score ?? 0) >= 0.5;
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
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
    });
  }

  const tops = selectTopOpportunities(input.jobs, 3);
  for (const j of tops) {
    if (actions.length >= 3) break;
    actions.push({
      id: `top-${j.id}`,
      kind: "apply",
      title: j.title,
      reason: `Score ${(j.score ?? 0).toFixed(2)} · ${j.company}`,
      href: `/jobs/${j.id}`,
      score: j.score ?? undefined,
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
