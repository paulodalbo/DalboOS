---
name: monthly-report
description: Write a client's monthly marketing report from their ad platform exports or connected accounts, with computed totals, change against the previous month, what worked, what did not and what happens next. Use when the user asks for a monthly report, performance report, ads report, results summary or client update for a client, or shares Google Ads or Meta Ads exports to analyse.
---

# Monthly client report

A client reads this to answer one question: is the money working? The report leads with that answer, shows the few numbers that support it, and says what the agency will do next. It is written for a business owner, not a media buyer.

Work from the client's `memory/focus.md` for the goal and how it is measured, and `memory/voice.md` only for how formal to be. The report is in the agency's voice.

## 1. Get the numbers

Use the first source that is available:

1. **Connected accounts.** If the session has tools for Google Ads, Meta Ads or analytics, pull campaign-level cost, impressions, clicks and conversions for the report month and the month before.
2. **Exports.** Ask the user for campaign-level CSV exports for both months. From Google Ads: the Campaigns report with Cost, Impressions, Clicks and Conversions. From Meta Ads Manager: the Campaigns view with Amount spent, Impressions, Link clicks and Results. Save them in the client's `reports/data/`.

For exports, run the script in this skill for each platform:

```bash
node <skill folder>/scripts/summarize.mjs \
  --current reports/data/2026-11-google.csv --previous reports/data/2026-10-google.csv \
  --out reports/data/2026-11-google.json
```

In Claude Code the skill folder is `${CLAUDE_SKILL_DIR}`. It needs Node 20 or later. The output has totals, per-campaign figures, CTR, CPC, cost per conversion, and percentage change. **Every number in the report comes from this output or from a connected account.** Do not calculate figures by hand or estimate them.

If `columnsMissing` lists a metric, say the export did not include it instead of reporting it as zero.

Ask the user for anything the platforms cannot know: enquiries or sales the client counted themselves, and anything unusual in the month (a promotion, a week closed, a price change).

## 2. Read the numbers before writing

- Did the result the client cares about go up or down, and by how much?
- Which campaign produced most of it, and at what cost per result?
- Which campaign spent money without results?
- Is a change real, or is the sample too small to say? Fewer than about 20 conversions in a month moves a lot by chance; say so instead of explaining noise.
- Does anything look wrong (conversions tracked twice, spend at zero for a week)? Flag it to the user before it goes in a client report.

## 3. Write the report

Save as `reports/<YYYY-MM>.md` in the client's folder. One page.

1. **The headline**: one or two sentences with the result against the goal. For example: "November brought 31 enquiries from ads at $48 each, up from 24 in October."
2. **The numbers**: a small table of this month and last month for spend, the main result, cost per result, and one or two supporting metrics. Use the client's currency and locale.
3. **What worked**: two or three specific points, each tied to a number.
4. **What did not**: stated plainly, with what will change because of it. A report that only has good news is not believed.
5. **Next month**: three actions at most, each with what it is meant to improve.
6. **What we need from you**: approvals, footage, access. Leave out if nothing.

Plain words. "Cost per enquiry" instead of CPA, "people who saw the ad" instead of impressions, on first use at least. No claims about results the data does not show, and no predictions stated as promises.

## 4. Hand over

Show the user the headline and the table, and point out anything you flagged. Then offer a short covering email in the agency's voice. If the user wants a PDF or slides, build those from the finished Markdown.
