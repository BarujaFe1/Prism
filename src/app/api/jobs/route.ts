import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { desc, eq, like, or, and, asc, inArray } from "drizzle-orm";
import type { ContractType, ExperienceLevel, FitLabel, JobStatus, LocationType } from "@/types";

const ALLOWED_SORT = new Set(["date", "score", "salary", "source"]);
const ALLOWED_PATCH_FIELDS = new Set([
  "status",
  "nextActionType",
  "nextActionDate",
  "lastContactedAt",
  "summary",
  "coverSuggestion",
  "fitLabel",
  "score",
]);

function parseCsvParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

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
    const sortBy = ALLOWED_SORT.has(sortByRaw) ? sortByRaw : "date";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1), 500);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);

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

    if (status.length) conditions.push(inArray(jobs.status, status as JobStatus[]));
    if (source.length) conditions.push(inArray(jobs.source, source));
    if (locationType.length) conditions.push(inArray(jobs.locationType, locationType as LocationType[]));
    if (contractType.length) conditions.push(inArray(jobs.contractType, contractType as ContractType[]));
    if (experienceLevel.length) {
      conditions.push(inArray(jobs.experienceLevel, experienceLevel as ExperienceLevel[]));
    }
    if (fitLabel.length) conditions.push(inArray(jobs.fitLabel, fitLabel as FitLabel[]));

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
    const body = await request.json();
    const { id, ...updates } = body as Record<string, unknown>;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const sanitized: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    for (const [key, value] of Object.entries(updates)) {
      if (ALLOWED_PATCH_FIELDS.has(key)) {
        sanitized[key] = value;
      }
    }

    if (Object.keys(sanitized).length === 1) {
      return NextResponse.json({ error: "no valid fields to update" }, { status: 400 });
    }

    await db.update(jobs).set(sanitized).where(eq(jobs.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
