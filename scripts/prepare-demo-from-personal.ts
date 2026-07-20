/**
 * Build a curated read-only demo DB from personal prism.db for Vercel.
 *
 * Keeps: profile, settings, career tracks, evidences, connector logs (recent),
 * and jobs with fit high/good (+ top partial by score). Truncates huge descriptions.
 *
 *   npm run demo:from-personal
 */
import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const sourceUrl = process.env.PRISM_SOURCE_DB || "file:prism.db";
const outFile = path.join(root, "data", "demo.db");
const outUrl = "file:data/demo.db";
const MAX_DESC = 12_000;
const MAX_PARTIAL = 400;

function run(command: string, args: string[], env: Record<string, string> = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function truncate(s: unknown): string | null {
  if (s == null) return null;
  const t = String(s);
  if (t.length <= MAX_DESC) return t;
  return `${t.slice(0, MAX_DESC)}\n\n…[truncado para demo]`;
}

async function main() {
  const sourcePath = sourceUrl.replace(/^file:/, "");
  if (!fs.existsSync(path.isAbsolute(sourcePath) ? sourcePath : path.join(root, sourcePath))) {
    console.error(`Source DB missing: ${sourceUrl}. Run personal sync first.`);
    process.exit(1);
  }

  fs.mkdirSync(path.join(root, "data"), { recursive: true });
  if (fs.existsSync(outFile)) fs.unlinkSync(outFile);

  console.log("Pushing schema to data/demo.db…");
  run("npx", ["drizzle-kit", "push", "--force"], { DATABASE_URL: outUrl });

  // Ensure career / jobs columns exist on fresh demo
  run("npx", ["tsx", "scripts/patch-career-schema.ts"], {
    DATABASE_URL: outUrl,
    PRISM_DEMO_MODE: "0",
  });
  run("npx", ["tsx", "scripts/patch-jobs-schema.ts"], {
    DATABASE_URL: outUrl,
    PRISM_DEMO_MODE: "0",
  });
  run("npx", ["tsx", "scripts/patch-companies-schema.ts"], {
    DATABASE_URL: outUrl,
    PRISM_DEMO_MODE: "0",
  });

  const src = createClient({ url: sourceUrl });
  const dst = createClient({ url: outUrl });

  // Profile
  const profile = await src.execute("SELECT * FROM profile WHERE id = 'default'");
  for (const row of profile.rows) {
    const cols = Object.keys(row);
    await dst.execute({
      sql: `INSERT OR REPLACE INTO profile (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`,
      args: cols.map((c) => row[c] as string | number | null),
    });
  }
  console.log(`profile: ${profile.rows.length}`);

  // Settings
  try {
    const settings = await src.execute("SELECT * FROM settings");
    for (const row of settings.rows) {
      const cols = Object.keys(row);
      await dst.execute({
        sql: `INSERT OR REPLACE INTO settings (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`,
        args: cols.map((c) => row[c] as string | number | null),
      });
    }
    console.log(`settings: ${settings.rows.length}`);
  } catch (e) {
    console.warn("settings skip", e);
  }

  // Career tracks + evidences
  for (const table of ["career_tracks", "project_evidences"] as const) {
    try {
      const rows = await src.execute(`SELECT * FROM ${table}`);
      for (const row of rows.rows) {
        const cols = Object.keys(row);
        await dst.execute({
          sql: `INSERT OR REPLACE INTO ${table} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`,
          args: cols.map((c) => row[c] as string | number | null),
        });
      }
      console.log(`${table}: ${rows.rows.length}`);
    } catch (e) {
      console.warn(`${table} skip`, e);
    }
  }

  // Jobs: all high/good + top partial
  const highGood = await src.execute(
    `SELECT * FROM jobs WHERE fit_label IN ('high','good') ORDER BY score DESC`
  );
  const partial = await src.execute(
    `SELECT * FROM jobs WHERE fit_label = 'partial' ORDER BY score DESC LIMIT ${MAX_PARTIAL}`
  );
  const jobs = [...highGood.rows, ...partial.rows];
  const jobIds = new Set(jobs.map((j) => String(j.id)));

  const dstColsInfo = await dst.execute("PRAGMA table_info(jobs)");
  const dstJobCols = new Set(dstColsInfo.rows.map((r) => String(r.name)));

  let inserted = 0;
  for (const row of jobs) {
    const cols = Object.keys(row).filter((c) => dstJobCols.has(c));
    const args = cols.map((c) => {
      if (c === "description" || c === "description_clean" || c === "translated_description") {
        return truncate(row[c]);
      }
      if (c === "raw_data") return null; // drop bulky raw payloads
      return row[c] as string | number | null;
    });
    await dst.execute({
      sql: `INSERT OR REPLACE INTO jobs (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`,
      args,
    });
    inserted += 1;
  }
  console.log(`jobs: ${inserted} (high/good=${highGood.rows.length}, partial=${partial.rows.length})`);

  // Recent connector logs
  try {
    const logs = await src.execute(
      `SELECT * FROM connector_logs ORDER BY run_at DESC LIMIT 80`
    );
    const logColsInfo = await dst.execute("PRAGMA table_info(connector_logs)");
    const logCols = new Set(logColsInfo.rows.map((r) => String(r.name)));
    for (const row of logs.rows) {
      const cols = Object.keys(row).filter((c) => logCols.has(c));
      await dst.execute({
        sql: `INSERT OR REPLACE INTO connector_logs (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`,
        args: cols.map((c) => row[c] as string | number | null),
      });
    }
    console.log(`connector_logs: ${logs.rows.length}`);
  } catch (e) {
    console.warn("connector_logs skip", e);
  }

  // Active monitored companies with detected ATS (sample)
  try {
    const cos = await src.execute(
      `SELECT * FROM monitored_companies WHERE detected_ats IS NOT NULL AND detected_ats != 'unknown' LIMIT 80`
    );
    const cosColsInfo = await dst.execute("PRAGMA table_info(monitored_companies)");
    const cosCols = new Set(cosColsInfo.rows.map((r) => String(r.name)));
    for (const row of cos.rows) {
      const cols = Object.keys(row).filter((c) => cosCols.has(c));
      await dst.execute({
        sql: `INSERT OR REPLACE INTO monitored_companies (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`,
        args: cols.map((c) => row[c] as string | number | null),
      });
    }
    console.log(`monitored_companies: ${cos.rows.length}`);
  } catch (e) {
    console.warn("monitored_companies skip", e);
  }

  // Compact
  await dst.execute("VACUUM");

  const size = fs.statSync(outFile).size;
  console.log(`\nWrote ${outFile} (${(size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Job IDs kept: ${jobIds.size}`);
  if (size > 45 * 1024 * 1024) {
    console.warn("Warning: demo.db > 45MB — may hit Vercel serverless bundle limits.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
