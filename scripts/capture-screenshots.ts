import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "https://prism-ruddy-sigma.vercel.app";
const outDir = path.join(process.cwd(), "docs", "assets");

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const shots: { file: string; url: string }[] = [
    { file: "prism-radar-desktop.png", url: baseURL },
    { file: "prism-pipeline.png", url: `${baseURL}/pipeline` },
    { file: "prism-analytics.png", url: `${baseURL}/analytics` },
    { file: "prism-sources-health.png", url: `${baseURL}/sources` },
  ];

  for (const shot of shots) {
    await page.goto(shot.url, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, shot.file), fullPage: false });
    console.log("saved", shot.file);
  }

  // job detail if first job link exists
  await page.goto(baseURL, { waitUntil: "networkidle" });
  const jobLink = page.locator('a[href^="/jobs/"]').first();
  if (await jobLink.count()) {
    await jobLink.click();
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(outDir, "prism-job-score.png"),
      fullPage: false,
    });
    console.log("saved prism-job-score.png");
  }

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(baseURL, { waitUntil: "networkidle" });
  await mobile.screenshot({
    path: path.join(outDir, "prism-mobile.png"),
    fullPage: false,
  });
  console.log("saved prism-mobile.png");

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
