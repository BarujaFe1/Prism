import type { RawJobData } from "@/types";
import { saveJobs, logConnectorRun } from "./utils";

const HN_ALGOLIA = "https://hn.algolia.com/api/v1/search?query=Ask+HN+Who+is+hiring&tags=ask_hn&hitsPerPage=1";
const HN_ITEM = "https://hacker-news.firebaseio.com/v0/item";

export async function fetchHackerNews(): Promise<{ new: number; duplicate: number; total: number }> {
  const start = Date.now();

  try {
    const searchRes = await fetch(HN_ALGOLIA, {
      headers: { "User-Agent": "Prism/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!searchRes.ok) throw new Error(`HN Algolia: ${searchRes.status}`);
    const searchData = await searchRes.json();
    const threadId = searchData?.hits?.[0]?.objectID;
    if (!threadId) throw new Error("No HN hiring thread found");

    const threadRes = await fetch(`${HN_ITEM}/${threadId}.json`, {
      headers: { "User-Agent": "Prism/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!threadRes.ok) throw new Error(`HN thread: ${threadRes.status}`);
    const thread = await threadRes.json();
    const kids = thread?.kids || [];
    if (kids.length === 0) throw new Error("No comments in thread");

    const commentPromises = kids.slice(0, 100).map((id: number) =>
      fetch(`${HN_ITEM}/${id}.json`, {
        headers: { "User-Agent": "Prism/1.0" },
        signal: AbortSignal.timeout(10000),
      }).then((r) => r.json())
    );

    const comments = await Promise.allSettled(commentPromises);
    const allJobs: RawJobData[] = [];

    for (const result of comments) {
      if (result.status !== "fulfilled") continue;
      const comment = result.value;
      if (!comment?.text) continue;

      const text = comment.text.replace(/<[^>]*>/g, "").trim();
      const lines = text.split("\n").filter(Boolean);

      let company = "";
      let location = "Remote";
      let url = "";

      const firstLine = lines[0] || "";

      const pipeMatch = firstLine.match(/^(.+?)\s*\|/);
      if (pipeMatch) {
        company = pipeMatch[1].trim();
      } else {
        const companyMatch = text.match(/([A-Z][A-Za-z0-9\s.]+?)\s*(?:is hiring|is looking|hiring|seeking)/i);
        if (companyMatch) company = companyMatch[1].trim();
      }

      const locMatch = text.match(/(?:Location|Local|Office|Based)\s*:\s*(.+?)(?:\n|$)/i);
      if (locMatch) location = locMatch[1].trim();

      const urlMatch = text.match(/https?:\/\/[^\s\n)]+/);
      if (urlMatch) url = urlMatch[0];

      const title = firstLine.replace(/^\|.*$/, "").replace(/^(.+?)\s*\|/, "").trim() || company;
      const lower = `${title} ${text}`.toLowerCase();

      if (!company) continue;

      allJobs.push({
        title: title || `${company} position`,
        company,
        description: text.slice(0, 3000),
        location,
        locationType: lower.includes("onsite") || lower.includes("presencial") ? "onsite" : lower.includes("hybrid") ? "hybrid" : "remote",
        contractType: "international",
        technologies: extractHNtech(title, text),
        source: "hackernews",
        sourceId: String(comment.id),
        url: url || `https://news.ycombinator.com/item?id=${comment.id}`,
        postedAt: new Date(comment.time * 1000).toISOString(),
      });
    }

    const result = await saveJobs(allJobs, "HackerNews");
    await logConnectorRun("HackerNews", result, undefined, Date.now() - start);
    return result;
  } catch (err: any) {
    await logConnectorRun("HackerNews", { new: 0, duplicate: 0, total: 0 }, err.message, Date.now() - start);
    return { new: 0, duplicate: 0, total: 0 };
  }
}

function extractHNtech(title: string, desc: string): string[] {
  const techs = ["Python", "TypeScript", "JavaScript", "React", "Node.js", "Next.js", "SQL", "PostgreSQL", "Docker", "AWS", "Machine Learning", "Data Science", "Pandas", "FastAPI", "Django", "Rust", "Go", "Kubernetes", "TensorFlow", "PyTorch", "GraphQL", "API", "Full-Stack", "LLM", "AI", "GPT", "RAG", "LangChain"];
  const text = `${title} ${desc}`.toLowerCase();
  return techs.filter((t) => text.includes(t.toLowerCase()));
}
