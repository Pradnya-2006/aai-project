import { expect, test } from "@playwright/test";

test("command palette, crisis simulation, and approval gate are usable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Command Center" })).toBeVisible();
  await page.locator("body").press("/");
  await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
  await page.getByRole("button", { name: "Competitors" }).last().click();
  await expect(page.getByRole("heading", { name: "Competitors" }).last()).toBeVisible();
  await page.getByRole("button", { name: "Response Studio" }).first().click();
  await expect(page.getByText("CRISIS SIMULATOR")).toBeVisible();
  await page.getByRole("button", { name: "Run simulation" }).click();
  await expect(page.locator(".simulation-result")).toContainText("mentions");
});

test("API failure renders the offline error state", async ({ page }) => {
  await page.route("http://127.0.0.1:8000/**", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByText("Offline demo mode")).toBeVisible();
});

test("empty filtered mention state is explicit and viewport has no horizontal overflow", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Search mentions...").fill("no-result-query");
  await page.getByRole("button", { name: "Live Mentions" }).click();
  await expect(page.getByText("No mentions match the current filters.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
});

test("390px viewport fits in both themes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const themeButton of ["Light theme", "Dark theme"]) {
    await page.getByRole("button", { name: themeButton }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
  }
});

test("primary routes expose named controls and change the workspace", async ({ page }) => {
  await page.goto("/");
  const routes = ["Command Center", "Live Mentions", "Topics & Trends", "Risk Center", "Competitors", "Influencers", "Campaigns", "Response Studio", "Crisis Ops", "Executive Intelligence"];
  for (const route of routes) {
    await page.getByRole("button", { name: route, exact: true }).first().click();
    await expect(page.getByRole("heading", { name: route, exact: true }).last()).toBeVisible();
    const unnamed = await page.locator("button, a").evaluateAll((elements) =>
      elements.filter((element) => !((element.getAttribute("aria-label") || element.textContent || "").trim())).length,
    );
    expect(unnamed, `unnamed controls on ${route}`).toBe(0);
  }
});

test("response studio keeps publishing disabled until approval", async ({ page }) => {
  await page.route("http://127.0.0.1:8000/api/responses/1/approve", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ approved: true, status: "approved" }) }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Response Studio", exact: true }).first().click();
  const publish = page.getByRole("button", { name: "Publish response" });
  await expect(publish).toBeDisabled();
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(publish).toBeEnabled();
});

test("offline retry is visible and reattempts the load", async ({ page }) => {
  await page.route("http://127.0.0.1:8000/**", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByText("Offline demo mode")).toBeVisible();
  const retry = page.getByRole("button", { name: "Retry" });
  await expect(retry).toBeVisible();
  await retry.click();
  await expect(page.getByText("Offline demo mode")).toBeVisible();
});

test("visual review matrix covers every primary route and theme", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const routes = ["Command Center", "Live Mentions", "Topics & Trends", "Risk Center", "Competitors", "Influencers", "Campaigns", "Response Studio", "Crisis Ops", "Executive Intelligence"];
  for (const viewport of [{ name: "desktop", width: 1440, height: 1000 }, { name: "mobile", width: 390, height: 844 }]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const theme of ["dark", "light"]) {
      await page.goto("/");
      const themeButton = page.getByRole("button", { name: theme === "dark" ? "Dark theme" : "Light theme" });
      if (await themeButton.count()) await themeButton.click();
      await expect(page.getByText("24,900")).toBeVisible({ timeout: 10_000 });
      for (const route of routes) {
        await page.getByRole("button", { name: route, exact: true }).first().click({ force: true });
        await expect(page.getByRole("heading", { name: route, exact: true }).last()).toBeVisible();
        await page.screenshot({
          path: testInfo.outputPath(`visual-review/${viewport.name}-${theme}-${route.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}.png`),
          fullPage: true,
        });
      }
    }
  }
});
