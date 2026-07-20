import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure bundled demo SQLite is available to serverless functions on Vercel
  outputFileTracingIncludes: {
    "/*": ["./data/demo.db"],
    "/api/**/*": ["./data/demo.db"],
  },
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
