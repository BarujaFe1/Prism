import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobFollowups } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  apiError,
  demoModeBlockedResponse,
  isDemoMode,
  validationError,
} from "@/lib/api-guards";
import { generateId } from "@/lib/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (isDemoMode()) {
      return NextResponse.json(demoModeBlockedResponse(), { status: 403 });
    }

    const { id } = await params;
    const body = (await request.json()) as {
      followup?: {
        id?: string;
        title?: string;
        note?: string;
        dueAt?: string;
        done?: boolean;
        doneAt?: string | null;
      };
    };
    const followup = body.followup;

    if (!followup?.title || !followup?.dueAt) {
      return NextResponse.json(
        validationError("followup.title and followup.dueAt are required"),
        { status: 400 }
      );
    }

    await db.insert(jobFollowups).values({
      id: followup.id || generateId(),
      jobId: id,
      title: followup.title,
      note: followup.note || "",
      dueAt: followup.dueAt,
      done: followup.done || false,
      doneAt: followup.doneAt || null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create followup";
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
    const body = (await request.json()) as {
      followupId?: string;
      done?: boolean;
    };

    if (!body.followupId || typeof body.followupId !== "string") {
      return NextResponse.json(validationError("followupId is required"), {
        status: 400,
      });
    }

    if (typeof body.done !== "boolean") {
      return NextResponse.json(validationError("done must be a boolean"), {
        status: 400,
      });
    }

    await db
      .update(jobFollowups)
      .set({
        done: body.done,
        doneAt: body.done ? new Date().toISOString() : null,
      })
      .where(and(eq(jobFollowups.id, body.followupId), eq(jobFollowups.jobId, id)));

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update followup";
    return NextResponse.json(apiError("INTERNAL_ERROR", message), { status: 500 });
  }
}
