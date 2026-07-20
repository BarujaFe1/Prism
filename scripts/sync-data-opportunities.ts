/**
 * Sync job sources. Default = reliable connectors only (APIs/RSS).
 *
 *   npm run jobs:sync:data
 *   npm run jobs:sync:data -- --all
 *   npm run jobs:sync:data -- --experimental
 */
import { getConnectors } from "../src/lib/jobs/connector-registry";

async function main() {
  const mode = process.argv.includes("--all")
    ? "all"
    : process.argv.includes("--experimental")
      ? "experimental"
      : "reliable";

  const connectors = getConnectors(mode);
  console.log(`Starting ${mode} sync (${connectors.length} connectors)...`);
  let totalNew = 0;
  let totalDup = 0;
  let totalFetched = 0;

  for (const connector of connectors) {
    try {
      console.log(`\nRunning connector: ${connector.name}...`);
      const result = await connector.fetch();
      console.log(
        ` -> Success: Fetched ${result.total} (New: ${result.new}, Duplicate: ${result.duplicate})`
      );
      totalNew += result.new;
      totalDup += result.duplicate;
      totalFetched += result.total;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(` -> Failed: ${message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  console.log("\n============================================");
  console.log("Sync completed");
  console.log(`- Mode: ${mode}`);
  console.log(`- Connectors: ${connectors.length}`);
  console.log(`- Processed: ${totalFetched}`);
  console.log(`- New: ${totalNew}`);
  console.log(`- Duplicates: ${totalDup}`);
  console.log("============================================");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
