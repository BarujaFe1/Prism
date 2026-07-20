/**
 * Prepare a bundled SQLite demo database for Vercel / read-only deploys.
 *
 * Prefer curated personal radar data when available:
 *   1. If prism.db exists → rebuild curated high/good demo from personal
 *   2. Else if data/demo.db already committed → keep it (Vercel CI)
 *   3. Else → synthetic demo-seed
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "data");
const dbFile = path.join(dataDir, "demo.db");
const personalDb = path.join(root, "prism.db");
const dbUrl = "file:data/demo.db";

function run(command: string, args: string[], env: Record<string, string> = {}) {
  console.log(`> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

fs.mkdirSync(dataDir, { recursive: true });

const forceSynthetic =
  process.env.PRISM_FORCE_SYNTHETIC_DEMO === "1" ||
  process.env.PRISM_FORCE_SYNTHETIC_DEMO === "true";

if (!forceSynthetic && fs.existsSync(personalDb)) {
  console.log("Found prism.db — building curated personal demo for Vercel…");
  run("npx", ["tsx", "scripts/prepare-demo-from-personal.ts"], {
    PRISM_SOURCE_DB: "file:prism.db",
  });
} else if (!forceSynthetic && fs.existsSync(dbFile)) {
  const size = fs.statSync(dbFile).size;
  console.log(`Keeping committed ${dbFile} (${size} bytes)`);
} else {
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
  console.log("Synthetic demo seed…");
  run("npx", ["drizzle-kit", "push", "--force"], { DATABASE_URL: dbUrl });
  run("npx", ["tsx", "scripts/demo-seed.ts", "seed"], {
    DATABASE_URL: dbUrl,
    PRISM_ALLOW_DEMO_SEED: "1",
  });
  run("npx", ["tsx", "scripts/seed-career-foundation.ts"], {
    DATABASE_URL: dbUrl,
    PRISM_ALLOW_DEMO_SEED: "1",
    PRISM_DEMO_MODE: "0",
  });
}

if (!fs.existsSync(dbFile)) {
  console.error("demo:prepare failed — data/demo.db was not created");
  process.exit(1);
}

const size = fs.statSync(dbFile).size;
console.log(`Prepared ${dbFile} (${size} bytes)`);
