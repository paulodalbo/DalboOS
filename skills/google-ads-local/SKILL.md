---
name: google-ads-local
description: Plan and write a Google Ads search campaign for a local business (structure, keywords with match types, negative keywords, responsive search ads within character limits, assets and location settings) as files ready to review and import. Use when the user asks to set up, build or draft Google Ads, search ads or a PPC campaign for a local client, or wants ad copy and keywords for a service in a specific area.
---

# Google Ads search campaign for a local business

Builds a small, tightly targeted search campaign of the kind that works for a local service: few ad groups, intent-heavy keywords, strong negatives, and ads that say what, where and why now. The output is a plan the user reviews, plus CSV files to import.

For auditing an existing account, use a dedicated ads audit skill; this skill builds new campaigns.

Work from the active client's `memory/business.md`, `memory/voice.md` and `memory/focus.md`.

## 1. Agree the basics

- **What to advertise**: one to four services, starting with the best earner.
- **Where**: suburbs, a radius around the business, or a region. Presence only, so the ads reach people in the area, not people interested in it.
- **Budget**: the monthly amount from the user. Divide by 30.4 for the daily budget. Do not suggest a budget as if it were a fact about the market; if asked, explain that click prices vary by trade and area and that Keyword Planner in the client's account gives real estimates.
- **What counts as a conversion**: calls, form submissions, bookings. If conversion tracking is not set up, that is the first action in the plan, before any spend.
- **Landing page** for each service. An ad group without a page that matches it should not launch.

## 2. Structure

One campaign, one ad group per service. Keep it small enough that each ad group gets data.

**Keywords**, 5 to 15 per ad group:
- Service plus intent: "emergency plumber", "blocked drain repair", "hot water system replacement".
- Service plus area: "plumber southport".
- Use phrase match and exact match. Leave broad match out of a new, small-budget local campaign unless the user asks for it.
- Take real phrasing from how customers describe the problem in the client's reviews.

**Negative keywords** at campaign level: jobs, careers, salary, course, training, apprenticeship, DIY, how to, free, cheap (if the client is not the cheap option), wholesale, parts, and the names of suburbs or cities outside the service area that share a name with ones inside it.

## 3. Write the ads

One responsive search ad per ad group.

- **Headlines**: up to 15, each **30 characters or fewer**. Cover the service, the area, proof (rating, years, licence) and an action. At least three should make sense alone, because Google shows them in any combination.
- **Descriptions**: up to 4, each **90 characters or fewer**.
- **Display paths**: two, each 15 characters or fewer.
- Count the characters of every line and fix any that run over before showing the user. Spaces count.
- Claims must be true and come from the client's memory: "24/7" only if they answer at 3 am, "licensed" with the licence detail the client supplied, prices only if confirmed. No superlatives the client cannot back up ("best", "#1").
- Spelling follows the client's locale.

**Assets**: four or more sitelinks (text of 25 characters or fewer, with two description lines of 35 or fewer), four or more callouts (25 or fewer), a call asset with the tracked phone number, and the location asset from the linked Business Profile.

## 4. Save the files

Under the client's `content/google-ads/<campaign-slug>/`:

- `plan.md`: settings (locations, schedule, bidding, budget), the structure, and anything the user must do by hand in the account.
- `keywords.csv` with columns `Campaign,Ad Group,Keyword,Criterion Type` (Exact, Phrase).
- `negatives.csv` with columns `Campaign,Keyword,Criterion Type` (Negative Phrase or Negative Exact).
- `ads.csv` with columns `Campaign,Ad Group,Headline 1` to `Headline 15`, `Description 1` to `Description 4`, `Path 1,Path 2,Final URL`.
- `assets.md`: sitelinks, callouts and call details to enter.

The CSV column names follow Google Ads Editor's import format. Editor shows a preview and flags unrecognised columns before anything is applied, so tell the user to check that preview; column names change occasionally.

**Bidding** for a new account with no conversion history: Maximise clicks with a bid cap, or Manual CPC, until there are enough tracked conversions to switch to a conversion-based strategy. Say this is a starting point to revisit after the first few weeks.

## 5. Hand over

Summarise: the campaign structure, daily budget, the count of keywords and negatives, and the checklist before launch (conversion tracking verified, landing pages live, billing set, location set to presence). Nothing is imported or launched by this skill, and the campaign should start paused until the user has reviewed it in the account.
