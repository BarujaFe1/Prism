import { saveFreelanceBatch, logFreelanceSync } from "../utils";

export async function fetchContra(): Promise<{ new: number; duplicate: number }> {
  const start = Date.now();
  let lastError: string | undefined;

  try {
    const res = await fetch("https://contra.com/api/opportunities?page=1&perPage=1", {
      headers: { "User-Agent": "Prism/1.0 Freelance", "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404) lastError = "Contra API endpoint moved (404). Needs updated URL.";
    else if (!res.ok) lastError = `Contra: ${res.status}`;
  } catch (err: any) {
    lastError = err.message;
  }

  const result = await saveFreelanceBatch([], "Contra");
  await logFreelanceSync("Contra", "contra", result, lastError, Date.now() - start);
  return result;
}
