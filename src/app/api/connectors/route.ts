import { NextResponse } from "next/server";
import { db } from "@/db";
import { connectorLogs, jobs } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { demoModeBlockedResponse, isDemoMode } from "@/lib/api-guards";
import { ALL_CONNECTORS, getConnectors } from "@/lib/jobs/connector-registry";

export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json(demoModeBlockedResponse(), { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    connectorId?: string;
    connectors?: string[];
    mode?: "all" | "reliable" | "experimental";
  };

  const errors: string[] = [];
  const results: Record<string, { new: number; duplicate: number; total: number }> = {};

  let toRun = getConnectors(body.mode || "all");
  if (body.connectorId) {
    toRun = ALL_CONNECTORS.filter((c) => c.id === body.connectorId);
  }
  if (body.connectors?.length) {
    toRun = ALL_CONNECTORS.filter((c) => body.connectors!.includes(c.id));
  }

  for (const connector of toRun) {
    try {
      const result = await connector.fetch();
      results[connector.id] = result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      errors.push(`${connector.name}: ${message}`);
      results[connector.id] = { new: 0, duplicate: 0, total: 0 };
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}

export async function GET() {
  const logs = await db
    .select()
    .from(connectorLogs)
    .orderBy(desc(connectorLogs.runAt))
    .limit(50)
    .all();

  const connectorInfo = await Promise.all(
    ALL_CONNECTORS.map(async (c) => {
      const count = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(eq(jobs.source, c.id))
        .get();
      return {
        id: c.id,
        name: c.name,
        jobCount: count?.count || 0,
        reliable: c.reliable,
        description: c.description,
      };
    })
  );

  return NextResponse.json({ logs, connectors: connectorInfo });
}
