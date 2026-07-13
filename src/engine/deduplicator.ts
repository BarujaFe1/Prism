interface DedupCandidate {
  id: string;
  title: string;
  company: string;
  location: string | null;
  source: string;
  sourceId: string | null;
  url: string | null;
  description: string | null;
  score: number;
}

function normalizeForComparison(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/).filter(Boolean));
  const setB = new Set(b.split(/\s+/).filter(Boolean));
  if (setA.size === 0 && setB.size === 0) return 1;
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

export function findDuplicates(
  candidates: DedupCandidate[],
  threshold = 0.7
): { groupId: string; keep: DedupCandidate; duplicates: DedupCandidate[] }[] {
  const groups: { groupId: string; keep: DedupCandidate; duplicates: DedupCandidate[] }[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < candidates.length; i++) {
    if (processed.has(candidates[i].id)) continue;

    const primary = candidates[i];
    const duplicates: DedupCandidate[] = [];

    for (let j = i + 1; j < candidates.length; j++) {
      if (processed.has(candidates[j].id)) continue;
      const secondary = candidates[j];

      if (isDuplicate(primary, secondary, threshold)) {
        duplicates.push(secondary);
        processed.add(secondary.id);
      }
    }

    if (duplicates.length > 0) {
      const all = [primary, ...duplicates];
      const best = all.reduce((a, b) => (b.score > a.score ? b : a));
      const rest = all.filter((c) => c.id !== best.id);
      groups.push({
        groupId: primary.id,
        keep: best,
        duplicates: rest,
      });
    }

    processed.add(primary.id);
  }

  return groups;
}

function isDuplicate(a: DedupCandidate, b: DedupCandidate, threshold: number): boolean {
  if (a.source === b.source && a.sourceId && b.sourceId && a.sourceId === b.sourceId) {
    return true;
  }

  if (a.url && b.url && a.url === b.url) {
    return true;
  }

  const titleA = normalizeForComparison(a.title);
  const titleB = normalizeForComparison(b.title);
  const companyA = normalizeForComparison(a.company);
  const companyB = normalizeForComparison(b.company);

  const titleSimilarity = jaccardSimilarity(titleA, titleB);
  const companyMatch = companyA === companyB;
  const locationMatch =
    normalizeForComparison(a.location || "") === normalizeForComparison(b.location || "");

  if (titleSimilarity >= threshold && companyMatch && locationMatch) {
    return true;
  }

  if (titleSimilarity >= 0.8 && companyMatch) {
    return true;
  }

  if (a.description && b.description) {
    const descA = normalizeForComparison(a.description.slice(0, 500));
    const descB = normalizeForComparison(b.description.slice(0, 500));
    const descSim = jaccardSimilarity(descA, descB);
    if (descSim >= 0.6) return true;
  }

  return false;
}

export function dedupTitle(title: string): string {
  const stopWords = [
    "analista", "analyst", "desenvolvedor", "developer", "engineer", "engenheiro",
    "de", "do", "da", "dos", "das", "em", "para", "com", "pleno", "senior",
    "sênior", "junior", "júnior", "trainee", "estágio", "intern", "internship",
  ];

  return title
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => !stopWords.includes(w))
    .sort()
    .join(" ");
}
