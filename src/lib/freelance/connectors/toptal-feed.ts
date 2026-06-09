import { saveFreelanceBatch, logFreelanceSync } from "../utils";

export async function fetchToptal(): Promise<{ new: number; duplicate: number }> {
  const start = Date.now();
  const result = await saveFreelanceBatch([], "Toptal Jobs");
  await logFreelanceSync("Toptal Jobs", "toptal", result, "Toptal behind Cloudflare. Replaced by SimplyHired.", Date.now() - start);
  return result;
}
