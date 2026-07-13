import { db } from "@/db";
import { freelanceProjects } from "@/db/schema";
import { and, lt, lte, gte, eq, sql } from "drizzle-orm";
import { generateId } from "@/lib/utils";

interface OpportunityAlert {
  id: string;
  projectId: string;
  title: string;
  score: number;
  proposals: number;
  rate: string;
  postedAgo: string;
}

const HOURLY_RATE_THRESHOLD = 10;

export async function checkOpportunityAlerts(minFitScore = 75, maxProposals = 5): Promise<OpportunityAlert[]> {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  const projects = await db
    .select()
    .from(freelanceProjects)
    .where(
      and(
        gte(freelanceProjects.fitScore, minFitScore),
        eq(freelanceProjects.status, "new"),
        freelanceProjects.collectedAt
          ? gte(freelanceProjects.collectedAt, sixHoursAgo)
          : sql`1=1`
      )
    )
    .all();

  const alerts: OpportunityAlert[] = [];

  for (const p of projects) {
    const proposals = p.proposalsCount ?? 999;
    if (proposals > maxProposals) continue;

    const rating = p.clientRating ?? 5;
    if (rating < 4.5 && rating !== 0) continue;

    const rateStr = p.hourlyRateMin
      ? `$${p.hourlyRateMin}/hr`
      : p.budgetMin
        ? `$${p.budgetMin}`
        : "";

    const postedDate = p.postedAt ? new Date(p.postedAt) : p.collectedAt ? new Date(p.collectedAt) : new Date();
    const hoursAgo = Math.round((Date.now() - postedDate.getTime()) / 3600000);
    const postedAgo = hoursAgo < 1 ? `${Math.round((Date.now() - postedDate.getTime()) / 60000)}m` : `${hoursAgo}h`;

    alerts.push({
      id: generateId(),
      projectId: p.id,
      title: p.title,
      score: p.fitScore ?? 0,
      proposals,
      rate: rateStr,
      postedAgo,
    });
  }

  return alerts;
}

export async function checkExpiringProjects(): Promise<OpportunityAlert[]> {
  const soon = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const projects = await db
    .select()
    .from(freelanceProjects)
    .where(
      and(
        eq(freelanceProjects.status, "saved"),
        freelanceProjects.expiresAt
          ? and(
              lte(freelanceProjects.expiresAt, soon),
              gte(freelanceProjects.expiresAt, now)
            )
          : sql`1=1`
      )
    )
    .all();

  return projects.map((p) => ({
    id: generateId(),
    projectId: p.id,
    title: p.title,
    score: p.fitScore ?? 0,
    proposals: p.proposalsCount ?? 0,
    rate: p.hourlyRateMin ? `$${p.hourlyRateMin}/hr` : "",
    postedAgo: "expirando",
  }));
}
