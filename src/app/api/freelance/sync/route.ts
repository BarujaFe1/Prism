import { NextResponse } from "next/server";
import { syncAllFreelanceSources } from "@/lib/freelance/sync";
import { db } from "@/db";
import {
  freelanceProjects,
  freelanceSources,
  freelanceProposals,
} from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const sourceId = body.sourceId as string | undefined;

  const { results, errors } = await syncAllFreelanceSources(sourceId);

  return NextResponse.json({
    ok: errors.length === 0,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}

export async function GET() {
  const logs = await db
    .select({
      id: freelanceSources.id,
      name: freelanceSources.name,
      platform: freelanceSources.platform,
      lastSyncAt: freelanceSources.lastSyncAt,
      totalCollected: freelanceSources.totalCollected,
      status: freelanceSources.status,
      errorMessage: freelanceSources.errorMessage,
      enabled: freelanceSources.enabled,
    })
    .from(freelanceSources)
    .all();

  const totalProjects = await db
    .select({ count: sql<number>`count(*)` })
    .from(freelanceProjects)
    .get();

  const byPlatform = await db
    .select({
      platform: freelanceProjects.platform,
      count: sql<number>`count(*)`,
    })
    .from(freelanceProjects)
    .groupBy(freelanceProjects.platform)
    .all();

  const recentAlerts = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(freelanceProjects)
    .where(sql`fit_score >= 75 AND proposals_count <= 5 AND status = 'new'`)
    .get();

  return NextResponse.json({
    sources: logs,
    totalProjects: totalProjects?.count || 0,
    byPlatform: byPlatform.reduce(
      (acc: Record<string, number>, r: any) => {
        acc[r.platform] = r.count;
        return acc;
      },
      {} as Record<string, number>
    ),
    opportunityWindows: recentAlerts?.count || 0,
  });
}
