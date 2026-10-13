# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: command-center.spec.ts >> response studio keeps publishing disabled until approval
- Location: tests\command-center.spec.ts:52:1

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
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
      - button "Response Studio" [active] [ref=e53] [cursor=pointer]:
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
        - heading "Response Studio" [level=1] [ref=e85]
      - generic [ref=e86]:
        - combobox "Time range" [ref=e87]:
          - option "24H" [selected]
          - option "7D"
          - option "30D"
        - combobox "Platform filter" [ref=e88]:
          - option "All platforms" [selected]
          - option "Trustpilot"
          - option "Facebook"
          - option "YouTube"
          - option "LinkedIn"
          - option "Instagram"
          - option "Reddit"
          - option "X"
          - option "Google Reviews"
          - option "App Store"
          - option "G2"
        - generic [ref=e89]:
          - textbox "Search mentions" [ref=e93]:
            - /placeholder: Search mentions...
          - generic [ref=e94]: ⌘K
        - button "Toggle presentation mode" [ref=e95] [cursor=pointer]
        - button "Toggle notifications" [ref=e99] [cursor=pointer]:
          - generic "2 unread notifications" [ref=e103]: "2"
        - generic [ref=e104]: ● LIVE
    - generic [ref=e105]:
      - generic [ref=e106]:
        - generic [ref=e107]: GLOBAL FILTERS
        - button "All sentiment" [ref=e108] [cursor=pointer]
        - button "positive" [ref=e109] [cursor=pointer]
        - button "neutral" [ref=e110] [cursor=pointer]
        - button "negative" [ref=e111] [cursor=pointer]
      - generic [ref=e112]:
        - text: 100 visible signals ·
        - button "Refresh" [ref=e113] [cursor=pointer]
    - generic [ref=e114]:
      - generic [ref=e115]:
        - generic [ref=e116]:
          - text: GOVERNED RESPONSE
          - heading "Response Studio" [level=2] [ref=e117]
          - paragraph [ref=e118]: Draft, review, and publish with an explicit approval gate and audit trail.
        - generic [ref=e119]:
          - button "Reset demo data" [ref=e120] [cursor=pointer]
          - button "Bulk approve" [ref=e121] [cursor=pointer]
      - generic [ref=e125]:
        - button "Pending" [ref=e126] [cursor=pointer]
        - button "Approved" [ref=e127] [cursor=pointer]
        - button "Rejected" [ref=e128] [cursor=pointer]
        - button "Published" [ref=e129] [cursor=pointer]
        - button "Global Audit" [ref=e130] [cursor=pointer]
      - generic [ref=e131]:
        - button "#1 Login Issues (APPROVED)" [ref=e132] [cursor=pointer]
        - button "#2 App Update Failure (APPROVED)" [ref=e133] [cursor=pointer]
        - button "#3 Performance (PENDING_REVIEW)" [ref=e134] [cursor=pointer]
      - generic [ref=e135]:
        - article [ref=e136]:
          - generic [ref=e137]:
            - heading "Suggested response · Login Issues" [level=3] [ref=e139]
            - generic [ref=e140]: APPROVED
          - textbox "Response draft" [ref=e141]: Updated response draft reviewed by communication leads.
          - generic [ref=e142]: "55 characters · tone: empathetic"
          - generic [ref=e144]:
            - button "Regenerate" [ref=e145] [cursor=pointer]
            - button "Reject" [ref=e149] [cursor=pointer]
            - button "Approved" [disabled] [ref=e153]
          - generic [ref=e156]: ✓ DRAFT→ PENDING→ APPROVED→ PUBLISHED
        - article [ref=e157]:
          - generic [ref=e159]:
            - heading "Audit trail" [level=3] [ref=e160]
            - button "Every transition is recorded by the backend." [ref=e161] [cursor=pointer]
          - generic [ref=e165]:
            - generic [ref=e166]:
              - generic [ref=e167]: Topic
              - strong [ref=e168]: Login Issues
            - generic [ref=e169]:
              - generic [ref=e170]: Reviewer
              - strong [ref=e171]: Alex Rivera
            - generic [ref=e172]:
              - generic [ref=e173]: Publish gate
              - strong [ref=e174]: Unlocked
            - generic [ref=e175]:
              - generic [ref=e176]: approve
              - strong [ref=e177]: APPROVED
            - generic [ref=e178]:
              - generic [ref=e179]: drawer_notify_product_team
              - strong [ref=e180]: "Notified Product Team for mention #1"
            - generic [ref=e181]:
              - generic [ref=e182]: edit
              - strong [ref=e183]: PENDING_REVIEW
          - button "Publish response" [ref=e184] [cursor=pointer]
      - generic [ref=e188]:
        - generic [ref=e189]: CRISIS SIMULATOR
        - heading "Need to model escalation?" [level=3] [ref=e190]
        - button "Run simulation" [ref=e191] [cursor=pointer]
        - button "Open Crisis Ops" [ref=e192] [cursor=pointer]
        - generic [ref=e195]: Simulation ready · mentions will be projected from current data
  - region "Notifications alt+T"
```