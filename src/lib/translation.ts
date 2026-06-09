const MAX_CHARS = 4500;

export async function translateText(text: string, targetLang = "pt"): Promise<string | null> {
  if (!text || text.trim().length === 0) return null;

  try {
    const trimmed = text.slice(0, MAX_CHARS);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || !data[0]) return null;

    const translated = data[0]
      .filter((part: unknown): part is [string] => Array.isArray(part) && typeof part[0] === "string")
      .map((part: [string]) => part[0])
      .join("");

    return translated || null;
  } catch {
    return null;
  }
}
