import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/api-guards";
import { databaseUrlUsed, db } from "@/db";
import { jobs } from "@/db/schema";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  try {
    const count = await db.select({ count: sql<number>`count(*)` }).from(jobs).get();
    return NextResponse.json({
      ok: true,
      version: process.env.npm_package_version || "0.3.0",
      demoMode: isDemoMode(),
      vercel: process.env.VERCEL === "1",
      database: databaseUrlUsed.includes("tmp")
        ? "bundled-demo(/tmp)"
        : databaseUrlUsed.startsWith("libsql")
          ? "libsql-remote"
          : "file-local",
      jobs: count?.count ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "health check failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
