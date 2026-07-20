import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, jobEvents } from "@/db/schema";
import { desc, eq, like, or, and, asc, inArray } from "drizzle-orm";
import { generateId, statusLabel } from "@/lib/utils";
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
  escapeLike,
  isDemoMode,
  parseCsvParam,
  sanitizePatch,
  validationError,
  apiError,
} from "@/lib/api-guards";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const status = asJobStatuses(parseCsvParam(searchParams.get("status")));
    const source = parseCsvParam(searchParams.get("source")).slice(0, 50);
    const locationType = asLocationTypes(parseCsvParam(searchParams.get("locationType")));
    const contractType = asContractTypes(parseCsvParam(searchParams.get("contractType")));
    const experienceLevel = asExperienceLevels(
      parseCsvParam(searchParams.get("experienceLevel"))
    );
    const fitLabel = asFitLabels(parseCsvParam(searchParams.get("fitLabel")));
    const sortByRaw = searchParams.get("sortBy") || "date";
    const sortBy = ALLOWED_JOB_SORT.has(sortByRaw) ? sortByRaw : "date";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const limit = clampInt(searchParams.get("limit"), 50, 1, 500);
    const offset = clampInt(searchParams.get("offset"), 0, 0, 100_000);

    const conditions = [];

    if (search) {
      const pattern = `%${escapeLike(search.slice(0, 200))}%`;
      conditions.push(
        or(
          like(jobs.title, pattern),
          like(jobs.company, pattern),
          like(jobs.description, pattern),
          like(jobs.location, pattern)
        )
      );
    }

    if (status.length) conditions.push(inArray(jobs.status, status));
    if (source.length) conditions.push(inArray(jobs.source, source));
    if (locationType.length) conditions.push(inArray(jobs.locationType, locationType));
    if (contractType.length) conditions.push(inArray(jobs.contractType, contractType));
    if (experienceLevel.length) {
      conditions.push(inArray(jobs.experienceLevel, experienceLevel));
    }
    if (fitLabel.length) conditions.push(inArray(jobs.fitLabel, fitLabel));

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

    const sanitized = sanitizePatch(updates, ALLOWED_JOB_PATCH_FIELDS);
    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json(validationError("no valid fields to update"), {
        status: 400,
      });
    }

    const oldJob = await db
      .select({ status: jobs.status })
      .from(jobs)
      .where(eq(jobs.id, id))
      .get();

    await db
      .update(jobs)
      .set({ ...sanitized, updatedAt: new Date().toISOString() })
      .where(eq(jobs.id, id));

    if (
      typeof sanitized.status === "string" &&
      (!oldJob || oldJob.status !== sanitized.status)
    ) {
      const fromStatus = oldJob ? oldJob.status : "new";
      const toStatus = sanitized.status;
      await db.insert(jobEvents).values({
        id: generateId(),
        jobId: id,
        eventType: "status_changed",
        description: `Status alterado de "${statusLabel(fromStatus)}" para "${statusLabel(toStatus)}"`,
        metadata: { from: fromStatus, to: toStatus },
        occurredAt: new Date().toISOString(),
      });
    }

    if (
      typeof sanitized.nextActionType === "string" &&
      typeof sanitized.nextActionDate === "string"
    ) {
      const actionLabel = (type: string) => {
        const map: Record<string, string> = {
          follow_up: "Follow-up",
          prepare: "Preparar candidatura",
          apply: "Aplicar",
          interview: "Entrevista",
          test: "Teste técnico",
          thank_you: "Agradecimento",
        };
        return map[type] || type;
      };
      await db.insert(jobEvents).values({
        id: generateId(),
        jobId: id,
        eventType: "action_scheduled",
        description: `Ação agendada: "${actionLabel(sanitized.nextActionType)}" para ${new Date(sanitized.nextActionDate).toLocaleDateString("pt-BR")}`,
        metadata: { type: sanitized.nextActionType, date: sanitized.nextActionDate },
        occurredAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update job";
    return NextResponse.json(apiError("INTERNAL_ERROR", message), { status: 500 });
  }
}
