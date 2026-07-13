import { NextResponse } from "next/server";
import { db } from "@/db";
import { freelanceProjects } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const limit = parseInt(searchParams.get("limit") || "50");
  const status = searchParams.get("status");
  const platform = searchParams.get("platform");

  if (id) {
    const project = await db
      .select()
      .from(freelanceProjects)
      .where(eq(freelanceProjects.id, id))
      .get();
    return NextResponse.json({ project: project || null });
  }

  let query = db.select().from(freelanceProjects).orderBy(desc(freelanceProjects.collectedAt));

  const conditions = [];
  if (status) conditions.push(eq(freelanceProjects.status, status));
  if (platform) conditions.push(eq(freelanceProjects.platform, platform));

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const projects = await (query as any).limit(limit).all();
  const total = await db.select({ count: sql<number>`count(*)` }).from(freelanceProjects).get();

  return NextResponse.json({ projects, total: total?.count || 0 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db
    .update(freelanceProjects)
    .set({ ...updates, updatedAt: new Date().toISOString() })
    .where(eq(freelanceProjects.id, id))
    .run();

  return NextResponse.json({ ok: true });
}
