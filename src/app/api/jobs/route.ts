import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, jobEvents } from "@/db/schema";
import { desc, eq, like, or, and, sql } from "drizzle-orm";
import { generateId, statusLabel } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const source = searchParams.get("source") || "";
  const locationType = searchParams.get("locationType") || "";
  const contractType = searchParams.get("contractType") || "";
  const experienceLevel = searchParams.get("experienceLevel") || "";
  const fitLabel = searchParams.get("fitLabel") || "";
  const sortBy = searchParams.get("sortBy") || "date";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

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

  if (status) {
    const statuses = status.split(",");
    conditions.push(sql`${jobs.status} IN (${statuses.join(",")})`);
  }

  if (source) {
    const sources = source.split(",").map((s) => `'${s}'`).join(",");
    conditions.push(sql`${jobs.source} IN (${sources})`);
  }

  if (locationType) {
    const types = locationType.split(",").map((s) => `'${s}'`).join(",");
    conditions.push(sql`${jobs.locationType} IN (${types})`);
  }

  if (contractType) {
    const types = contractType.split(",").map((s) => `'${s}'`).join(",");
    conditions.push(sql`${jobs.contractType} IN (${types})`);
  }

  if (experienceLevel) {
    const levels = experienceLevel.split(",").map((s) => `'${s}'`).join(",");
    conditions.push(sql`${jobs.experienceLevel} IN (${levels})`);
  }

  if (fitLabel) {
    const labels = fitLabel.split(",").map((s) => `'${s}'`).join(",");
    conditions.push(sql`${jobs.fitLabel} IN (${labels})`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  let orderBy;
  switch (sortBy) {
    case "score":
      orderBy = sortOrder === "desc" ? desc(jobs.score) : sql`${jobs.score} ASC`;
      break;
    case "salary":
      orderBy = sortOrder === "desc" ? desc(jobs.salaryMax) : sql`${jobs.salaryMax} ASC`;
      break;
    case "source":
      orderBy = sortOrder === "desc" ? desc(jobs.source) : sql`${jobs.source} ASC`;
      break;
    default:
      orderBy = sortOrder === "desc" ? desc(jobs.postedAt) : sql`${jobs.postedAt} ASC`;
  }

  const results = await db
    .select()
    .from(jobs)
    .where(where)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  return NextResponse.json(results);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Retrieve old status/action to record changes in the events log
  const oldJob = await db
    .select({ status: jobs.status })
    .from(jobs)
    .where(eq(jobs.id, id))
    .get();

  await db.update(jobs).set(updates).where(eq(jobs.id, id));

  // Record status changed event
  if (updates.status && (!oldJob || oldJob.status !== updates.status)) {
    const fromStatus = oldJob ? oldJob.status : "new";
    const toStatus = updates.status;
    await db.insert(jobEvents).values({
      id: generateId(),
      jobId: id,
      eventType: "status_changed",
      description: `Status alterado de "${statusLabel(fromStatus)}" para "${statusLabel(toStatus)}"`,
      metadata: { from: fromStatus, to: toStatus },
      occurredAt: new Date().toISOString(),
    });
  }

  // Record next action scheduled event
  if (updates.nextActionType && updates.nextActionDate) {
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
      description: `Ação agendada: "${actionLabel(updates.nextActionType)}" para ${new Date(updates.nextActionDate).toLocaleDateString("pt-BR")}`,
      metadata: { type: updates.nextActionType, date: updates.nextActionDate },
      occurredAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true });
}
