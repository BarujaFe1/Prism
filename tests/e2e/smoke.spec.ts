import { test, expect } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

test.describe("Prism critical flows", () => {
  test("health reports demo readiness on hosted demo", async ({ request }) => {
    test.skip(!process.env.PLAYWRIGHT_BASE_URL, "Set PLAYWRIGHT_BASE_URL for hosted smoke");
    const res = await request.get(`${baseURL}/api/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBeTruthy();
    expect(body.jobs).toBeGreaterThan(0);
  });

  test("demo mode blocks mutations", async ({ request }) => {
    test.skip(!process.env.PLAYWRIGHT_BASE_URL, "Set PLAYWRIGHT_BASE_URL for hosted smoke");
    const res = await request.patch(`${baseURL}/api/profile`, {
      data: { name: "should-fail" },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error?.code).toBe("DEMO_READ_ONLY");
  });

  test("radar loads and shows opportunities", async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_BASE_URL, "Set PLAYWRIGHT_BASE_URL for UI smoke");
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await expect(page.getByRole("status")).toContainText(/Demo somente leitura/i);
    // Radar / list content — soft assertion on body text presence
    await expect(page.locator("body")).toContainText(/Prism|Radar|oportun|vaga/i);
  });

  test("pipeline and analytics navigate", async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_BASE_URL, "Set PLAYWRIGHT_BASE_URL for UI smoke");
    await page.goto(`${baseURL}/pipeline`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).not.toBeEmpty();
    await page.goto(`${baseURL}/analytics`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).not.toBeEmpty();
  });
});
