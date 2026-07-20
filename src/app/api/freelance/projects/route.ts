import { NextResponse } from "next/server";
import { db } from "@/db";
import { freelanceProjects } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  ALLOWED_FREELANCE_PATCH_FIELDS,
  apiError,
  clampInt,
  demoModeBlockedResponse,
  isDemoMode,
  sanitizePatch,
  validationError,
} from "@/lib/api-guards";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const limit = clampInt(searchParams.get("limit"), 50, 1, 500);
    const status = searchParams.get("status");
    const platform = searchParams.get("platform");

    if (id) {
      const project = await db
        .select()
        .from(freelanceProjects)
        .where(eq(freelanceProjects.id, id))
        .get();
      return NextResponse.json({ project: project || null });
    }

    const conditions = [];
    if (status) conditions.push(eq(freelanceProjects.status, status));
    if (platform) conditions.push(eq(freelanceProjects.platform, platform));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const projects = await db
      .select()
      .from(freelanceProjects)
      .where(where)
      .orderBy(desc(freelanceProjects.collectedAt))
      .limit(limit)
      .all();

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(freelanceProjects)
      .get();

    return NextResponse.json({ projects, total: total?.count || 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list projects";
    return NextResponse.json(apiError("INTERNAL_ERROR", message), { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (isDemoMode()) {
      return NextResponse.json(demoModeBlockedResponse(), { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const { id, ...updates } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(validationError("id is required"), { status: 400 });
    }

    const sanitized = sanitizePatch(updates, ALLOWED_FREELANCE_PATCH_FIELDS);
    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json(validationError("no valid fields to update"), {
        status: 400,
      });
    }

    await db
      .update(freelanceProjects)
      .set({ ...sanitized, updatedAt: new Date().toISOString() })
      .where(eq(freelanceProjects.id, id))
      .run();

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update project";
    return NextResponse.json(apiError("INTERNAL_ERROR", message), { status: 500 });
  }
}
