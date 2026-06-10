import { NextResponse } from "next/server";
import { fetchCompanyJobBoards } from "@/connectors/company-crawler";
import { db } from "@/db";
import { monitoredCompanies } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { generateId } from "@/lib/utils";

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // 1. Single or Batch Company ATS Detection
    if (body.action === "detect") {
      const { detectCompanyAts } = await import("@/lib/jobs/company-source-detector");

      if (body.companyId) {
        const company = await db
          .select()
          .from(monitoredCompanies)
          .where(eq(monitoredCompanies.id, body.companyId))
          .get();

        if (!company) {
          return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }

        const result = await detectCompanyAts(company);

        await db
          .update(monitoredCompanies)
          .set({
            careerUrl: result.careerUrl || company.careerUrl,
            detectedAts: result.detectedAts,
            status: result.status,
            lastError: result.error || null,
            lastSyncAttemptAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(monitoredCompanies.id, company.id))
          .run();

        return NextResponse.json({ ok: true, result });
      } else {
        // Batch detect up to 15 companies
        const companies = await db
          .select()
          .from(monitoredCompanies)
          .where(eq(monitoredCompanies.detectedAts, "unknown"))
          .all();

        const batch = companies.slice(0, 15);
        let detectedCount = 0;

        for (const company of batch) {
          try {
            const result = await detectCompanyAts(company);
            await db
              .update(monitoredCompanies)
              .set({
                careerUrl: result.careerUrl || company.careerUrl,
                detectedAts: result.detectedAts,
                status: result.status,
                lastError: result.error || null,
                lastSyncAttemptAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
              .where(eq(monitoredCompanies.id, company.id))
              .run();

            if (result.detectedAts !== "unknown") detectedCount++;
            // Pause slightly
            await new Promise(r => setTimeout(r, 1000));
          } catch {}
        }

        return NextResponse.json({ ok: true, detected: detectedCount, scanned: batch.length });
      }
    }

    // 2. Company Sync (Single, Filtered, or All)
    if (body.action === "sync") {
      if (body.companyId) {
        const company = await db
          .select()
          .from(monitoredCompanies)
          .where(eq(monitoredCompanies.id, body.companyId))
          .get();

        if (!company) {
          return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }

        const { crawlCompany, updateCompanyStats } = await import("@/connectors/company-crawler");
        const result = await crawlCompany(company);

        await db.update(monitoredCompanies)
          .set({ 
            lastSyncAttemptAt: new Date().toISOString(), 
            lastSuccessfulSyncAt: new Date().toISOString(),
            lastError: null,
            status: "active"
          })
          .where(eq(monitoredCompanies.id, company.id))
          .run();

        await updateCompanyStats(company.id, company.name);

        return NextResponse.json({ ok: true, result });
      } else {
        const filters: any = {};
        if (body.priority) filters.priority = body.priority;
        if (body.sector) filters.sector = body.sector;

        const result = await fetchCompanyJobBoards(filters);
        return NextResponse.json({
          ok: result.errors.length === 0,
          results: { new: result.new, duplicate: result.duplicate, total: result.total },
          errors: result.errors.length > 0 ? result.errors : undefined,
        });
      }
    }

    // 3. Import Watchlist Action
    if (body.action === "import-watchlist") {
      const fs = await import("fs");
      const path = await import("path");
      const jsonPath = path.join(process.cwd(), "empresas", "prism_empresas_brasileiras_watchlist.json");
      
      if (!fs.existsSync(jsonPath)) {
        return NextResponse.json({ error: "Watchlist file not found locally" }, { status: 404 });
      }
      
      const rawData = fs.readFileSync(jsonPath, "utf-8");
      const watchlist = JSON.parse(rawData);
      
      if (!Array.isArray(watchlist)) {
        return NextResponse.json({ error: "Watchlist format is invalid" }, { status: 400 });
      }

      let importedCount = 0;
      let updatedCount = 0;
      let ignoredDupCount = 0;
      let errorCount = 0;
      const seenInList = new Set<string>();

      for (const entry of watchlist) {
        const {
          company,
          sector,
          priority,
          country_focus,
          target_roles,
          why_monitor,
          search_query_pt,
          search_query_en,
          ats_hint,
        } = entry;

        if (!company) {
          errorCount++;
          continue;
        }

        const normalized = normalizeCompanyName(company);
        if (seenInList.has(normalized)) {
          ignoredDupCount++;
          continue;
        }
        seenInList.add(normalized);

        try {
          const existing = await db
            .select()
            .from(monitoredCompanies)
            .where(eq(monitoredCompanies.normalizedName, normalized))
            .get();

          if (existing) {
            await db
              .update(monitoredCompanies)
              .set({
                sector: sector || existing.sector,
                priority: priority || existing.priority,
                countryFocus: country_focus || existing.countryFocus,
                targetRoles: target_roles || existing.targetRoles,
                whyMonitor: why_monitor || existing.whyMonitor,
                searchQueryPt: search_query_pt || existing.searchQueryPt,
                searchQueryEn: search_query_en || existing.searchQueryEn,
                atsHint: ats_hint || existing.atsHint,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(monitoredCompanies.id, existing.id))
              .run();
            updatedCount++;
          } else {
            const newId = generateId();
            await db.insert(monitoredCompanies).values({
              id: newId,
              name: company,
              normalizedName: normalized,
              sector: sector || "Desconhecido",
              priority: priority || "P2",
              countryFocus: country_focus || "Brasil",
              targetRoles: target_roles || "Dados",
              whyMonitor: why_monitor || "",
              searchQueryPt: search_query_pt || "",
              searchQueryEn: search_query_en || "",
              atsHint: ats_hint || "auto-detect",
              careerUrl: "",
              detectedAts: "unknown",
              status: "never_synced",
              totalJobsFound: 0,
              totalRelevantJobs: 0,
              totalSavedJobs: 0,
              totalAppliedJobs: 0,
              usefulnessRate: 0.0,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }).run();
            importedCount++;
          }
        } catch (err) {
          errorCount++;
        }
      }

      return NextResponse.json({
        ok: true,
        summary: {
          imported: importedCount,
          updated: updatedCount,
          duplicates: ignoredDupCount,
          errors: errorCount,
        }
      });
    }

    // 4. Manual Add Monitored Company
    if (body.name && !body.companyId) {
      const id = generateId();
      const normalized = normalizeCompanyName(body.name);
      
      await db.insert(monitoredCompanies).values({
        id,
        name: body.name,
        normalizedName: normalized,
        careerUrl: body.careersUrl || "",
        detectedAts: body.atsType || "unknown",
        atsHint: body.atsType || "auto-detect",
        isActive: body.isActive !== false,
        priority: body.priority || "P1",
        sector: body.sector || "Software, SaaS, dados e consultorias brasileiras",
        countryFocus: body.countryFocus || "Brasil",
        targetRoles: body.targetRoles || "Dados",
        status: "active",
        totalJobsFound: 0,
        totalRelevantJobs: 0,
        totalSavedJobs: 0,
        totalAppliedJobs: 0,
        usefulnessRate: 0.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).run();

      return NextResponse.json({ ok: true, id });
    }

    // 5. Fallback: Run crawler for all active companies
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
    .from(monitoredCompanies)
    .orderBy(monitoredCompanies.name)
    .all();

  return NextResponse.json(companies);
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const updatedData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.name !== undefined) {
      updatedData.name = updates.name;
      updatedData.normalizedName = normalizeCompanyName(updates.name);
    }
    if (updates.careersUrl !== undefined) updatedData.careerUrl = updates.careersUrl;
    if (updates.atsType !== undefined) {
      updatedData.detectedAts = updates.atsType;
      updatedData.atsHint = updates.atsType;
    }
    if (updates.isActive !== undefined) updatedData.isActive = updates.isActive;
    if (updates.priority !== undefined) updatedData.priority = updates.priority;
    if (updates.sector !== undefined) updatedData.sector = updates.sector;
    if (updates.notes !== undefined) updatedData.notes = updates.notes;

    await db
      .update(monitoredCompanies)
      .set(updatedData)
      .where(eq(monitoredCompanies.id, id))
      .run();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
