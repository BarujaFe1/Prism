import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { drizzle } from "drizzle-orm/libsql";
import { createClient, type Client } from "@libsql/client";
import * as schema from "./schema";

/**
 * Resolve DB URL for local, Turso, or Vercel read-only demo.
 * On Vercel without DATABASE_URL, copy bundled `data/demo.db` into /tmp (writable).
 */
function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const onVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";
  const useBundled =
    onVercel ||
    process.env.PRISM_USE_BUNDLED_DEMO === "1" ||
    process.env.PRISM_USE_BUNDLED_DEMO === "true";

  if (useBundled) {
    const bundled = path.join(process.cwd(), "data", "demo.db");
    if (!fs.existsSync(bundled)) {
      throw new Error(
        "[prism] Bundled data/demo.db missing. Run `npm run demo:prepare` before build/deploy."
      );
    }
    const tmp = path.join(os.tmpdir(), "prism-demo.db");
    try {
      // Refresh copy so new deploys pick up a fresh seeded DB
      fs.copyFileSync(bundled, tmp);
    } catch (err) {
      console.error("[prism] Failed to copy bundled demo DB to /tmp", err);
      throw err;
    }
    return `file:${tmp}`;
  }

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[prism] DATABASE_URL is not set; falling back to file:prism.db. Set DATABASE_URL or ship data/demo.db for Vercel demo."
    );
  }

  return "file:prism.db";
}

const url = resolveDatabaseUrl();
const authToken = process.env.DATABASE_AUTH_TOKEN;

const client: Client = createClient(authToken ? { url, authToken } : { url });

export const db = drizzle(client, { schema });
export const databaseUrlUsed = url.replace(/\/\/.*@/, "//***@");
