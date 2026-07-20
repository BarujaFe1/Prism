/**
 * Non-interactive ALTER/CREATE for Career OS foundation tables.
 */
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL || "file:prism.db";
const client = createClient({ url });

const statements = [
  `CREATE TABLE IF NOT EXISTS career_tracks (
    id TEXT PRIMARY KEY NOT NULL,
    key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    priority INTEGER NOT NULL DEFAULT 100,
    weight REAL NOT NULL DEFAULT 1,
    role_titles TEXT DEFAULT '[]',
    core_skills TEXT DEFAULT '[]',
    secondary_skills TEXT DEFAULT '[]',
    headline TEXT,
    resume_url TEXT,
    markets TEXT DEFAULT '[]',
    contracts TEXT DEFAULT '[]',
    negative_keywords TEXT DEFAULT '[]',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (current_timestamp),
    updated_at TEXT NOT NULL DEFAULT (current_timestamp)
  )`,
  `CREATE TABLE IF NOT EXISTS project_evidences (
    id TEXT PRIMARY KEY NOT NULL,
    project_name TEXT NOT NULL,
    project_url TEXT,
    demo_url TEXT,
    description TEXT,
    metrics TEXT,
    metric_kind TEXT DEFAULT 'unknown',
    approved_resume_bullet TEXT,
    confidence TEXT NOT NULL DEFAULT 'medium',
    associated_skills TEXT DEFAULT '[]',
    source_type TEXT DEFAULT 'user_declared',
    source_url TEXT,
    verified_by_user INTEGER DEFAULT 0,
    last_reviewed_at TEXT,
    evidence_level INTEGER DEFAULT 2,
    claims_allowed TEXT DEFAULT '[]',
    claims_forbidden TEXT DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (current_timestamp),
    updated_at TEXT NOT NULL DEFAULT (current_timestamp)
  )`,
  `ALTER TABLE settings ADD COLUMN dont_do_now TEXT`,
  `ALTER TABLE settings ADD COLUMN wip_max_preparing INTEGER DEFAULT 5`,
  `ALTER TABLE settings ADD COLUMN wip_max_learning INTEGER DEFAULT 2`,
  `ALTER TABLE settings ADD COLUMN wip_max_portfolio_projects INTEGER DEFAULT 1`,
];

async function main() {
  for (const sql of statements) {
    try {
      await client.execute(sql);
      console.log("OK:", sql.slice(0, 60).replace(/\s+/g, " "), "…");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/duplicate column|already exists/i.test(msg)) {
        console.log("skip:", sql.slice(0, 40));
      } else {
        console.warn("warn:", msg);
      }
    }
  }
  console.log("Career schema patch complete for", url);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
