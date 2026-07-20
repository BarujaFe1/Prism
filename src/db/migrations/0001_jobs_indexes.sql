-- Optional index migration for existing local DBs.
-- Prefer: npm run db:push after pulling schema changes.
-- Backup first: copy prism.db to backups/prism-YYYYMMDD-HHMMSS.db

CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs (status);
CREATE INDEX IF NOT EXISTS jobs_score_idx ON jobs (score);
CREATE INDEX IF NOT EXISTS jobs_posted_at_idx ON jobs (posted_at);
CREATE INDEX IF NOT EXISTS jobs_source_idx ON jobs (source);
CREATE INDEX IF NOT EXISTS jobs_hash_idx ON jobs (hash);
CREATE UNIQUE INDEX IF NOT EXISTS jobs_source_source_id_uidx ON jobs (source, source_id);
