import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Node APIs available for SQLite/libSQL connectors and cron scheduler.
  serverExternalPackages: ["@libsql/client", "node-cron"],
};

export default nextConfig;
