import { db } from "@/db";
import { targetCompanies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";

const COMPANIES = [
  // Brazilian tech (Greenhouse)
  { name: "Nubank", domain: "nubank.com.br", slug: "nubank", ats: "greenhouse" },
  { name: "Mercado Livre", domain: "mercadolivre.com", slug: "mercadolibre", ats: "greenhouse" },
  { name: "iFood", domain: "ifood.com.br", slug: "ifood", ats: "greenhouse" },
  { name: "QuintoAndar", domain: "quintoandar.com.br", slug: "quintoandar", ats: "greenhouse" },
  { name: "Creditas", domain: "creditas.com", slug: "creditas", ats: "greenhouse" },
  { name: "Loft", domain: "loft.com.br", slug: "loft", ats: "greenhouse" },
  { name: "Hotmart", domain: "hotmart.com", slug: "hotmart", ats: "greenhouse" },
  { name: "PicPay", domain: "picpay.com", slug: "picpay", ats: "greenhouse" },
  { name: "Conta Simples", domain: "contasimples.com.br", slug: "contasimples", ats: "greenhouse" },
  { name: "CloudWalk", domain: "cloudwalk.io", slug: "cloudwalk", ats: "greenhouse" },
  { name: "Cora", domain: "cora.com.br", slug: "cora", ats: "greenhouse" },
  { name: "Pismo", domain: "pismo.io", slug: "pismo", ats: "greenhouse" },
  { name: "Neon", domain: "neon.com.br", slug: "neon", ats: "greenhouse" },
  { name: "C6 Bank", domain: "c6bank.com.br", slug: "c6bank", ats: "greenhouse" },
  { name: "Inter", domain: "bancointer.com.br", slug: "bancointer", ats: "greenhouse" },
  { name: "BTG Pactual", domain: "btgpactual.com", slug: "btgpactual", ats: "greenhouse" },
  { name: "Vtex", domain: "vtex.com", slug: "vtex", ats: "greenhouse" },
  { name: "Gympass", domain: "gympass.com", slug: "gympass", ats: "greenhouse" },
  { name: "Unico", domain: "unico.io", slug: "unico", ats: "greenhouse" },
  { name: "Ebanx", domain: "ebanx.com", slug: "ebanx", ats: "greenhouse" },

  // International (Lever)
  { name: "Stripe", domain: "stripe.com", slug: "stripe", ats: "lever" },
  { name: "Linear", domain: "linear.app", slug: "linear", ats: "lever" },
  { name: "Notion", domain: "notion.so", slug: "notion", ats: "lever" },
  { name: "Anthropic", domain: "anthropic.com", slug: "anthropic", ats: "lever" },
  { name: "OpenAI", domain: "openai.com", slug: "openai", ats: "lever" },
  { name: "Hugging Face", domain: "huggingface.co", slug: "huggingface", ats: "lever" },
  { name: "Replicate", domain: "replicate.com", slug: "replicate", ats: "lever" },
  { name: "Modal", domain: "modal.com", slug: "modal", ats: "lever" },
  { name: "Cursor", domain: "cursor.sh", slug: "cursor", ats: "lever" },
  { name: "Zapier", domain: "zapier.com", slug: "zapier", ats: "lever" },
  { name: "Retool", domain: "retool.com", slug: "retool", ats: "lever" },
  { name: "Airbyte", domain: "airbyte.com", slug: "airbyte", ats: "lever" },
  { name: "Prefect", domain: "prefect.io", slug: "prefect", ats: "lever" },
  { name: "Dagster", domain: "dagster.io", slug: "dagsterlabs", ats: "lever" },

  // Ashby
  { name: "Vercel", domain: "vercel.com", slug: "vercel", ats: "ashby" },
  { name: "Supabase", domain: "supabase.com", slug: "supabase", ats: "ashby" },
  { name: "PlanetScale", domain: "planetscale.com", slug: "planetscale", ats: "ashby" },
  { name: "Raycast", domain: "raycast.com", slug: "raycast", ats: "ashby" },
  { name: "Cal.com", domain: "cal.com", slug: "calcom", ats: "ashby" },
  { name: "Codepen", domain: "codepen.io", slug: "codepen", ats: "ashby" },
  { name: "Figma", domain: "figma.com", slug: "figma", ats: "ashby" },
  { name: "Railway", domain: "railway.com", slug: "railway", ats: "ashby" },
];

async function main() {
  console.log("Seeding target_companies...");
  let count = 0;

  for (const c of COMPANIES) {
    const existing = await db
      .select({ id: targetCompanies.id })
      .from(targetCompanies)
      .where(eq(targetCompanies.domain, c.domain))
      .get();

    if (existing) {
      console.log(`  Skipping ${c.name} (already exists)`);
      continue;
    }

    await db.insert(targetCompanies).values({
      id: generateId(),
      name: c.name,
      domain: c.domain,
      careersUrl: `https://${c.domain}/jobs`,
      atsType: c.ats as any,
      keywords: [],
      isActive: true,
    });

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
