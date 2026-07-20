/**
 * Prepare a bundled SQLite demo database for Vercel / read-only deploys.
 * Creates data/demo.db (gitignored) via drizzle push + deterministic seed.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "data");
const dbFile = path.join(dataDir, "demo.db");
const dbUrl = "file:data/demo.db";

fs.mkdirSync(dataDir, { recursive: true });
if (fs.existsSync(dbFile)) {
  fs.unlinkSync(dbFile);
}

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

run("npx", ["drizzle-kit", "push", "--force"], {
  DATABASE_URL: dbUrl,
});

run("npx", ["tsx", "scripts/demo-seed.ts", "seed"], {
  DATABASE_URL: dbUrl,
  PRISM_ALLOW_DEMO_SEED: "1",
});

run("npx", ["tsx", "scripts/seed-career-foundation.ts"], {
  DATABASE_URL: dbUrl,
  PRISM_ALLOW_DEMO_SEED: "1",
  PRISM_DEMO_MODE: "0",
});

if (!fs.existsSync(dbFile)) {
  console.error("demo:prepare failed — data/demo.db was not created");
  process.exit(1);
}

const size = fs.statSync(dbFile).size;
console.log(`Prepared ${dbFile} (${size} bytes)`);
