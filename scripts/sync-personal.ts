/**
 * Personal sync: reliable connectors + optional BR company P0 crawl.
 *
 *   npm run jobs:sync:personal
 *   npm run jobs:sync:personal -- --with-companies
 *   npm run jobs:sync:personal -- --experimental
 *
 * Requires PRISM_DEMO_MODE=0 and DATABASE_URL=file:prism.db (or your personal DB).
 */
import { spawnSync } from "node:child_process";
import { getConnectors } from "../src/lib/jobs/connector-registry";
import { isDemoMode } from "../src/lib/api-guards";

async function main() {
  if (isDemoMode()) {
    throw new Error("Refuse sync while PRISM_DEMO_MODE is on. Set PRISM_DEMO_MODE=0 for personal use.");
  }

  const withCompanies = process.argv.includes("--with-companies");
  const experimental = process.argv.includes("--experimental");
  const mode = experimental ? "all" : "reliable";
  const connectors = getConnectors(mode);

  console.log(`Personal sync (${mode}) — ${connectors.length} connectors`);
  let totalNew = 0;
  let totalDup = 0;
  let totalFetched = 0;

  for (const connector of connectors) {
    try {
      console.log(`\n→ ${connector.name}…`);
      const result = await connector.fetch();
      console.log(`  new=${result.new} dup=${result.duplicate} total=${result.total}`);
      totalNew += result.new;
      totalDup += result.duplicate;
      totalFetched += result.total;
    } catch (err: unknown) {
      console.error(`  FAIL: ${err instanceof Error ? err.message : err}`);
    }
    await new Promise((r) => setTimeout(r, 800));
  }

  if (withCompanies) {
    console.log("\n→ Company watchlist P0…");
    const r = spawnSync("npx", ["tsx", "scripts/sync-companies.ts", "p0"], {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: { ...process.env, PRISM_DEMO_MODE: "0" },
    });
    if (r.status !== 0) console.warn("Company P0 sync exited", r.status);
  }

  console.log("\n→ Rescore…");
  spawnSync("npx", ["tsx", "src/db/compute-scores.ts"], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, PRISM_DEMO_MODE: "0" },
  });

  console.log("\n============================================");
  console.log("Personal sync done");
  console.log(`Connectors: ${connectors.length}`);
  console.log(`Processed: ${totalFetched} · New: ${totalNew} · Dup: ${totalDup}`);
  console.log("============================================");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
