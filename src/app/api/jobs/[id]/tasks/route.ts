import { NextResponse } from "next/server";
import { db } from "@/db";
import { applicationTasks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { taskId, isDone } = body;

  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  await db
    .update(applicationTasks)
    .set({
      isDone,
      completedAt: isDone ? new Date().toISOString() : null,
    })
    .where(eq(applicationTasks.id, taskId));

  return NextResponse.json({ ok: true });
}
