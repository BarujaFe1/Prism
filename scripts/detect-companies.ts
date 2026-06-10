import { db } from "@/db";
import { monitoredCompanies } from "@/db/schema";
import { detectCompanyAts } from "@/lib/jobs/company-source-detector";
import { eq, sql } from "drizzle-orm";

async function main() {
  console.log("Starting company ATS detection runner...");
  
  // Find all companies where detectedAts is 'unknown'
  const companies = await db
    .select()
    .from(monitoredCompanies)
    .where(eq(monitoredCompanies.detectedAts, "unknown"))
    .all();

  console.log(`Found ${companies.length} companies to scan.`);

  let successCount = 0;
  let failCount = 0;

  // Scan only P0/P1 first, limit to first 30 to not trigger blocks, or run all with delay?
  // Let's run first 40 entries to check if it's working and avoid DDG blocking.
  const limit = 40;
  const targetScan = companies.slice(0, limit);
  console.log(`Scanning up to ${targetScan.length} companies in this batch to prevent search engine blocks.`);

  for (const company of targetScan) {
    console.log(`\n--------------------------------------------`);
    console.log(`Processing: ${company.name} (Priority: ${company.priority})`);
    
    try {
      const result = await detectCompanyAts(company);
      
      console.log(`Result for ${company.name}:`);
      console.log(`- Career URL: ${result.careerUrl}`);
      console.log(`- Detected ATS: ${result.detectedAts}`);
      console.log(`- Status: ${result.status}`);
      if (result.error) console.log(`- Warning/Error: ${result.error}`);

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
        
      if (result.detectedAts !== "unknown") {
        successCount++;
      } else {
        failCount++;
      }
    } catch (err: any) {
      console.error(`Fatal error detecting ${company.name}:`, err.message);
      failCount++;
      await db
        .update(monitoredCompanies)
        .set({
          status: "needs_review",
          lastError: err.message,
          lastSyncAttemptAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(monitoredCompanies.id, company.id))
        .run();
    }

    // Delay 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log(`\n============================================`);
  console.log("ATS Detection Summary:");
  console.log(`- Scanned: ${targetScan.length}`);
  console.log(`- Successfully detected: ${successCount}`);
  console.log(`- Unknown/Failed detection: ${failCount}`);
  console.log("Run completed!");
}

main();
