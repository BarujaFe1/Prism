import { db } from "./index";
import { seed } from "./seed";

async function main() {
  await seed();
  process.exit(0);
}

main().catch((e) => {
  console.error("Migration/seed failed:", e);
  process.exit(1);
});
