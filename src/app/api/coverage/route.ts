import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, profile, projectEvidences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiError } from "@/lib/api-guards";
import { buildCoverageHeatmap } from "@/lib/career/evidence-coverage";

export async function GET() {
  try {
    const p = await db.select().from(profile).where(eq(profile.id, "default")).get();
    const evidences = await db.select().from(projectEvidences).all();
    const allJobs = await db.select().from(jobs).all();

    const jobTechCounts: Record<string, number> = {};
    for (const j of allJobs) {
      if (
        !["new", "saved", "preparing", "applied", "reviewing", "testing", "interview"].includes(
          j.status
        )
      ) {
        continue;
      }
      for (const t of j.technologies || []) {
        jobTechCounts[t] = (jobTechCounts[t] || 0) + 1;
      }
    }

    const learningSkills = ((p?.learningBacklog as any[]) || [])
      .filter((t) => t?.status === "todo" && t?.skill)
      .map((t) => String(t.skill));

    // Prefer vault table; fall back to JSON if empty
    const evidenceSource =
      evidences.length > 0
        ? evidences
        : ((p?.skillsEvidence as any[]) || []).map((e) => ({
            associatedSkills: e.associatedSkills,
            confidence: e.confidence,
            projectUrl: e.projectUrl,
            metrics: e.metrics,
            approvedResumeBullet: e.approvedResumeBullet,
          }));

    const heatmap = buildCoverageHeatmap({
      profileSkills: (p?.skills as string[]) || [],
      evidences: evidenceSource,
      learningSkills,
      jobTechCounts,
    });

    return NextResponse.json({
      source: evidences.length > 0 ? "project_evidences" : "profile.skillsEvidence",
      evidenceCount: evidenceSource.length,
      heatmap,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to compute coverage";
    return NextResponse.json(apiError("INTERNAL_ERROR", message), { status: 500 });
  }
}
