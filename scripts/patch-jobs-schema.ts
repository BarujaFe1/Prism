import { createClient } from "@libsql/client";

const c = createClient({ url: process.env.DATABASE_URL || "file:prism.db" });

const JOB_COLS = [
  "applied_at TEXT",
  "checklist_json TEXT",
  "tailored_resume TEXT",
  "cv_version_used TEXT",
  "portfolio_link_used TEXT",
  "rejection_reason TEXT",
];

async function ensureColumns(table: string, defs: string[]) {
  const info = await c.execute(`PRAGMA table_info(${table})`);
  const existing = new Set(info.rows.map((r) => String(r.name)));
  for (const def of defs) {
    const name = def.split(" ")[0];
    if (existing.has(name)) {
      console.log(`skip: ${table}.${name}`);
      continue;
    }
    await c.execute(`ALTER TABLE ${table} ADD COLUMN ${def}`);
    console.log(`added: ${table}.${name}`);
  }
}

async function fixJobSources() {
  const info = await c.execute("PRAGMA table_info(job_sources)");
  const cols = info.rows.map((r) => String(r.name));
  console.log("job_sources cols:", cols.join(", "));

  // If incomplete stub table, recreate
  if (!cols.includes("source_type") || !cols.includes("apply_url")) {
    console.log("Recreating job_sources with full schema…");
    await c.execute("DROP TABLE IF EXISTS job_sources");
    await c.execute(`CREATE TABLE job_sources (
      id TEXT PRIMARY KEY NOT NULL,
      job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      source_name TEXT NOT NULL,
      source_type TEXT NOT NULL,
      original_url TEXT,
      apply_url TEXT NOT NULL,
      first_seen_at TEXT DEFAULT (current_timestamp) NOT NULL,
      last_seen_at TEXT DEFAULT (current_timestamp) NOT NULL,
      confidence REAL DEFAULT 1,
      is_preferred_apply_source INTEGER DEFAULT 0
    )`);
    console.log("job_sources recreated");
  }
}

async function main() {
  await ensureColumns("jobs", JOB_COLS);
  await fixJobSources();
  console.log("schema patch done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
