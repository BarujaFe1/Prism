import { db } from "@/db";
import { monitoredCompanies } from "@/db/schema";
import { generateId } from "@/lib/utils";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

async function main() {
  const jsonPath = path.join(process.cwd(), "empresas", "prism_empresas_brasileiras_watchlist.json");
  console.log(`Reading watchlist from: ${jsonPath}`);
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: Watchlist JSON file not found at ${jsonPath}`);
    process.exit(1);
  }

  try {
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const watchlist = JSON.parse(rawData);
    
    if (!Array.isArray(watchlist)) {
      console.error("Error: Watchlist is not a valid JSON array.");
      process.exit(1);
    }

    console.log(`Found ${watchlist.length} entries in JSON file.`);

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
        console.warn("Skipping invalid entry without company name.");
        errorCount++;
        continue;
      }

      const normalized = normalizeCompanyName(company);
      if (seenInList.has(normalized)) {
        console.log(`Skipping duplicate company in list: ${company}`);
        ignoredDupCount++;
        continue;
      }
      seenInList.add(normalized);

      try {
        // Check if company exists in DB
        const existing = await db
          .select()
          .from(monitoredCompanies)
          .where(sql`normalized_name = ${normalized}`)
          .get();

        if (existing) {
          // Update existing company properties (preserve user adjustments like careerUrl or notes)
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
            .where(sql`id = ${existing.id}`)
            .run();
          updatedCount++;
        } else {
          // Insert new company
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
            careerUrl: "", // initially empty, detected later
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
      } catch (err: any) {
        console.error(`Error processing company ${company}:`, err.message);
        errorCount++;
      }
    }

    console.log("\nWatchlist Import Summary:");
    console.log(`- New companies imported: ${importedCount}`);
    console.log(`- Existing companies updated: ${updatedCount}`);
    console.log(`- Duplicate entries ignored: ${ignoredDupCount}`);
    console.log(`- Failures/Errors: ${errorCount}`);
    console.log("Import process completed successfully!");

  } catch (err: any) {
    console.error("Critical error running import:", err);
    process.exit(1);
  }
}

main();
