import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";

const TAG_QUERIES = [
  "typescript", "python", "nodejs", "nextjs",
  "data-science", "data-engineer", "full-stack", "backend", "frontend",
  "ai", "llm", "machine-learning", "deep-learning", "mlops",
  "analytics", "react", "devops", "engineering",
  "junior", "entry-level", "internship",
];

export async function fetchRemoteOk(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();

  const seen = new Set<string>();
  const allJobs: RawJobData[] = [];

  try {
    const results = await Promise.allSettled(
      TAG_QUERIES.map((tag) =>
        fetch(`https://remoteok.com/api?tag=${encodeURIComponent(tag)}`, {
          headers: { "User-Agent": "Prism/1.0 (job tracker; contact@prism.app)" },
          signal: AbortSignal.timeout(15000),
        }).then(async (res) => {
          if (!res.ok) throw new Error(`tag ${tag}: ${res.status}`);
          const data = await res.json();
          return { tag, data: Array.isArray(data) ? data : [] };
        })
      )
    );

    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      const { data } = result.value;

      for (const item of data) {
        if (!item || !item.position || !item.company) continue;
        if (seen.has(item.id)) continue;
        seen.add(item.id);

        const desc = `${item.description || ""} ${item.additional || ""}`;

        allJobs.push({
          title: item.position,
          company: item.company,
          description: desc,
          location: item.location || "Remote",
          locationType: "remote",
          contractType: "international",
          technologies: (item.tags || []).map((t: string) => capitalize(t)),
          tags: item.tags || [],
          source: "remoteok",
          sourceId: String(item.id),
          url: item.url || `https://remoteok.com/remote-jobs/${item.slug}`,
          companyUrl: item.company_url || undefined,
          postedAt: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
        });
      }
    }

    const result = await saveJobs(allJobs, "Remote OK");
    await logConnectorRun("Remote OK", result, undefined, Date.now() - start);
    return result;
  } catch (err: any) {
    await logConnectorRun("Remote OK", { new: 0, duplicate: 0, total: 0 }, err.message, Date.now() - start);
    return { new: 0, duplicate: 0, total: 0 };
  }
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
