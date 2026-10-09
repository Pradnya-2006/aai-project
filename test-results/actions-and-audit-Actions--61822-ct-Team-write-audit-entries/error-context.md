# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: actions-and-audit.spec.ts >> Actions, Audit Trail, and Notifications >> drawer actions (Generate Response, Open Incident, Notify Product Team) write audit entries
- Location: tests\actions-and-audit.spec.ts:84:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Draft response generated')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Draft response generated') with timeout 5000ms
  - waiting for getByText('Draft response generated')

```

```yaml
- complementary:
  - text: A
  - strong: ACME / AI
  - text: BRAND INTELLIGENCE
  - button "Collapse sidebar"
  - navigation "Primary navigation":
    - button "Command Center"
    - button "Live Mentions"
    - button "Topics & Trends"
    - button "Risk Center"
    - button "Competitors"
    - button "Influencers"
    - button "Campaigns"
    - button "Response Studio": Response Studio 3
    - button "Crisis Ops"
    - button "Executive Intelligence"
  - button "Light theme"
  - button "Toggle demo mode": "Data mode: Live"
- main:
  - text: WORKSPACE / ACME
  - heading "Command Center" [level=1]
  - combobox "Time range":
    - option "24H" [selected]
    - option "7D"
    - option "30D"
  - combobox "Platform filter":
    - option "All platforms" [selected]
    - option "X"
    - option "Reddit"
    - option "Instagram"
  - textbox "Search mentions":
    - /placeholder: Search mentions...
  - text: ⌘K
  - button "Toggle presentation mode"
  - button "Toggle notifications": "2"
  - text: ● LIVE GLOBAL FILTERS
  - button "All sentiment"
  - button "positive"
  - button "neutral"
  - button "negative"
  - text: 3 visible signals ·
  - button "Refresh"
  - text: WEDNESDAY · 24 HOUR WINDOW
  - heading "Good afternoon, Alex." [level=2]
  - paragraph: Your brand is being discussed across the public web.
  - button "Run AI Analysis"
  - article: Brand health 0/100 computed from current data
  - article: Total mentions 0 computed from current data
  - article: Negative sentiment 0% computed from current data
  - article: Current risk 0/100 computed from current data
  - article:
    - heading "Mention activity" [level=3]
    - button "Volume and negative sentiment from current API data."
    - text: mentions negative
    - application: 4h 6h 8h 10h 12h 14h 16h 18h 20h 22h 24h
    - text: ● elevated ◆ prediction ▲ critical
  - article:
    - heading "What is happening?" [level=3]
    - button "Highest-volume active issue cluster."
    - text: ISSUE CLUSTER
    - heading "No active risk" [level=3]
    - paragraph: 0% negative · 0% growth · z-score 0
    - text: RECOMMENDED ACTION
    - strong: Continue monitoring.
  - article:
    - heading "Agent pipeline" [level=3]
    - button "Click an agent to inspect measured output."
    - text: ready
    - button "1 Collect"
    - button "2 Classify"
    - button "3 Sentiment"
    - button "4 Influence"
    - button "5 Trend"
    - button "6 Risk"
    - button "7 Recommend"
    - button "8 Approve"
    - strong: Master Orchestrator
    - text: Awaiting signal run
  - article:
    - heading "Trending topics" [level=3]
    - button "Ranked by current mention volume."
    - button "Inspect"
  - article:
    - heading "Top-impact conversations" [level=3]
    - button "Impact score is computed by the influence formula."
    - button "Maya Chen X · App Update Failure · frustrated The latest app update keeps logging me out. Please fix this. 42 impact":
      - strong: Maya Chen
      - text: X · App Update Failure · frustrated
      - paragraph: The latest app update keeps logging me out. Please fix this.
      - text: 42 impact
    - button "Jordan Lee Reddit · Customer Support · happy Support got back to me quickly and solved my issue. 35 impact":
      - strong: Jordan Lee
      - text: Reddit · Customer Support · happy
      - paragraph: Support got back to me quickly and solved my issue.
      - text: 35 impact
    - button "Priya Shah Instagram · New UI · confused The new dashboard is clean, but export is confusing. 20 impact":
      - strong: Priya Shah
      - text: Instagram · New UI · confused
      - paragraph: The new dashboard is clean, but export is confusing.
      - text: 20 impact
  - article:
    - heading "Live activity" [level=3]
    - button "Newest classified signals."
    - button "View all"
    - button "Maya Chen X · App Update Failure · frustrated The latest app update keeps logging me out. Please fix this. 42 impact":
      - strong: Maya Chen
      - text: X · App Update Failure · frustrated
      - paragraph: The latest app update keeps logging me out. Please fix this.
      - text: 42 impact
    - button "Jordan Lee Reddit · Customer Support · happy Support got back to me quickly and solved my issue. 35 impact":
      - strong: Jordan Lee
      - text: Reddit · Customer Support · happy
      - paragraph: Support got back to me quickly and solved my issue.
      - text: 35 impact
    - button "Priya Shah Instagram · New UI · confused The new dashboard is clean, but export is confusing. 20 impact":
      - strong: Priya Shah
      - text: Instagram · New UI · confused
      - paragraph: The new dashboard is clean, but export is confusing.
      - text: 20 impact
- complementary:
  - text: MENTION DETAIL
  - button "Close drawer"
  - heading "Maya Chen" [level=2]
  - paragraph: The latest app update keeps logging me out. Please fix this.
  - text: Classification
  - strong: bug report
  - text: Emotion
  - strong: frustrated
  - text: Topic
  - strong: App Update Failure
  - text: Impact
  - strong: "42.0"
  - text: Intensity
  - strong: "0.80"
  - text: AI RECOMMENDATION
  - strong: Escalate to the response team and prepare a governed reply.
  - button "Generating..." [disabled]
  - button "Open Incident"
  - button "Notify Product Team"
- region "Notifications alt+T"
```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test";
  2   | 
  3   | test.describe("Actions, Audit Trail, and Notifications", () => {
  4   |   test("notifications show unread badge, real list, mark read, and click-through navigation", async ({
  5   |     page,
  6   |   }) => {
  7   |     await page.goto("/");
  8   |     const bell = page.getByRole("button", { name: "Toggle notifications" });
  9   |     await expect(bell).toBeVisible();
  10  | 
  11  |     // Click to open notification panel
  12  |     await bell.click();
  13  |     const panel = page.getByRole("dialog", { name: "Notifications panel" });
  14  |     await expect(panel).toBeVisible();
  15  |     await expect(panel.getByText("Notifications")).toBeVisible();
  16  | 
  17  |     // Verify notification item and click-through navigation
  18  |     const notifItem = panel.locator(".notification-item").first();
  19  |     await expect(notifItem).toBeVisible();
  20  |     await notifItem.click();
  21  | 
  22  |     // Re-open notifications and mark all read if button is present
  23  |     await bell.click();
  24  |     const markAll = page.getByRole("button", { name: "Mark all read" });
  25  |     if (await markAll.count()) {
  26  |       await markAll.click();
  27  |       await expect(page.locator(".unread-badge")).toHaveCount(0);
  28  |     }
  29  |   });
  30  | 
  31  |   test("response actions: reject with reason, regenerate, edit, publish gate, bulk approve, and audit trail", async ({
  32  |     page,
  33  |   }) => {
  34  |     await page.goto("/");
  35  |     await page.getByRole("button", { name: "Response Studio", exact: true }).first().click();
  36  |     await expect(page.getByRole("heading", { name: "Response Studio" }).last()).toBeVisible();
  37  | 
  38  |     // 1. Regenerate
  39  |     const regenBtn = page.getByRole("button", { name: "Regenerate" });
  40  |     await expect(regenBtn).toBeVisible();
  41  |     await regenBtn.click();
  42  |     await expect(page.getByText("New variation generated")).toBeVisible();
  43  | 
  44  |     // 2. Edit draft & Save edit
  45  |     const textarea = page.getByRole("textbox", { name: "Response draft" });
  46  |     await textarea.fill("Custom drafted reply for customer feedback test.");
  47  |     const saveBtn = page.getByRole("button", { name: "Save edit" });
  48  |     await expect(saveBtn).toBeVisible();
  49  |     await saveBtn.click();
  50  |     await expect(page.getByText("Draft saved and new response version created")).toBeVisible();
  51  | 
  52  |     // 3. Reject with reason
  53  |     await page.getByRole("button", { name: "Reject", exact: true }).click();
  54  |     const reasonInput = page.getByLabel("Rejection reason input");
  55  |     await expect(reasonInput).toBeVisible();
  56  |     await reasonInput.fill("Tone is too defensive for our brand guidelines");
  57  |     await page.getByRole("button", { name: "Confirm Reject" }).click();
  58  |     await expect(page.getByText("Draft marked as rejected")).toBeVisible();
  59  | 
  60  |     // 4. Publish gate: publish is disabled when rejected/not approved
  61  |     const publishBtn = page.getByRole("button", { name: "Publish response" });
  62  |     await expect(publishBtn).toBeDisabled();
  63  | 
  64  |     // 5. Approve
  65  |     await page.getByRole("button", { name: "Approve", exact: true }).click();
  66  |     await expect(publishBtn).toBeEnabled();
  67  | 
  68  |     // 6. Publish response
  69  |     await publishBtn.click();
  70  |     await expect(page.getByText("Response published to channels")).toBeVisible();
  71  | 
  72  |     // 7. Bulk approve
  73  |     const bulkBtn = page.getByRole("button", { name: "Bulk approve" });
  74  |     await expect(bulkBtn).toBeVisible();
  75  |     await bulkBtn.click();
  76  |     await expect(page.getByText("Bulk approved")).toBeVisible();
  77  | 
  78  |     // 8. Global Audit View
  79  |     await page.getByRole("button", { name: "Global Audit" }).click();
  80  |     await expect(page.getByRole("heading", { name: "Global Audit Log" })).toBeVisible();
  81  |     await expect(page.locator(".audit-table")).toBeVisible();
  82  |   });
  83  | 
  84  |   test("drawer actions (Generate Response, Open Incident, Notify Product Team) write audit entries", async ({
  85  |     page,
  86  |   }) => {
  87  |     await page.goto("/");
  88  |     // Click on a mention to open drawer
  89  |     await page.locator(".mention-row").first().click();
  90  |     const drawer = page.locator(".drawer");
  91  |     await expect(drawer).toBeVisible();
  92  | 
  93  |     // 1. Generate Response in drawer
  94  |     const genBtn = drawer.getByRole("button", { name: "Generate Response" });
  95  |     await expect(genBtn).toBeVisible();
  96  |     await genBtn.click();
> 97  |     await expect(page.getByText("Draft response generated")).toBeVisible();
      |                                                              ^ Error: expect(locator).toBeVisible() failed
  98  | 
  99  |     // 2. Open Incident in drawer
  100 |     const incBtn = drawer.getByRole("button", { name: "Open Incident" });
  101 |     await expect(incBtn).toBeVisible();
  102 |     await incBtn.click();
  103 |     await expect(page.getByText("Incident opened")).toBeVisible();
  104 | 
  105 |     // 3. Notify Product Team in drawer
  106 |     const notifyBtn = drawer.getByRole("button", { name: "Notify Product Team" });
  107 |     await expect(notifyBtn).toBeVisible();
  108 |     await notifyBtn.click();
  109 |     await expect(page.getByText("Product team notified")).toBeVisible();
  110 | 
  111 |     // Close drawer
  112 |     await page.getByRole("button", { name: "Close drawer" }).click();
  113 |     await expect(drawer).not.toBeVisible();
  114 |   });
  115 | 
  116 |   test("optimistic update rollback on approval error", async ({ page }) => {
  117 |     await page.goto("/");
  118 |     await page.getByRole("button", { name: "Response Studio", exact: true }).first().click();
  119 | 
  120 |     // Mock failure for approval
  121 |     await page.route("http://127.0.0.1:8000/api/responses/1/approve", (route) =>
  122 |       route.abort(),
  123 |     );
  124 | 
  125 |     await page.getByRole("button", { name: "Approve", exact: true }).click();
  126 |     await expect(page.getByText("Failed to approve response. Rolled back.")).toBeVisible();
  127 |     // Publish should remain disabled due to rollback
  128 |     await expect(page.getByRole("button", { name: "Publish response" })).toBeDisabled();
  129 |   });
  130 | });
  131 | 
```