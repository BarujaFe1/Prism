import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobFollowups } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { followup } = body;

  await db.insert(jobFollowups).values({
    id: followup.id,
    jobId: id,
    title: followup.title,
    note: followup.note || "",
    dueAt: followup.dueAt,
    done: followup.done || false,
    doneAt: followup.doneAt || null,
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { followupId, done } = body;

  await db
    .update(jobFollowups)
    .set({
      done,
      doneAt: done ? new Date().toISOString() : null,
    })
    .where(and(eq(jobFollowups.id, followupId), eq(jobFollowups.jobId, id)));

  return NextResponse.json({ ok: true });
}
