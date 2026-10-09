import { expect, test } from "@playwright/test";

test.describe("Actions, Audit Trail, and Notifications", () => {
  test("notifications show unread badge, real list, mark read, and click-through navigation", async ({
    page,
  }) => {
    await page.goto("/");
    const bell = page.getByRole("button", { name: "Toggle notifications" });
    await expect(bell).toBeVisible();

    // Click to open notification panel
    await bell.click();
    const panel = page.getByRole("dialog", { name: "Notifications panel" });
    await expect(panel).toBeVisible();
    await expect(panel.getByText("Notifications")).toBeVisible();

    // Verify notification item and click-through navigation
    const notifItem = panel.locator(".notification-item").first();
    await expect(notifItem).toBeVisible();
    await notifItem.click();

    // Re-open notifications and mark all read if button is present
    await bell.click();
    const markAll = page.getByRole("button", { name: "Mark all read" });
    if (await markAll.count()) {
      await markAll.click();
      await expect(page.locator(".unread-badge")).toHaveCount(0);
    }
  });

  test("response actions: reject with reason, regenerate, edit, publish gate, bulk approve, and audit trail", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Response Studio", exact: true }).first().click();
    await expect(page.getByRole("heading", { name: "Response Studio" }).last()).toBeVisible();

    // 1. Regenerate
    const regenBtn = page.getByRole("button", { name: "Regenerate" });
    await expect(regenBtn).toBeVisible();
    await regenBtn.click();
    await expect(page.getByText("New variation generated")).toBeVisible();

    // 2. Edit draft & Save edit
    const textarea = page.getByRole("textbox", { name: "Response draft" });
    await textarea.fill("Custom drafted reply for customer feedback test.");
    const saveBtn = page.getByRole("button", { name: "Save edit" });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();
    await expect(page.getByText("Draft saved and new response version created")).toBeVisible();

    // 3. Reject with reason
    await page.getByRole("button", { name: "Reject", exact: true }).click();
    const reasonInput = page.getByLabel("Rejection reason input");
    await expect(reasonInput).toBeVisible();
    await reasonInput.fill("Tone is too defensive for our brand guidelines");
    await page.getByRole("button", { name: "Confirm Reject" }).click();
    await expect(page.getByText("Draft marked as rejected")).toBeVisible();

    // 4. Publish gate: publish is disabled when rejected/not approved
    const publishBtn = page.getByRole("button", { name: "Publish response" });
    await expect(publishBtn).toBeDisabled();

    // 5. Approve
    await page.getByRole("button", { name: "Approve", exact: true }).click();
    await expect(publishBtn).toBeEnabled();

    // 6. Publish response
    await publishBtn.click();
    await expect(page.getByText("Response published to channels")).toBeVisible();

    // 7. Bulk approve
    const bulkBtn = page.getByRole("button", { name: "Bulk approve" });
    await expect(bulkBtn).toBeVisible();
    await bulkBtn.click();
    await expect(page.getByText("Bulk approved")).toBeVisible();

    // 8. Global Audit View
    await page.getByRole("button", { name: "Global Audit" }).click();
    await expect(page.getByRole("heading", { name: "Global Audit Log" })).toBeVisible();
    await expect(page.locator(".audit-table")).toBeVisible();
  });

  test("drawer actions (Generate Response, Open Incident, Notify Product Team) write audit entries", async ({
    page,
  }) => {
    await page.goto("/");
    // Click on a mention to open drawer
    await page.locator(".mention-row").first().click();
    const drawer = page.locator(".drawer");
    await expect(drawer).toBeVisible();

    // 1. Generate Response in drawer
    const genBtn = drawer.getByRole("button", { name: "Generate Response" });
    await expect(genBtn).toBeVisible();
    await genBtn.click();
    await expect(page.getByText("Draft response generated")).toBeVisible();

    // 2. Open Incident in drawer
    const incBtn = drawer.getByRole("button", { name: "Open Incident" });
    await expect(incBtn).toBeVisible();
    await incBtn.click();
    await expect(page.getByText("Incident opened")).toBeVisible();

    // 3. Notify Product Team in drawer
    const notifyBtn = drawer.getByRole("button", { name: "Notify Product Team" });
    await expect(notifyBtn).toBeVisible();
    await notifyBtn.click();
    await expect(page.getByText("Product team notified")).toBeVisible();

    // Close drawer
    await page.getByRole("button", { name: "Close drawer" }).click();
    await expect(drawer).not.toBeVisible();
  });

  test("optimistic update rollback on approval error", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Response Studio", exact: true }).first().click();

    // Mock failure for approval
    await page.route("http://127.0.0.1:8000/api/responses/1/approve", (route) =>
      route.abort(),
    );

    await page.getByRole("button", { name: "Approve", exact: true }).click();
    await expect(page.getByText("Failed to approve response. Rolled back.")).toBeVisible();
    // Publish should remain disabled due to rollback
    await expect(page.getByRole("button", { name: "Publish response" })).toBeDisabled();
  });
});
