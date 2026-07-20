import { NextResponse } from "next/server";
import { db } from "@/db";
import { projectEvidences, profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  apiError,
  demoModeBlockedResponse,
  isDemoMode,
  sanitizePatch,
  validationError,
} from "@/lib/api-guards";
import { toSkillsEvidenceJson } from "@/lib/career/evidence-coverage";

const ALLOWED_EVIDENCE_FIELDS = new Set([
  "projectName",
  "projectUrl",
  "demoUrl",
  "description",
  "metrics",
  "metricKind",
  "approvedResumeBullet",
  "confidence",
  "associatedSkills",
  "sourceType",
  "sourceUrl",
  "verifiedByUser",
  "lastReviewedAt",
  "evidenceLevel",
  "claimsAllowed",
  "claimsForbidden",
]);

async function dualWriteSkillsEvidence() {
  const all = await db.select().from(projectEvidences).all();
  const json = toSkillsEvidenceJson(all);
  await db
    .update(profile)
    .set({ skillsEvidence: json as any, updatedAt: new Date().toISOString() })
    .where(eq(profile.id, "default"));
}

export async function GET() {
  try {
    const rows = await db.select().from(projectEvidences).all();
    rows.sort((a, b) => a.projectName.localeCompare(b.projectName));
    return NextResponse.json(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load evidences";
    return NextResponse.json(apiError("INTERNAL_ERROR", message), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (isDemoMode()) {
      return NextResponse.json(demoModeBlockedResponse(), { status: 403 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    const projectName = typeof body.projectName === "string" ? body.projectName.trim() : "";
    if (!projectName) {
      return NextResponse.json(validationError("projectName is required"), { status: 400 });
    }
    const now = new Date().toISOString();
    const id =
      typeof body.id === "string" && body.id
        ? body.id
        : `ev-${crypto.randomUUID().slice(0, 8)}`;
    const sanitized = sanitizePatch(body, ALLOWED_EVIDENCE_FIELDS);
    await db.insert(projectEvidences).values({
      id,
      projectName,
      ...sanitized,
      createdAt: now,
      updatedAt: now,
    } as any);
    await dualWriteSkillsEvidence();
    const row = await db.select().from(projectEvidences).where(eq(projectEvidences.id, id)).get();
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create evidence";
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
      ...sanitizePatch(body, ALLOWED_EVIDENCE_FIELDS),
      updatedAt: new Date().toISOString(),
    };
    if (Object.keys(sanitized).length === 1) {
      return NextResponse.json(validationError("no valid fields"), { status: 400 });
    }
    await db.update(projectEvidences).set(sanitized).where(eq(projectEvidences.id, id));
    await dualWriteSkillsEvidence();
    const row = await db.select().from(projectEvidences).where(eq(projectEvidences.id, id)).get();
    return NextResponse.json(row);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update evidence";
    return NextResponse.json(apiError("INTERNAL_ERROR", message), { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (isDemoMode()) {
      return NextResponse.json(demoModeBlockedResponse(), { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(validationError("id is required"), { status: 400 });
    }
    await db.delete(projectEvidences).where(eq(projectEvidences.id, id));
    await dualWriteSkillsEvidence();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete evidence";
    return NextResponse.json(apiError("INTERNAL_ERROR", message), { status: 500 });
  }
}
