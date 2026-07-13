import { NextResponse } from "next/server";
import { db } from "@/db";
import { freelanceProjects } from "@/db/schema";
import { sql, gte } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skill = searchParams.get("skill");
  const platform = searchParams.get("platform");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let conditions = sql`hourly_rate_min IS NOT NULL AND posted_at >= ${thirtyDaysAgo}`;
  if (platform) conditions = sql`${conditions} AND platform = ${platform}`;

  const rows = await db
    .select({
      skill: freelanceProjects.skills,
      platform: freelanceProjects.platform,
      rateMin: freelanceProjects.hourlyRateMin,
      rateMax: freelanceProjects.hourlyRateMax,
    })
    .from(freelanceProjects)
    .where(sql`hourly_rate_min IS NOT NULL`)
    .all();

  const bySkill: Record<string, number[]> = {};

  for (const row of rows) {
    if (!row.skill) continue;
    const skills: string[] = JSON.parse(row.skill);
    const minRate = row.rateMin ?? row.rateMax;
    if (!minRate) continue;

    for (const s of skills) {
      if (skill && s.toLowerCase() !== skill.toLowerCase()) continue;
      if (!bySkill[s]) bySkill[s] = [];
      bySkill[s].push(minRate);
    }
  }

  const result = Object.entries(bySkill).map(([name, rates]) => {
    const sorted = rates.sort((a, b) => a - b);
    const n = sorted.length;
    return {
      skill: name,
      sampleSize: n,
      p25: n > 0 ? sorted[Math.floor(n * 0.25)] : null,
      p50: n > 0 ? sorted[Math.floor(n * 0.5)] : null,
      p75: n > 0 ? sorted[Math.floor(n * 0.75)] : null,
      min: n > 0 ? sorted[0] : null,
      max: n > 0 ? sorted[n - 1] : null,
    };
  });

  const byPlatform: Record<string, any[]> = {};
  for (const row of rows) {
    if (!byPlatform[row.platform]) byPlatform[row.platform] = [];
    const minRate = row.rateMin ?? row.rateMax;
    if (minRate) byPlatform[row.platform].push(minRate);
  }

  const platformStats = Object.entries(byPlatform).map(([name, rates]) => {
    const sorted = rates.sort((a, b) => a - b);
    const n = sorted.length;
    return {
      platform: name,
      sampleSize: n,
      p50: n > 0 ? sorted[Math.floor(n * 0.5)] : null,
    };
  });

  return NextResponse.json({
    bySkill: result.sort((a, b) => b.sampleSize - a.sampleSize),
    byPlatform: platformStats.sort((a, b) => b.sampleSize - a.sampleSize),
    lastUpdated: new Date().toISOString(),
  });
}
