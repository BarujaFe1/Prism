const COUNTRY_MAP: Record<string, { name: string; code: string }> = {
  us: { name: "United States", code: "US" },
  usa: { name: "United States", code: "US" },
  uk: { name: "United Kingdom", code: "GB" },
  gb: { name: "United Kingdom", code: "GB" },
  brasil: { name: "Brasil", code: "BR" },
  brazil: { name: "Brasil", code: "BR" },
  canada: { name: "Canada", code: "CA" },
  germany: { name: "Germany", code: "DE" },
  alemanha: { name: "Germany", code: "DE" },
  france: { name: "France", code: "FR" },
  frança: { name: "France", code: "FR" },
  spain: { name: "Spain", code: "ES" },
  espanha: { name: "Spain", code: "ES" },
  portugal: { name: "Portugal", code: "PT" },
  australia: { name: "Australia", code: "AU" },
  japan: { name: "Japan", code: "JP" },
  japão: { name: "Japan", code: "JP" },
  india: { name: "India", code: "IN" },
  china: { name: "China", code: "CN" },
  netherlands: { name: "Netherlands", code: "NL" },
  holland: { name: "Netherlands", code: "NL" },
  holanda: { name: "Netherlands", code: "NL" },
  singapore: { name: "Singapore", code: "SG" },
  switzerland: { name: "Switzerland", code: "CH" },
  suíça: { name: "Switzerland", code: "CH" },
  ireland: { name: "Ireland", code: "IE" },
  irlanda: { name: "Ireland", code: "IE" },
  italy: { name: "Italy", code: "IT" },
  itália: { name: "Italy", code: "IT" },
  "new zealand": { name: "New Zealand", code: "NZ" },
  sweden: { name: "Sweden", code: "SE" },
  suécia: { name: "Sweden", code: "SE" },
  denmark: { name: "Denmark", code: "DK" },
  dinamarca: { name: "Denmark", code: "DK" },
  norway: { name: "Norway", code: "NO" },
  noruega: { name: "Norway", code: "NO" },
  poland: { name: "Poland", code: "PL" },
  polônia: { name: "Poland", code: "PL" },
  argentina: { name: "Argentina", code: "AR" },
  mexico: { name: "Mexico", code: "MX" },
  méxico: { name: "Mexico", code: "MX" },
  colombia: { name: "Colombia", code: "CO" },
  chile: { name: "Chile", code: "CL" },
  uruguay: { name: "Uruguay", code: "UY" },
  europe: { name: "Europe", code: "EU" },
};

const STATE_CODES_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

export interface ParsedLocation {
  city: string | null;
  country: string | null;
  countryCode: string | null;
  isInternational?: boolean;
}

export function parseLocation(location: string | null | undefined): ParsedLocation {
  if (!location) return { city: null, country: null, countryCode: null };

  const loc = location.trim();
  const lower = loc.toLowerCase();

  if (lower.includes("worldwide") || lower.includes("global") || lower === "anywhere" || lower === "remote - worldwide") {
    return { city: null, country: null, countryCode: null, isInternational: true };
  }

  const parts = loc.split(/[,;/-]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { city: null, country: null, countryCode: null };

  let city: string | null = null;
  let country: string | null = null;
  let countryCode: string | null = null;

  const lastPart = parts[parts.length - 1].toLowerCase();
  const firstPart = parts[0];

  if (COUNTRY_MAP[lastPart]) {
    country = COUNTRY_MAP[lastPart].name;
    countryCode = COUNTRY_MAP[lastPart].code;
    city = parts.length > 1 ? parts.slice(0, -1).join(", ") : null;
  } else if (lastPart.length === 2 && STATE_CODES_BR.includes(lastPart.toUpperCase())) {
    country = "Brasil";
    countryCode = "BR";
    city = firstPart;
  } else if (lower.includes("remoto") || lower.includes("remote")) {
    const rest = lower.replace(/remote|remoto|[-–—]/g, "").trim();
    if (rest.length > 0 && COUNTRY_MAP[rest]) {
      country = COUNTRY_MAP[rest].name;
      countryCode = COUNTRY_MAP[rest].code;
    } else {
      country = null;
      countryCode = null;
      city = null;
    }
  } else {
    const countryMatch = parts.find((p) => COUNTRY_MAP[p.toLowerCase()]);
    if (countryMatch) {
      const cm = COUNTRY_MAP[countryMatch.toLowerCase()];
      country = cm.name;
      countryCode = cm.code;
      city = parts.filter((p) => p.toLowerCase() !== countryMatch.toLowerCase()).join(", ") || null;
    } else {
      city = firstPart || null;
    }
  }

  if (city) {
    city = city.replace(/^remote\s*[-–—]\s*/i, "").trim() || null;
  }

  return { city, country, countryCode };
}

export function countryCodeToFlag(countryCode: string | null | undefined): string {
  if (!countryCode || countryCode.length !== 2) return "";
  const code = countryCode.toUpperCase();
  return String.fromCodePoint(
    ...code.split("").map((c) => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}

export function detectLanguage(text: string | null | undefined): string {
  if (!text) return "pt";
  const t = text.toLowerCase();

  const englishIndicators = [
    "we are looking for", "we are seeking", "we're looking for",
    "about the role", "about you", "requirements", "responsibilities",
    "qualifications", "benefits", "what you'll do", "what we offer",
    "apply now", "submit your application", "equal opportunity",
    "the ideal candidate", "we offer", "you will", "we are",
    "our team", "this role", "location: remote",
  ];

  const portugueseIndicators = [
    "sobre a vaga", "sobre a oportunidade", "sobre nós",
    "requisitos", "responsabilidades", "benefícios",
    "o que você precisa", "o que esperamos", "o que oferecemos",
    "venha fazer parte", "candidate-se", "inscreva-se",
    "buscamos", "procuramos", "estamos contratando",
    "se você é", "se você tem", "você será responsável",
    "pré-requisitos", "diferenciais", "salário compatível",
    "contratação imediata", "envie seu currículo",
    "nossa empresa", "somos uma", "temos orgulho",
  ];

  let enScore = 0;
  let ptScore = 0;

  for (const w of englishIndicators) {
    if (t.includes(w)) enScore += 2;
  }
  for (const w of portugueseIndicators) {
    if (t.includes(w)) ptScore += 2;
  }

  const enWords = ["the", "and", "for", "are", "you", "your", "with", "will", "have", "our", "this", "that", "from", "work", "experience", "team", "role", "skills"];
  const ptWords = ["de", "da", "do", "em", "para", "com", "uma", "nos", "sua", "seu", "nossa", "nosso", "essa", "esse", "vaga", "nosso", "sobre", "entre", "como", "mais", "das", "dos", "nas", "nos", "pela", "pelo"];

  const words = t.split(/\s+/).filter((w) => w.length > 2);
  for (const w of words) {
    if (enWords.includes(w)) enScore += 1;
    if (ptWords.includes(w)) ptScore += 1;
  }

  if (ptScore > enScore) return "pt";
  if (enScore > ptScore) return "en";
  return "pt";
}
