# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: command-center.spec.ts >> response studio keeps publishing disabled until approval
- Location: tests\command-center.spec.ts:52:1

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator:  getByRole('button', { name: 'Publish response' })
Expected: enabled
Received: disabled
Timeout:  5000ms

Call log:
  - Expect "toBeEnabled" getByRole('button', { name: 'Publish response' }) with timeout 5000ms
  - waiting for getByRole('button', { name: 'Publish response' })
    14 × locator resolved to <button disabled class="primary full" title="Approve before publishing">…</button>
       - unexpected value "disabled"

```

```yaml
- button "Publish response" [disabled]
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test("command palette, crisis simulation, and approval gate are usable", async ({ page }) => {
  4  |   await page.goto("/");
  5  |   await expect(page.getByRole("heading", { name: "Command Center" })).toBeVisible();
  6  |   await page.locator("body").press("/");
  7  |   await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
  8  |   await page.getByRole("button", { name: "Competitors" }).last().click();
  9  |   await expect(page.getByRole("heading", { name: "Competitors" }).last()).toBeVisible();
  10 |   await page.getByRole("button", { name: "Response Studio" }).first().click();
  11 |   await expect(page.getByText("CRISIS SIMULATOR")).toBeVisible();
  12 |   await page.getByRole("button", { name: "Run simulation" }).click();
  13 |   await expect(page.locator(".simulation-result")).toContainText("mentions");
  14 | });
  15 | 
  16 | test("API failure renders the offline error state", async ({ page }) => {
  17 |   await page.route("http://127.0.0.1:8000/**", (route) => route.abort());
  18 |   await page.goto("/");
  19 |   await expect(page.getByText("Offline demo mode")).toBeVisible();
  20 | });
  21 | 
  22 | test("empty filtered mention state is explicit and viewport has no horizontal overflow", async ({ page }) => {
  23 |   await page.goto("/");
  24 |   await page.getByPlaceholder("Search mentions...").fill("no-result-query");
  25 |   await page.getByRole("button", { name: "Live Mentions" }).click();
  26 |   await expect(page.getByText("No mentions match the current filters.")).toBeVisible();
  27 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
  28 | });
  29 | 
  30 | test("390px viewport fits in both themes", async ({ page }) => {
  31 |   await page.setViewportSize({ width: 390, height: 844 });
  32 |   await page.goto("/");
  33 |   for (const themeButton of ["Light theme", "Dark theme"]) {
  34 |     await page.getByRole("button", { name: themeButton }).click();
  35 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
  36 |   }
  37 | });
  38 | 
  39 | test("primary routes expose named controls and change the workspace", async ({ page }) => {
  40 |   await page.goto("/");
  41 |   const routes = ["Command Center", "Live Mentions", "Topics & Trends", "Risk Center", "Competitors", "Influencers", "Campaigns", "Response Studio", "Crisis Ops", "Executive Intelligence"];
  42 |   for (const route of routes) {
  43 |     await page.getByRole("button", { name: route, exact: true }).first().click();
  44 |     await expect(page.getByRole("heading", { name: route, exact: true }).last()).toBeVisible();
  45 |     const unnamed = await page.locator("button, a").evaluateAll((elements) =>
  46 |       elements.filter((element) => !((element.getAttribute("aria-label") || element.textContent || "").trim())).length,
  47 |     );
  48 |     expect(unnamed, `unnamed controls on ${route}`).toBe(0);
  49 |   }
  50 | });
  51 | 
  52 | test("response studio keeps publishing disabled until approval", async ({ page }) => {
  53 |   await page.route("http://127.0.0.1:8000/api/responses/1/approve", (route) =>
  54 |     route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ approved: true, status: "approved" }) }),
  55 |   );
  56 |   await page.goto("/");
  57 |   await page.getByRole("button", { name: "Response Studio", exact: true }).first().click();
  58 |   const publish = page.getByRole("button", { name: "Publish response" });
  59 |   await expect(publish).toBeDisabled();
  60 |   await page.getByRole("button", { name: "Approve", exact: true }).click();
> 61 |   await expect(publish).toBeEnabled();
     |                         ^ Error: expect(locator).toBeEnabled() failed
  62 | });
  63 | 
  64 | test("offline retry is visible and reattempts the load", async ({ page }) => {
  65 |   await page.route("http://127.0.0.1:8000/**", (route) => route.abort());
  66 |   await page.goto("/");
  67 |   await expect(page.getByText("Offline demo mode")).toBeVisible();
  68 |   const retry = page.getByRole("button", { name: "Retry" });
  69 |   await expect(retry).toBeVisible();
  70 |   await retry.click();
  71 |   await expect(page.getByText("Offline demo mode")).toBeVisible();
  72 | });
  73 | 
  74 | test("visual review matrix covers every primary route and theme", async ({ page }, testInfo) => {
  75 |   test.setTimeout(120_000);
  76 |   const routes = ["Command Center", "Live Mentions", "Topics & Trends", "Risk Center", "Competitors", "Influencers", "Campaigns", "Response Studio", "Crisis Ops", "Executive Intelligence"];
  77 |   for (const viewport of [{ name: "desktop", width: 1440, height: 1000 }, { name: "mobile", width: 390, height: 844 }]) {
  78 |     await page.setViewportSize({ width: viewport.width, height: viewport.height });
  79 |     for (const theme of ["dark", "light"]) {
  80 |       await page.goto("/");
  81 |       const themeButton = page.getByRole("button", { name: theme === "dark" ? "Dark theme" : "Light theme" });
  82 |       if (await themeButton.count()) await themeButton.click();
  83 |       await page.waitForTimeout(6_000);
  84 |       for (const route of routes) {
  85 |         await page.getByRole("button", { name: route, exact: true }).first().click({ force: true });
  86 |         await expect(page.getByRole("heading", { name: route, exact: true }).last()).toBeVisible();
  87 |         await page.screenshot({
  88 |           path: testInfo.outputPath(`visual-review/${viewport.name}-${theme}-${route.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}.png`),
  89 |           fullPage: true,
  90 |         });
  91 |       }
  92 |     }
  93 |   }
  94 | });
  95 | 
```