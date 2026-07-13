import { saveFreelanceBatch, logFreelanceSync } from "../utils";

export async function fetchMalt(): Promise<{ new: number; duplicate: number }> {
  const start = Date.now();
  let lastError: string | undefined;

  try {
    const res = await fetch("https://malt.com/en/jobs", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 403) lastError = "Malt behind Cloudflare (403). Needs browser-based approach.";
  } catch (err: any) {
    lastError = err.message;
  }

  const result = await saveFreelanceBatch([], "Malt");
  await logFreelanceSync("Malt", "malt", result, lastError, Date.now() - start);
  return result;
}
