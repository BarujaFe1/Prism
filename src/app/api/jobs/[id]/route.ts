import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, jobEvents, jobFollowups, applicationTasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import {
  ALLOWED_JOB_PATCH_FIELDS,
  apiError,
  demoModeBlockedResponse,
  isDemoMode,
  sanitizePatch,
  validationError,
} from "@/lib/api-guards";

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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await db.select().from(jobs).where(eq(jobs.id, id)).get();

    if (!job) {
      return NextResponse.json(apiError("NOT_FOUND", "Job not found"), {
        status: 404,
      });
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load job";
    return NextResponse.json(apiError("INTERNAL_ERROR", message), { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (isDemoMode()) {
      return NextResponse.json(demoModeBlockedResponse(), { status: 403 });
    }

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const sanitized = sanitizePatch(body, ALLOWED_JOB_PATCH_FIELDS);

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json(validationError("no valid fields to update"), {
        status: 400,
      });
    }

    const previousJob = await db.select().from(jobs).where(eq(jobs.id, id)).get();
    if (!previousJob) {
      return NextResponse.json(apiError("NOT_FOUND", "Job not found"), {
        status: 404,
      });
    }

    await db
      .update(jobs)
      .set({ ...sanitized, updatedAt: new Date().toISOString() })
      .where(eq(jobs.id, id));

    if (
      sanitized.status === "preparing" &&
      previousJob.status !== "preparing"
    ) {
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update job";
    return NextResponse.json(apiError("INTERNAL_ERROR", message), { status: 500 });
  }
}
