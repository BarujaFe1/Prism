import { NextResponse } from "next/server";
import { db } from "@/db";
import { profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  ALLOWED_PROFILE_FIELDS,
  apiError,
  demoModeBlockedResponse,
  isDemoMode,
  sanitizePatch,
  validationError,
} from "@/lib/api-guards";

export async function GET() {
  try {
    const p = await db.select().from(profile).where(eq(profile.id, "default")).get();
    return NextResponse.json(p || {});
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load profile";
    return NextResponse.json(apiError("INTERNAL_ERROR", message), { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (isDemoMode()) {
      return NextResponse.json(demoModeBlockedResponse(), { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const sanitized = {
      ...sanitizePatch(body, ALLOWED_PROFILE_FIELDS),
      updatedAt: new Date().toISOString(),
    };

    if (Object.keys(sanitized).length === 1) {
      return NextResponse.json(validationError("no valid fields to update"), {
        status: 400,
      });
    }

    await db.update(profile).set(sanitized).where(eq(profile.id, "default"));
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update profile";
    return NextResponse.json(apiError("INTERNAL_ERROR", message), { status: 500 });
  }
}
