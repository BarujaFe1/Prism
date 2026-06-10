import { db } from "@/db";
import { monitoredCompanies } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { generateId } from "@/lib/utils";

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

const COMPANIES = [
  // Brazilian tech (Greenhouse)
  { name: "Nubank", slug: "nubank", ats: "greenhouse" },
  { name: "Mercado Livre", slug: "mercadolibre", ats: "greenhouse" },
  { name: "iFood", slug: "ifood", ats: "greenhouse" },
  { name: "QuintoAndar", slug: "quintoandar", ats: "greenhouse" },
  { name: "Creditas", slug: "creditas", ats: "greenhouse" },
  { name: "Loft", slug: "loft", ats: "greenhouse" },
  { name: "Hotmart", slug: "hotmart", ats: "greenhouse" },
  { name: "PicPay", slug: "picpay", ats: "greenhouse" },
  { name: "Conta Simples", slug: "contasimples", ats: "greenhouse" },
  { name: "CloudWalk", slug: "cloudwalk", ats: "greenhouse" },
  { name: "Cora", slug: "cora", ats: "greenhouse" },
  { name: "Pismo", slug: "pismo", ats: "greenhouse" },
  { name: "Neon", slug: "neon", ats: "greenhouse" },
  { name: "C6 Bank", slug: "c6bank", ats: "greenhouse" },
  { name: "Inter", slug: "bancointer", ats: "greenhouse" },
  { name: "BTG Pactual", slug: "btgpactual", ats: "greenhouse" },
  { name: "Vtex", slug: "vtex", ats: "greenhouse" },
  { name: "Gympass", slug: "gympass", ats: "greenhouse" },
  { name: "Unico", slug: "unico", ats: "greenhouse" },
  { name: "Ebanx", slug: "ebanx", ats: "greenhouse" },

  // International (Lever)
  { name: "Stripe", slug: "stripe", ats: "lever" },
  { name: "Linear", slug: "linear", ats: "lever" },
  { name: "Notion", slug: "notion", ats: "lever" },
  { name: "Anthropic", slug: "anthropic", ats: "lever" },
  { name: "OpenAI", slug: "openai", ats: "lever" },
  { name: "Hugging Face", slug: "huggingface", ats: "lever" },
  { name: "Replicate", slug: "replicate", ats: "lever" },
  { name: "Modal", slug: "modal", ats: "lever" },
  { name: "Cursor", slug: "cursor", ats: "lever" },
  { name: "Zapier", slug: "zapier", ats: "lever" },
  { name: "Retool", slug: "retool", ats: "lever" },
  { name: "Airbyte", slug: "airbyte", ats: "lever" },
  { name: "Prefect", slug: "prefect", ats: "lever" },
  { name: "Dagster", slug: "dagsterlabs", ats: "lever" },

  // Ashby
  { name: "Vercel", slug: "vercel", ats: "ashby" },
  { name: "Supabase", slug: "supabase", ats: "ashby" },
  { name: "PlanetScale", slug: "planetscale", ats: "ashby" },
  { name: "Raycast", slug: "raycast", ats: "ashby" },
  { name: "Cal.com", slug: "calcom", ats: "ashby" },
  { name: "Codepen", slug: "codepen", ats: "ashby" },
  { name: "Figma", slug: "figma", ats: "ashby" },
  { name: "Railway", slug: "railway", ats: "ashby" },
];

async function main() {
  console.log("Seeding monitored_companies...");
  let count = 0;

  for (const c of COMPANIES) {
    const normalized = normalizeCompanyName(c.name);
    const existing = await db
      .select({ id: monitoredCompanies.id })
      .from(monitoredCompanies)
      .where(eq(monitoredCompanies.normalizedName, normalized))
      .get();

    if (existing) {
      console.log(`  Skipping ${c.name} (already exists)`);
      continue;
    }

    const careerUrl = c.ats === "greenhouse"
      ? `https://boards.greenhouse.io/${c.slug}`
      : c.ats === "lever"
      ? `https://jobs.lever.co/${c.slug}`
      : `https://jobs.ashbyhq.com/${c.slug}`;

    await db.insert(monitoredCompanies).values({
      id: generateId(),
      name: c.name,
      normalizedName: normalized,
      sector: c.ats === "greenhouse" ? "Fintech, bancos, crédito e pagamentos" : "Software, SaaS, dados e consultorias brasileiras",
      priority: "P1",
      countryFocus: "Brasil",
      targetRoles: "Dados",
      whyMonitor: "Seed monitorada inicial",
      careerUrl,
      detectedAts: c.ats,
      atsHint: c.ats,
      status: "never_synced",
      totalJobsFound: 0,
      totalRelevantJobs: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).run();

    count++;
    console.log(`  Added ${c.name}`);
  }

  console.log(`\nDone. Added ${count} companies.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
