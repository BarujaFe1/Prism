import { NextResponse } from "next/server";
import { db } from "@/db";
import { careerTracks } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  apiError,
  demoModeBlockedResponse,
  isDemoMode,
  sanitizePatch,
  validationError,
} from "@/lib/api-guards";

const ALLOWED_TRACK_PATCH = new Set([
  "active",
  "priority",
  "weight",
  "headline",
  "resumeUrl",
  "notes",
  "roleTitles",
  "coreSkills",
  "secondarySkills",
  "markets",
  "contracts",
  "negativeKeywords",
]);

export async function GET() {
  try {
    const rows = await db.select().from(careerTracks).all();
    rows.sort((a, b) => a.priority - b.priority);
    return NextResponse.json(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load tracks";
    return NextResponse.json(apiError("INTERNAL_ERROR", message), { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (isDemoMode()) {
      return NextResponse.json(demoModeBlockedResponse(), { status: 403 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id : null;
    if (!id) {
      return NextResponse.json(validationError("id is required"), { status: 400 });
    }
    const sanitized = {
      ...sanitizePatch(body, ALLOWED_TRACK_PATCH),
      updatedAt: new Date().toISOString(),
    };
    if (Object.keys(sanitized).length === 1) {
      return NextResponse.json(validationError("no valid fields"), { status: 400 });
    }
    await db.update(careerTracks).set(sanitized).where(eq(careerTracks.id, id));
    const row = await db.select().from(careerTracks).where(eq(careerTracks.id, id)).get();
    return NextResponse.json(row);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update track";
    return NextResponse.json(apiError("INTERNAL_ERROR", message), { status: 500 });
  }
}
