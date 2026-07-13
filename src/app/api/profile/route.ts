import { NextResponse } from "next/server";
import { db } from "@/db";
import { profile } from "@/db/schema";
import { eq } from "drizzle-orm";

const ALLOWED_FIELDS = new Set([
  "name",
  "headline",
  "summary",
  "skills",
  "desiredRoles",
  "desiredSalaryMin",
  "desiredSalaryMax",
  "desiredCurrency",
  "desiredLocationTypes",
  "desiredContractTypes",
  "experienceLevel",
  "languages",
  "negativeKeywords",
  "githubUrl",
  "linkedinUrl",
  "portfolioUrl",
  "resumeUrl",
  "resumeFilename",
  "contactEmail",
  "freelanceMinHourlyRate",
  "freelancePreferredCurrency",
  "freelanceAvailableHoursPerWeek",
  "freelanceOpenToFixedPrice",
  "freelanceMinFixedProjectValue",
  "freelanceExperienceYears",
  "freelancePortfolioUrl",
  "freelanceSpecialization",
]);

export async function GET() {
  try {
    const p = await db.select().from(profile).where(eq(profile.id, "default")).get();
    return NextResponse.json(p || {});
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(key)) {
        sanitized[key] = value;
      }
    }

    if (Object.keys(sanitized).length === 1) {
      return NextResponse.json({ error: "no valid fields to update" }, { status: 400 });
    }

    await db.update(profile).set(sanitized).where(eq(profile.id, "default"));
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
