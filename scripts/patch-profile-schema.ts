/**
 * Non-interactive schema patch for local SQLite when drizzle-kit push needs a TTY.
 */
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL || "file:prism.db";
const client = createClient({ url });

const alters = [
  `ALTER TABLE profile ADD COLUMN skills_evidence TEXT`,
  `ALTER TABLE profile ADD COLUMN learning_backlog TEXT`,
  `ALTER TABLE profile ADD COLUMN application_plans TEXT`,
  `ALTER TABLE profile ADD COLUMN freelance_min_hourly_rate REAL`,
  `ALTER TABLE profile ADD COLUMN freelance_preferred_currency TEXT DEFAULT 'USD'`,
  `ALTER TABLE profile ADD COLUMN freelance_available_hours_per_week INTEGER`,
  `ALTER TABLE profile ADD COLUMN freelance_open_to_fixed_price INTEGER DEFAULT 1`,
  `ALTER TABLE profile ADD COLUMN freelance_min_fixed_project_value REAL`,
  `ALTER TABLE profile ADD COLUMN freelance_experience_years INTEGER`,
  `ALTER TABLE profile ADD COLUMN freelance_portfolio_url TEXT`,
  `ALTER TABLE profile ADD COLUMN freelance_specialization TEXT`,
];

async function main() {
  for (const sql of alters) {
    try {
      await client.execute(sql);
      console.log("OK:", sql);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/duplicate column|already exists/i.test(msg)) {
        console.log("skip:", sql);
      } else {
        console.warn("warn:", sql, msg);
      }
    }
  }
  console.log("Schema patch complete for", url);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
