import { fetchCompanyJobBoards } from "@/connectors/company-crawler";

async function main() {
  const arg = process.argv[2]?.toLowerCase();
  
  if (!arg || !["p0", "p1", "p2", "all"].includes(arg)) {
    console.error("Usage: npm run companies:sync:<p0|p1|p2|all>");
    process.exit(1);
  }

  const priorityMap: Record<string, string | undefined> = {
    p0: "P0",
    p1: "P1",
    p2: "P2",
    all: undefined,
  };

  const priority = priorityMap[arg];
  console.log(`Starting company sync for priority: ${priority || "ALL"}`);

  try {
    const result = await fetchCompanyJobBoards(priority ? { priority } : {});
    
    console.log("\n--- Sync Summary ---");
    console.log(`Total jobs fetched: ${result.total}`);
    console.log(`New opportunities: ${result.new}`);
    console.log(`Duplicate opportunities: ${result.duplicate}`);
    
    if (result.errors.length > 0) {
      console.warn(`\nCompleted with ${result.errors.length} errors:`);
      result.errors.forEach((err) => console.error(` - ${err}`));
    } else {
      console.log("\nSync completed successfully with zero errors!");
    }
  } catch (err: any) {
    console.error("Critical error during company sync:", err);
    process.exit(1);
  }
}

main();
