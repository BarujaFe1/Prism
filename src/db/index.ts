import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const url = process.env.DATABASE_URL || "file:prism.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  console.warn(
    "[prism] DATABASE_URL is not set; falling back to file:prism.db. Set DATABASE_URL for production/demo."
  );
}

const client = createClient(authToken ? { url, authToken } : { url });

export const db = drizzle(client, { schema });
