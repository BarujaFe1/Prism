/**
 * Ensure career_tracks + project_evidences exist and are seeded.
 * Safe to re-run. Dual-writes evidences into profile.skillsEvidence.
 *
 *   npx tsx scripts/seed-career-foundation.ts
 */
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { careerTracks, projectEvidences, profile } from "../src/db/schema";
import { DEFAULT_CAREER_TRACKS } from "../src/lib/career/default-tracks";
import { PERSONAL_EVIDENCES } from "../src/lib/profile/personal-profile";
import { toSkillsEvidenceJson } from "../src/lib/career/evidence-coverage";
import { isDemoMode } from "../src/lib/api-guards";

function metricKindFor(id: string): string {
  if (id.includes("maestro") || id.includes("lanca")) return "operational";
  if (id.includes("dataflow") || id.includes("opsledger") || id.includes("signal")) return "demo";
  return "unknown";
}

function evidenceLevelFor(confidence: string, metricKind: string): number {
  if (metricKind === "operational" && confidence === "high") return 4;
  if (confidence === "high") return 3;
  if (confidence === "medium") return 2;
  return 1;
}

async function seedTracks() {
  const now = new Date().toISOString();
  for (const t of DEFAULT_CAREER_TRACKS) {
    const existing = await db.select().from(careerTracks).where(eq(careerTracks.id, t.id)).get();
    const row = {
      id: t.id,
      key: t.key,
      label: t.label,
      active: t.active,
      priority: t.priority,
      weight: t.weight,
      roleTitles: t.roleTitles,
      coreSkills: t.coreSkills,
      secondarySkills: t.secondarySkills,
      headline: t.headline,
      resumeUrl: t.resumeUrl,
      markets: t.markets,
      contracts: t.contracts,
      negativeKeywords: t.negativeKeywords,
      notes: t.notes,
      updatedAt: now,
    };
    if (existing) {
      await db.update(careerTracks).set(row).where(eq(careerTracks.id, t.id));
    } else {
      await db.insert(careerTracks).values({ ...row, createdAt: now });
    }
  }
  console.log(`Tracks: ${DEFAULT_CAREER_TRACKS.length}`);
}

async function seedEvidencesFromPersonal() {
  const now = new Date().toISOString();
  for (const ev of PERSONAL_EVIDENCES) {
    const metricKind = metricKindFor(ev.id);
    const row = {
      id: ev.id,
      projectName: ev.projectName,
      projectUrl: ev.projectUrl,
      demoUrl: null as string | null,
      description: ev.description,
      metrics: ev.metrics,
      metricKind,
      approvedResumeBullet: ev.approvedResumeBullet,
      confidence: ev.confidence,
      associatedSkills: ev.associatedSkills,
      sourceType: "public_source",
      sourceUrl: ev.projectUrl,
      verifiedByUser: true,
      lastReviewedAt: now,
      evidenceLevel: evidenceLevelFor(ev.confidence, metricKind),
      claimsAllowed: ev.approvedResumeBullet ? [ev.approvedResumeBullet] : [],
      claimsForbidden: [
        "Não afirmar escala de produção sem métrica de usuários.",
        "Não chamar métricas de demo de impacto em produção.",
      ],
      updatedAt: now,
    };
    const existing = await db.select().from(projectEvidences).where(eq(projectEvidences.id, ev.id)).get();
    if (existing) {
      await db.update(projectEvidences).set(row).where(eq(projectEvidences.id, ev.id));
    } else {
      await db.insert(projectEvidences).values({ ...row, createdAt: now });
    }
  }

  const all = await db.select().from(projectEvidences);
  const json = toSkillsEvidenceJson(all);
  const p = await db.select().from(profile).where(eq(profile.id, "default")).get();
  if (p) {
    await db
      .update(profile)
      .set({ skillsEvidence: json as any, updatedAt: now })
      .where(eq(profile.id, "default"));
  }
  console.log(`Evidences: ${all.length} (dual-write profile.skillsEvidence)`);
}

async function migrateJsonEvidencesIfEmpty() {
  const count = await db.select().from(projectEvidences);
  if (count.length > 0) return;
  const p = await db.select().from(profile).where(eq(profile.id, "default")).get();
  const raw = (p?.skillsEvidence || []) as any[];
  if (!Array.isArray(raw) || raw.length === 0) return;
  const now = new Date().toISOString();
  for (const ev of raw) {
    if (!ev?.id || !ev?.projectName) continue;
    await db.insert(projectEvidences).values({
      id: String(ev.id),
      projectName: String(ev.projectName),
      projectUrl: ev.projectUrl ?? null,
      description: ev.description ?? null,
      metrics: ev.metrics ?? null,
      metricKind: "unknown",
      approvedResumeBullet: ev.approvedResumeBullet ?? null,
      confidence: ev.confidence || "medium",
      associatedSkills: ev.associatedSkills || [],
      sourceType: "user_declared",
      verifiedByUser: false,
      evidenceLevel: 2,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`Migrated ${raw.length} evidences from profile JSON`);
}

async function main() {
  if (isDemoMode() && process.env.PRISM_ALLOW_DEMO_SEED !== "1") {
    console.warn("Warning: PRISM_DEMO_MODE is on — seeding foundation tables anyway for local demo rebuilds.");
  }
  await seedTracks();
  await migrateJsonEvidencesIfEmpty();
  await seedEvidencesFromPersonal();
  console.log("Career foundation seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
