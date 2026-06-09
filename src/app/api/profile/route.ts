import { NextResponse } from "next/server";
import { db } from "@/db";
import { profile } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const p = await db.select().from(profile).where(eq(profile.id, "default")).get();
  return NextResponse.json(p || {});
}

export async function PATCH(request: Request) {
  const body = await request.json();
  await db.update(profile).set(body).where(eq(profile.id, "default"));
  return NextResponse.json({ ok: true });
}
