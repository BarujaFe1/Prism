
const ATS_PATTERNS = [
  { ats: "greenhouse", domains: ["greenhouse.io", "boards.greenhouse.io"] },
  { ats: "lever", domains: ["lever.co", "jobs.lever.co"] },
  { ats: "ashby", domains: ["ashbyhq.com", "jobs.ashbyhq.com"] },
  { ats: "gupy", domains: ["gupy.io"] },
  { ats: "workday", domains: ["workdayjobs.com", "myworkdayjobs.com"] },
  { ats: "smartrecruiters", domains: ["smartrecruiters.com"] },
  { ats: "teamtailor", domains: ["teamtailor.com"] },
  { ats: "recruitee", domains: ["recruitee.com"] },
  { ats: "inhire", domains: ["inhire.io"] },
  { ats: "solides", domains: ["solides.com.br", "kenoby.com"] },
  { ats: "vagas", domains: ["vagas.com.br"] },
  { ats: "successfactors", domains: ["successfactors.com", "successfactors.eu"] },
];

export async function searchDDG(query: string): Promise<string[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return [];
    
    const html = await res.text();
    const hrefRegex = /href="([^"]+)"/g;
    let match;
    const links: string[] = [];
    
    while ((match = hrefRegex.exec(html)) !== null) {
      const href = match[1];
      if (href.includes("uddg=")) {
        const parts = href.split("uddg=");
        if (parts[1]) {
          const rawUrl = parts[1].split("&")[0];
          try {
            const decoded = decodeURIComponent(rawUrl);
            if (decoded.startsWith("http")) {
              links.push(decoded);
            }
          } catch {}
        }
      } else if (href.startsWith("http")) {
        links.push(href);
      }
    }
    return Array.from(new Set(links));
  } catch (err) {
    console.error("DDG search failed for:", query, err);
    return [];
  }
}

export function detectAtsFromUrl(urlStr: string): string | null {
  const url = urlStr.toLowerCase();
  for (const pattern of ATS_PATTERNS) {
    if (pattern.domains.some(domain => url.includes(domain))) {
      return pattern.ats;
    }
  }
  return null;
}

function extractSlugFromUrl(urlStr: string, ats: string): string {
  if (!urlStr) return "";
  try {
    const url = new URL(urlStr);
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname;
    
    if (ats === "gupy") {
      return host.split(".")[0];
    }
    if (ats === "greenhouse") {
      if (host.includes("job-boards.greenhouse.io") || host.includes("boards.greenhouse.io")) {
        const parts = pathname.split("/").filter(Boolean);
        return parts[0] || "";
      }
    }
    if (ats === "lever") {
      const parts = pathname.split("/").filter(Boolean);
      return parts[0] || "";
    }
    if (ats === "ashby") {
      const parts = pathname.split("/").filter(Boolean);
      return parts[0] || "";
    }
  } catch {}
  
  return urlStr.replace(/\/$/, "").split("/").pop() || "";
}

async function verifyAtsBoard(ats: string, slug: string): Promise<boolean> {
  if (!slug || slug.length < 2) return false;
  try {
    let verifyUrl = "";
    if (ats === "gupy") {
      verifyUrl = `https://${slug}.gupy.io/`;
    } else if (ats === "greenhouse") {
      verifyUrl = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`;
    } else if (ats === "lever") {
      verifyUrl = `https://api.lever.co/v0/postings/${slug}?mode=json`;
    } else if (ats === "ashby") {
      verifyUrl = `https://jobs.ashbyhq.com/${slug}/api/job-board`;
    } else {
      return true;
    }

    const res = await fetch(verifyUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(4000)
    });
    
    if (res.status === 200) {
      if (ats === "gupy") {
        const text = await res.text();
        return text.includes("__NEXT_DATA__") && text.includes("careerPage");
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function guessAtsUrl(companyName: string): Promise<{ careerUrl: string; detectedAts: string; status: "active" } | null> {
  const slug = companyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
  
  if (slug.length < 2) return null;

  const candidates = [
    { ats: "gupy", url: `https://${slug}.gupy.io/` },
    { ats: "greenhouse", url: `https://boards.greenhouse.io/${slug}` },
    { ats: "lever", url: `https://jobs.lever.co/${slug}` },
    { ats: "ashby", url: `https://jobs.ashbyhq.com/${slug}` },
  ];

  for (const cand of candidates) {
    const isValid = await verifyAtsBoard(cand.ats, slug);
    if (isValid) {
      return { careerUrl: cand.url, detectedAts: cand.ats, status: "active" };
    }
  }
  return null;
}

export async function detectCompanyAts(company: {
  name: string;
  careerUrl?: string | null;
  atsHint?: string | null;
  searchQueryPt?: string | null;
  searchQueryEn?: string | null;
}): Promise<{ careerUrl: string; detectedAts: string; status: "active" | "needs_review"; error?: string }> {
  
  // 1. Try with provided careerUrl first
  if (company.careerUrl && company.careerUrl.trim() !== "") {
    const url = company.careerUrl.trim();
    const detected = detectAtsFromUrl(url);
    if (detected) {
      const slug = extractSlugFromUrl(url, detected);
      const isValid = await verifyAtsBoard(detected, slug);
      if (isValid) {
        return { careerUrl: url, detectedAts: detected, status: "active" };
      }
    }
    
    // Fetch and check redirections and HTML
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Prism/1.0" },
        signal: AbortSignal.timeout(8000)
      });
      const finalUrl = res.url || url;
      const detectedAfterRedirect = detectAtsFromUrl(finalUrl);
      if (detectedAfterRedirect) {
        const slug = extractSlugFromUrl(finalUrl, detectedAfterRedirect);
        const isValid = await verifyAtsBoard(detectedAfterRedirect, slug);
        if (isValid) {
          return { careerUrl: finalUrl, detectedAts: detectedAfterRedirect, status: "active" };
        }
      }
      
      const html = await res.text();
      // Inspect HTML for JobPosting schema
      if (html.includes('"@type": "JobPosting"') || html.includes("'@type': 'JobPosting'")) {
        return { careerUrl: finalUrl, detectedAts: "custom", status: "active" };
      }
      
      // Look for greenhouse/lever/ashby script markers
      if (html.includes("greenhouse.io") || html.includes("boards.greenhouse")) {
        return { careerUrl: finalUrl, detectedAts: "greenhouse", status: "active" };
      }
      if (html.includes("lever.co")) {
        return { careerUrl: finalUrl, detectedAts: "lever", status: "active" };
      }
      if (html.includes("gupy.io")) {
        return { careerUrl: finalUrl, detectedAts: "gupy", status: "active" };
      }
    } catch (err: any) {
      console.warn(`Fetch failed for careersUrl of ${company.name}: ${err.message}`);
    }
  }

  // 2. Perform search engine discovery
  const query = company.searchQueryPt || `${company.name} carreiras vagas`;
  console.log(`Searching DDG for ${company.name}...`);
  const links = await searchDDG(query);
  
  // Filter links for ATS platforms or official careers
  for (const link of links) {
    const detected = detectAtsFromUrl(link);
    if (detected) {
      const slug = extractSlugFromUrl(link, detected);
      console.log(`Found candidate link for ${company.name}: ${link} (ATS: ${detected}, slug: ${slug})`);
      const isValid = await verifyAtsBoard(detected, slug);
      if (isValid) {
        console.log(`Confirmed VALID ATS link in search for ${company.name}: ${link} (${detected})`);
        return { careerUrl: link, detectedAts: detected, status: "active" };
      } else {
        console.log(`ATS link verification failed: ${link}`);
      }
    }
  }

  // Look for any link that might be the careers page of the company itself
  const normalizedCompanyName = company.name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const potentialOfficialLinks = links.filter(link => {
    const lower = link.toLowerCase();
    return (
      (lower.includes(normalizedCompanyName) || lower.includes(company.name.toLowerCase())) &&
      (lower.includes("carreira") || lower.includes("vaga") || lower.includes("trabalhe") || lower.includes("job") || lower.includes("career"))
    );
  });

  if (potentialOfficialLinks.length > 0) {
    const candidateLink = potentialOfficialLinks[0];
    console.log(`Found potential official link for ${company.name}: ${candidateLink}`);
    
    // Check if we can detect ATS by fetching it
    try {
      const res = await fetch(candidateLink, {
        headers: { "User-Agent": "Prism/1.0" },
        signal: AbortSignal.timeout(8000)
      });
      const finalUrl = res.url || candidateLink;
      const detected = detectAtsFromUrl(finalUrl);
      if (detected) {
        const slug = extractSlugFromUrl(finalUrl, detected);
        const isValid = await verifyAtsBoard(detected, slug);
        if (isValid) {
          return { careerUrl: finalUrl, detectedAts: detected, status: "active" };
        }
      }
      
      const html = await res.text();
      if (html.includes('"@type": "JobPosting"')) {
        return { careerUrl: finalUrl, detectedAts: "custom", status: "active" };
      }
    } catch (err: any) {
      console.warn(`Failed to inspect potential official link: ${err.message}`);
    }
  }

  // 3. Fallback to guessing based on normalized company name
  console.log(`Applying name-based ATS guessing for ${company.name}...`);
  const guessed = await guessAtsUrl(company.name);
  if (guessed) {
    console.log(`Successfully guessed ATS for ${company.name}: ${guessed.careerUrl} (${guessed.detectedAts})`);
    return guessed;
  }

  // Default fallback if nothing detected
  const finalAts = company.atsHint && company.atsHint !== "auto-detect" ? company.atsHint : "unknown";
  return {
    careerUrl: company.careerUrl || "",
    detectedAts: finalAts,
    status: finalAts !== "unknown" ? "active" : "needs_review",
    error: "No ATS platform or JobPosting structured data detected automatically"
  };
}
