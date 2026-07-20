import { createClient } from "@libsql/client";

const c = createClient({ url: process.env.DATABASE_URL || "file:prism.db" });

const DDL = [
  `CREATE TABLE IF NOT EXISTS monitored_companies (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    sector TEXT,
    priority TEXT,
    country_focus TEXT,
    target_roles TEXT,
    why_monitor TEXT,
    search_query_pt TEXT,
    search_query_en TEXT,
    ats_hint TEXT,
    career_url TEXT,
    detected_ats TEXT,
    status TEXT DEFAULT 'never_synced' NOT NULL,
    last_sync_attempt_at TEXT,
    last_successful_sync_at TEXT,
    last_error TEXT,
    total_jobs_found INTEGER DEFAULT 0,
    total_relevant_jobs INTEGER DEFAULT 0,
    total_saved_jobs INTEGER DEFAULT 0,
    total_applied_jobs INTEGER DEFAULT 0,
    usefulness_rate REAL DEFAULT 0,
    created_at TEXT DEFAULT (current_timestamp) NOT NULL,
    updated_at TEXT DEFAULT (current_timestamp) NOT NULL,
    is_active INTEGER DEFAULT 1,
    notes TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS job_sources (
    id TEXT PRIMARY KEY NOT NULL,
    job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    source_name TEXT NOT NULL,
    source_url TEXT,
    discovered_at TEXT DEFAULT (current_timestamp) NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_monitored_companies_normalized ON monitored_companies(normalized_name)`,
  `CREATE INDEX IF NOT EXISTS idx_monitored_companies_priority ON monitored_companies(priority)`,
];

async function main() {
  for (const sql of DDL) {
    await c.execute(sql);
    console.log("OK:", sql.slice(0, 60), "…");
  }
  const r = await c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log("tables:", r.rows.map((x) => x.name).join(", "));
  const j = await c.execute("SELECT count(*) as c FROM jobs");
  console.log("jobs:", j.rows[0]?.c);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
