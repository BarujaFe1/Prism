import { NextResponse } from "next/server";
import { db } from "@/db";
import { applicationTasks } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  apiError,
  demoModeBlockedResponse,
  isDemoMode,
  validationError,
} from "@/lib/api-guards";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (isDemoMode()) {
      return NextResponse.json(demoModeBlockedResponse(), { status: 403 });
    }

    const { id: jobId } = await params;
    const body = (await request.json()) as { taskId?: string; isDone?: boolean };

    if (!body.taskId || typeof body.taskId !== "string") {
      return NextResponse.json(validationError("taskId is required"), {
        status: 400,
      });
    }

    if (typeof body.isDone !== "boolean") {
      return NextResponse.json(validationError("isDone must be a boolean"), {
        status: 400,
      });
    }

    await db
      .update(applicationTasks)
      .set({
        isDone: body.isDone,
        completedAt: body.isDone ? new Date().toISOString() : null,
      })
      .where(
        and(eq(applicationTasks.id, body.taskId), eq(applicationTasks.jobId, jobId))
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update task";
    return NextResponse.json(apiError("INTERNAL_ERROR", message), { status: 500 });
  }
}
