import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { desc, eq, like, or, and, asc, inArray } from "drizzle-orm";
import {
  ALLOWED_JOB_PATCH_FIELDS,
  ALLOWED_JOB_SORT,
  asContractTypes,
  asExperienceLevels,
  asFitLabels,
  asJobStatuses,
  asLocationTypes,
  clampInt,
  demoModeBlockedResponse,
  isDemoMode,
  parseCsvParam,
  sanitizePatch,
} from "@/lib/api-guards";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const status = parseCsvParam(searchParams.get("status"));
    const source = parseCsvParam(searchParams.get("source"));
    const locationType = parseCsvParam(searchParams.get("locationType"));
    const contractType = parseCsvParam(searchParams.get("contractType"));
    const experienceLevel = parseCsvParam(searchParams.get("experienceLevel"));
    const fitLabel = parseCsvParam(searchParams.get("fitLabel"));
    const sortByRaw = searchParams.get("sortBy") || "date";
    const sortBy = ALLOWED_JOB_SORT.has(sortByRaw) ? sortByRaw : "date";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const limit = clampInt(searchParams.get("limit"), 50, 1, 500);
    const offset = clampInt(searchParams.get("offset"), 0, 0, 100_000);

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(jobs.title, `%${search}%`),
          like(jobs.company, `%${search}%`),
          like(jobs.description, `%${search}%`),
          like(jobs.location, `%${search}%`)
        )
      );
    }

    if (status.length) conditions.push(inArray(jobs.status, asJobStatuses(status)));
    if (source.length) conditions.push(inArray(jobs.source, source));
    if (locationType.length) conditions.push(inArray(jobs.locationType, asLocationTypes(locationType)));
    if (contractType.length) conditions.push(inArray(jobs.contractType, asContractTypes(contractType)));
    if (experienceLevel.length) {
      conditions.push(inArray(jobs.experienceLevel, asExperienceLevels(experienceLevel)));
    }
    if (fitLabel.length) conditions.push(inArray(jobs.fitLabel, asFitLabels(fitLabel)));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    let orderBy;
    switch (sortBy) {
      case "score":
        orderBy = sortOrder === "desc" ? desc(jobs.score) : asc(jobs.score);
        break;
      case "salary":
        orderBy = sortOrder === "desc" ? desc(jobs.salaryMax) : asc(jobs.salaryMax);
        break;
      case "source":
        orderBy = sortOrder === "desc" ? desc(jobs.source) : asc(jobs.source);
        break;
      default:
        orderBy = sortOrder === "desc" ? desc(jobs.postedAt) : asc(jobs.postedAt);
    }

    const results = await db
      .select()
      .from(jobs)
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list jobs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (isDemoMode()) {
      return NextResponse.json(demoModeBlockedResponse(), { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body as Record<string, unknown>;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const sanitized = sanitizePatch(updates, ALLOWED_JOB_PATCH_FIELDS);
    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json({ error: "no valid fields to update" }, { status: 400 });
    }

    await db
      .update(jobs)
      .set({ ...sanitized, updatedAt: new Date().toISOString() })
      .where(eq(jobs.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
