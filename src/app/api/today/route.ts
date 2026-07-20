import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, profile, settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiError } from "@/lib/api-guards";
import {
  buildDailyActions,
  clampWipWarning,
  computeWip,
  selectByVertical,
  selectFollowUpsOverdue,
  selectTopOpportunities,
} from "@/lib/focus/daily-actions";

export async function GET() {
  try {
    const allJobs = await db.select().from(jobs).all();
    const p = await db.select().from(profile).where(eq(profile.id, "default")).get();
    const s = await db.select().from(settings).where(eq(settings.id, "default")).get();

    const learning = ((p?.learningBacklog as any[]) || [])
      .filter((t) => t?.status === "todo")
      .sort((a, b) => {
        const rank = { high: 0, medium: 1, low: 2 } as Record<string, number>;
        return (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9);
      })[0];

    const followUpDays = s?.followUpDays ?? 5;
    const actions = buildDailyActions({
      jobs: allJobs as any,
      followUpDays,
      learningTitle: learning?.title || null,
      learningHref: "/profile#learning-backlog-card",
    });

    const preparingCount = allJobs.filter((j) => j.status === "preparing").length;
    const learningTodo = ((p?.learningBacklog as any[]) || []).filter(
      (t) => t?.status === "todo"
    ).length;

    const wip = computeWip({
      preparingCount,
      learningTodoCount: learningTodo,
      maxPreparing: s?.wipMaxPreparing ?? 5,
      maxLearning: s?.wipMaxLearning ?? 2,
      maxPortfolio: s?.wipMaxPortfolioProjects ?? 1,
    });

    return NextResponse.json({
      actions,
      topJobs: selectTopOpportunities(allJobs as any, 5),
      topDev: selectByVertical(allJobs as any, "dev", 5),
      topDados: selectByVertical(allJobs as any, "dados", 5),
      followUpsOverdue: selectFollowUpsOverdue(allJobs as any, followUpDays),
      wip,
      wipWarning: clampWipWarning(wip),
      dontDoNow: (s?.dontDoNow as string[]) || [],
      learningFocus: learning
        ? { title: learning.title, skill: learning.skill, reason: learning.reason }
        : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load today focus";
    return NextResponse.json(apiError("INTERNAL_ERROR", message), { status: 500 });
  }
}
