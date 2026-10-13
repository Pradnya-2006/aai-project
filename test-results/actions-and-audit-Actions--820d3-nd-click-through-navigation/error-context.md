# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: actions-and-audit.spec.ts >> Actions, Audit Trail, and Notifications >> notifications show unread badge, real list, mark read, and click-through navigation
- Location: tests\actions-and-audit.spec.ts:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('dialog', { name: 'Notifications panel' }).getByText('Notifications')
Expected: visible
Error: strict mode violation: getByRole('dialog', { name: 'Notifications panel' }).getByText('Notifications') resolved to 2 elements:
    1) <strong>Notifications</strong> aka getByText('Notifications', { exact: true })
    2) <div class="muted">No notifications</div> aka getByText('No notifications')

Call log:
  - Expect "toBeVisible" getByRole('dialog', { name: 'Notifications panel' }).getByText('Notifications') with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'Notifications panel' }).getByText('Notifications')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]: A
        - generic [ref=e7]:
          - strong [ref=e8]: ACME / AI
          - generic [ref=e9]: BRAND INTELLIGENCE
      - button "Collapse sidebar" [ref=e10] [cursor=pointer]
      - navigation "Primary navigation" [ref=e12]:
        - button "Command Center" [ref=e13] [cursor=pointer]
        - button "Live Mentions" [ref=e20] [cursor=pointer]
        - button "Topics & Trends" [ref=e25] [cursor=pointer]
        - button "Risk Center" [ref=e29] [cursor=pointer]
        - button "Competitors" [ref=e33] [cursor=pointer]
        - button "Influencers" [ref=e40] [cursor=pointer]
        - button "Campaigns" [ref=e47] [cursor=pointer]
        - button "Response Studio" [ref=e53] [cursor=pointer]:
          - generic [ref=e58]: "3"
        - button "Crisis Ops" [ref=e59] [cursor=pointer]
        - button "Executive Intelligence" [ref=e63] [cursor=pointer]
      - generic [ref=e68]:
        - button "Light theme" [ref=e69] [cursor=pointer]
        - button "Toggle demo mode" [ref=e77] [cursor=pointer]:
          - generic [ref=e81]: "Data mode: Live"
    - main [ref=e82]:
      - generic [ref=e83]:
        - generic [ref=e84]:
          - text: WORKSPACE / ACME
          - heading "Command Center" [level=1] [ref=e85]
        - generic [ref=e86]:
          - combobox "Time range" [ref=e87]:
            - option "24H" [selected]
            - option "7D"
            - option "30D"
          - combobox "Platform filter" [ref=e88]:
            - option "All platforms" [selected]
            - option "X"
            - option "Reddit"
            - option "Instagram"
          - generic [ref=e89]:
            - textbox "Search mentions" [ref=e93]:
              - /placeholder: Search mentions...
            - generic [ref=e94]: ⌘K
          - button "Toggle presentation mode" [ref=e95] [cursor=pointer]
          - generic [ref=e98]:
            - button "Toggle notifications" [active] [ref=e99] [cursor=pointer]
            - dialog "Notifications panel" [ref=e103]:
              - strong [ref=e106]: Notifications
              - generic [ref=e107]: No notifications
          - generic [ref=e109]: ● LIVE
      - generic [ref=e110]:
        - generic [ref=e111]:
          - generic [ref=e112]: GLOBAL FILTERS
          - button "All sentiment" [ref=e113] [cursor=pointer]
          - button "positive" [ref=e114] [cursor=pointer]
          - button "neutral" [ref=e115] [cursor=pointer]
          - button "negative" [ref=e116] [cursor=pointer]
        - generic [ref=e117]:
          - text: 3 visible signals ·
          - button "Refresh" [ref=e118] [cursor=pointer]
      - generic [ref=e129]:
        - generic [ref=e130]:
          - generic [ref=e131]:
            - text: WEDNESDAY · 24 HOUR WINDOW
            - heading "Good morning, Marketing team" [level=2] [ref=e132]
            - paragraph [ref=e133]: Your brand is being discussed across the public web.
          - button "Run AI Analysis" [ref=e134] [cursor=pointer]
        - generic [ref=e138]:
          - article [ref=e139]:
            - generic [ref=e140]: Brand health
            - generic [ref=e146]: 0/100
            - text: computed from current data
          - article [ref=e154]:
            - generic [ref=e155]: Total mentions
            - generic [ref=e160]: "0"
            - text: computed from current data
          - article [ref=e168]:
            - generic [ref=e169]: Negative sentiment
            - generic [ref=e174]: 0%
            - text: computed from current data
          - article [ref=e182]:
            - generic [ref=e183]: Current risk
            - generic [ref=e188]: 0/100
            - text: Current LOW · predicted risk
        - generic [ref=e196]:
          - article [ref=e197]:
            - generic [ref=e198]:
              - generic [ref=e199]:
                - heading "Mention activity" [level=3] [ref=e200]
                - button "Volume and negative sentiment from current API data." [ref=e201] [cursor=pointer]
              - generic [ref=e205]:
                - generic [ref=e206]: mentions
                - generic [ref=e208]: negative
            - application [ref=e212]:
              - generic [ref=e217]:
                - generic [ref=e218]:
                  - generic [ref=e219]: 2h
                  - generic [ref=e221]: 4h
                  - generic [ref=e223]: 6h
                  - generic [ref=e225]: 8h
                  - generic [ref=e227]: 10h
                  - generic [ref=e229]: 12h
                  - generic [ref=e231]: 14h
                  - generic [ref=e233]: 16h
                  - generic [ref=e235]: 18h
                  - generic [ref=e237]: 20h
                  - generic [ref=e239]: 22h
                  - generic [ref=e241]: 24h
                - generic [ref=e243]:
                  - generic [ref=e244]: "0"
                  - generic [ref=e246]: "6"
                  - generic [ref=e248]: "12"
                  - generic [ref=e250]: "18"
                  - generic [ref=e252]: "24"
            - generic [ref=e254]:
              - generic [ref=e255]: ● elevated
              - generic [ref=e256]: ◆ prediction
              - generic [ref=e257]: ▲ critical
          - article [ref=e258]:
            - generic [ref=e260]:
              - heading "What is happening?" [level=3] [ref=e261]
              - button "Highest-volume active issue cluster." [ref=e262] [cursor=pointer]
            - generic [ref=e270]:
              - text: ISSUE CLUSTER
              - heading "No active risk" [level=3] [ref=e271]
              - paragraph [ref=e272]: 0% negative · 0% growth · z-score 0
            - generic [ref=e273]:
              - generic [ref=e274]: RECOMMENDED ACTION
              - strong [ref=e275]: Continue monitoring.
        - generic [ref=e276]:
          - article [ref=e277]:
            - generic [ref=e278]:
              - generic [ref=e279]:
                - heading "Agent pipeline" [level=3] [ref=e280]
                - button "Click an agent to inspect measured output." [ref=e281] [cursor=pointer]
              - generic [ref=e285]: ready
            - generic [ref=e287]:
              - button "1 Collect IDLE · 0" [ref=e288] [cursor=pointer]:
                - generic [ref=e289]: "1"
                - generic [ref=e290]: Collect
                - generic [ref=e291]: IDLE · 0
              - button "2 Classify IDLE · 0" [ref=e293] [cursor=pointer]:
                - generic [ref=e294]: "2"
                - generic [ref=e295]: Classify
                - generic [ref=e296]: IDLE · 0
              - button "3 Sentiment IDLE · 0" [ref=e298] [cursor=pointer]:
                - generic [ref=e299]: "3"
                - generic [ref=e300]: Sentiment
                - generic [ref=e301]: IDLE · 0
              - button "4 Influence IDLE · 0" [ref=e303] [cursor=pointer]:
                - generic [ref=e304]: "4"
                - generic [ref=e305]: Influence
                - generic [ref=e306]: IDLE · 0
              - button "5 Trend IDLE · 0" [ref=e308] [cursor=pointer]:
                - generic [ref=e309]: "5"
                - generic [ref=e310]: Trend
                - generic [ref=e311]: IDLE · 0
              - button "6 Risk IDLE · 0" [ref=e313] [cursor=pointer]:
                - generic [ref=e314]: "6"
                - generic [ref=e315]: Risk
                - generic [ref=e316]: IDLE · 0
              - button "7 Recommend IDLE · 0" [ref=e318] [cursor=pointer]:
                - generic [ref=e319]: "7"
                - generic [ref=e320]: Recommend
                - generic [ref=e321]: IDLE · 0
              - button "8 Approve IDLE · 0" [ref=e323] [cursor=pointer]:
                - generic [ref=e324]: "8"
                - generic [ref=e325]: Approve
                - generic [ref=e326]: IDLE · 0
            - generic [ref=e327]:
              - strong [ref=e330]: Master Orchestrator
              - generic [ref=e331]: Awaiting signal run
          - article [ref=e332]:
            - generic [ref=e333]:
              - generic [ref=e334]:
                - heading "Trending topics" [level=3] [ref=e335]
                - button "Ranked by current mention volume." [ref=e336] [cursor=pointer]
              - button "Inspect" [ref=e340] [cursor=pointer]
        - generic [ref=e343]:
          - article [ref=e344]:
            - generic [ref=e346]:
              - heading "Top-impact conversations" [level=3] [ref=e347]
              - button "Impact score is computed by the influence formula." [ref=e348] [cursor=pointer]
            - generic [ref=e352]:
              - button "Maya Chen X · App Update Failure · frustrated The latest app update keeps logging me out. Please fix this. bug report negative frustrated 42 impact 42 impact" [ref=e353] [cursor=pointer]:
                - generic [ref=e355]:
                  - strong [ref=e356]: Maya Chen
                  - generic [ref=e357]: X · App Update Failure · frustrated
                  - paragraph [ref=e358]: The latest app update keeps logging me out. Please fix this.
                  - generic [ref=e359]:
                    - emphasis [ref=e360]: bug report
                    - emphasis [ref=e361]: negative
                    - emphasis [ref=e362]: frustrated
                    - emphasis [ref=e363]: 42 impact
                - generic [ref=e364]:
                  - text: "42"
                  - generic [ref=e365]: impact
              - button "Jordan Lee Reddit · Customer Support · happy Support got back to me quickly and solved my issue. praise positive happy 35 impact 35 impact" [ref=e366] [cursor=pointer]:
                - generic [ref=e368]:
                  - strong [ref=e369]: Jordan Lee
                  - generic [ref=e370]: Reddit · Customer Support · happy
                  - paragraph [ref=e371]: Support got back to me quickly and solved my issue.
                  - generic [ref=e372]:
                    - emphasis [ref=e373]: praise
                    - emphasis [ref=e374]: positive
                    - emphasis [ref=e375]: happy
                    - emphasis [ref=e376]: 35 impact
                - generic [ref=e377]:
                  - text: "35"
                  - generic [ref=e378]: impact
              - button "Priya Shah Instagram · New UI · confused The new dashboard is clean, but export is confusing. question neutral confused 20 impact 20 impact" [ref=e379] [cursor=pointer]:
                - generic [ref=e381]:
                  - strong [ref=e382]: Priya Shah
                  - generic [ref=e383]: Instagram · New UI · confused
                  - paragraph [ref=e384]: The new dashboard is clean, but export is confusing.
                  - generic [ref=e385]:
                    - emphasis [ref=e386]: question
                    - emphasis [ref=e387]: neutral
                    - emphasis [ref=e388]: confused
                    - emphasis [ref=e389]: 20 impact
                - generic [ref=e390]:
                  - text: "20"
                  - generic [ref=e391]: impact
          - article [ref=e392]:
            - generic [ref=e393]:
              - generic [ref=e394]:
                - heading "Live activity" [level=3] [ref=e395]
                - button "Newest classified signals." [ref=e396] [cursor=pointer]
              - button "View all" [ref=e400] [cursor=pointer]
            - generic [ref=e403]:
              - button "Maya Chen X · App Update Failure · frustrated The latest app update keeps logging me out. Please fix this. bug report negative frustrated 42 impact 42 impact" [ref=e404] [cursor=pointer]:
                - generic [ref=e406]:
                  - strong [ref=e407]: Maya Chen
                  - generic [ref=e408]: X · App Update Failure · frustrated
                  - paragraph [ref=e409]: The latest app update keeps logging me out. Please fix this.
                  - generic [ref=e410]:
                    - emphasis [ref=e411]: bug report
                    - emphasis [ref=e412]: negative
                    - emphasis [ref=e413]: frustrated
                    - emphasis [ref=e414]: 42 impact
                - generic [ref=e415]:
                  - text: "42"
                  - generic [ref=e416]: impact
              - button "Jordan Lee Reddit · Customer Support · happy Support got back to me quickly and solved my issue. praise positive happy 35 impact 35 impact" [ref=e417] [cursor=pointer]:
                - generic [ref=e419]:
                  - strong [ref=e420]: Jordan Lee
                  - generic [ref=e421]: Reddit · Customer Support · happy
                  - paragraph [ref=e422]: Support got back to me quickly and solved my issue.
                  - generic [ref=e423]:
                    - emphasis [ref=e424]: praise
                    - emphasis [ref=e425]: positive
                    - emphasis [ref=e426]: happy
                    - emphasis [ref=e427]: 35 impact
                - generic [ref=e428]:
                  - text: "35"
                  - generic [ref=e429]: impact
              - button "Priya Shah Instagram · New UI · confused The new dashboard is clean, but export is confusing. question neutral confused 20 impact 20 impact" [ref=e430] [cursor=pointer]:
                - generic [ref=e432]:
                  - strong [ref=e433]: Priya Shah
                  - generic [ref=e434]: Instagram · New UI · confused
                  - paragraph [ref=e435]: The new dashboard is clean, but export is confusing.
                  - generic [ref=e436]:
                    - emphasis [ref=e437]: question
                    - emphasis [ref=e438]: neutral
                    - emphasis [ref=e439]: confused
                    - emphasis [ref=e440]: 20 impact
                - generic [ref=e441]:
                  - text: "20"
                  - generic [ref=e442]: impact
    - region "Notifications alt+T"
  - generic [aria-hidden] [ref=e443]: "0"
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
> 15  |     await expect(panel.getByText("Notifications")).toBeVisible();
      |                                                    ^ Error: expect(locator).toBeVisible() failed
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
  97  |     await expect(page.getByText("Draft response generated")).toBeVisible();
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
```