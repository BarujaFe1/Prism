import { NextResponse } from "next/server";
import { fetchCompanyJobBoards } from "@/connectors/company-crawler";
import { db } from "@/db";
import { targetCompanies } from "@/db/schema";
import { eq } from "drizzle-orm";

import { generateId } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // If body contains name and domain, insert a new target company
    if (body.name && body.domain) {
      const id = generateId();
      await db.insert(targetCompanies).values({
        id,
        name: body.name,
        domain: body.domain,
        careersUrl: body.careersUrl || null,
        atsType: body.atsType || "greenhouse",
        isActive: body.isActive !== false,
      });
      return NextResponse.json({ ok: true, id });
    }

    // Otherwise, run the crawl job board crawl
    const result = await fetchCompanyJobBoards();
    return NextResponse.json({
      ok: result.errors.length === 0,
      results: { new: result.new, duplicate: result.duplicate, total: result.total },
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const companies = await db
    .select()
    .from(targetCompanies)
    .orderBy(targetCompanies.name)
    .all();

  return NextResponse.json(companies);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db.update(targetCompanies).set(updates).where(eq(targetCompanies.id, id));
  return NextResponse.json({ ok: true });
}
