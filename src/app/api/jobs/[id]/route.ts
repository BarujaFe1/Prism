import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, jobEvents, jobFollowups, applicationTasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";

const DEFAULT_TASKS = [
  { type: "resume", label: "Customizar currículo para a vaga" },
  { type: "cover", label: "Escrever carta de apresentação" },
  { type: "research", label: "Pesquisar sobre a empresa" },
  { type: "portfolio", label: "Preparar portfólio / projetos relevantes" },
  { type: "linkedin", label: "Atualizar LinkedIn com palavras-chave da vaga" },
  { type: "referral", label: "Encontrar conexão para indicação" },
  { type: "submit", label: "Submeter candidatura" },
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await db.select().from(jobs).where(eq(jobs.id, id)).get();

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const events = await db
    .select()
    .from(jobEvents)
    .where(eq(jobEvents.jobId, id))
    .orderBy(jobEvents.occurredAt);

  const followups = await db
    .select()
    .from(jobFollowups)
    .where(eq(jobFollowups.jobId, id))
    .orderBy(jobFollowups.dueAt);

  const tasks = await db
    .select()
    .from(applicationTasks)
    .where(eq(applicationTasks.jobId, id))
    .orderBy(applicationTasks.createdAt);

  return NextResponse.json({ job, events, followups, tasks });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const previousJob = await db.select().from(jobs).where(eq(jobs.id, id)).get();

  await db.update(jobs).set(body).where(eq(jobs.id, id));

  if (body.status === "preparing" && previousJob && previousJob.status !== "preparing") {
    const existingTasks = await db
      .select()
      .from(applicationTasks)
      .where(eq(applicationTasks.jobId, id));

    if (existingTasks.length === 0) {
      const now = new Date().toISOString();
      const newTasks = DEFAULT_TASKS.map((t) => ({
        id: generateId(),
        jobId: id,
        type: t.type,
        label: t.label,
        isDone: false,
        createdAt: now,
        completedAt: null,
      }));
      await db.insert(applicationTasks).values(newTasks);
    }
  }

  return NextResponse.json({ ok: true });
}
