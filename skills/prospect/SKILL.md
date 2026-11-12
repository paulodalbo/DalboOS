---
name: prospect
description: Find and qualify local business leads for the agency from a niche and a location, using Google's Places API, then draft first-contact messages and follow-ups for the best ones. Use when the user wants leads, prospects, a prospecting list, cold outreach targets, "businesses with no website in X", or new clients for the agency in a suburb, city or region in Australia or the US.
---

# Prospect local businesses

Takes a niche and a place, returns a ranked list of real businesses that look like a fit for the agency, and drafts the outreach for the ones the user picks. The search uses Google's official Places API through a script in this skill, so results are real listings and nothing is scraped.

Work from the agency's memory (`agency/profile.md`, `agency/voice.md`): the offer in the messages is what the agency actually sells, in the agency's voice.

## 1. Agree the search

Ask for anything not already given:

- **Niche**: the kind of business (plumbers, cafes, physios).
- **Location**: suburb or city, with state and country. Narrow beats broad: one suburb at a time gives better leads than a whole city.
- **What makes a good lead** for this run. The default scoring favours businesses with no website or only a social page, good reviews, and a phone number. If the agency is selling something else (video, ads), say what should count instead and re-rank the results yourself after the script runs.

## 2. Run the search

The script is `scripts/find-places.mjs` in this skill's folder (in Claude Code, `${CLAUDE_SKILL_DIR}/scripts/find-places.mjs`). It needs Node 20 or later and a `GOOGLE_PLACES_API_KEY`.

```bash
node --env-file=.env <skill folder>/scripts/find-places.mjs \
  --query "plumbers in Southport QLD" --region AU --max 40 \
  --out leads/2026-11-southport-plumbers.json
```

- Save output under `leads/` at the workspace root, or under the client's `leads/` when prospecting on a client's behalf.
- `--region` is `AU` or `US`. `--max` goes up to 60, the most Google returns per query. For more, run neighbouring suburbs separately.
- **No key yet:** tell the user the script needs a Google Cloud API key with "Places API (New)" enabled, saved as `GOOGLE_PLACES_API_KEY=...` in the workspace `.env` file (already in `.gitignore`). Google bills these searches, so point them to Google's current pricing page instead of quoting a price. Do not fall back to scraping Google Maps. If the user would rather not set up a key, offer a smaller manual run with web search and mark every detail as unverified.

## 3. Qualify

Read the JSON. Each lead has a `score` from 0 to 100 and `reasons`. Before showing the list:

- Drop chains, franchises and government listings unless the user wants them.
- For the top ten, open the lead's website if it has one and note in one line what is wrong or missing (not mobile friendly, no booking, last updated years ago). A lead with a good site is a weak lead for a website offer, whatever its score.
- **Australia only, optional:** `scripts/abn-lookup.mjs --name "<business name>"` lists matching entities on the Australian Business Register. It needs a free `ABN_LOOKUP_GUID`. A name search returns candidates, so treat a match as confirmed only when the name and the state or postcode both agree; otherwise leave the ABN blank. There is no single national register to check US businesses against.

Show the user a table: name, suburb, rating and review count, website status, why they are a fit. Ask which ones to pursue.

## 4. Draft the outreach

For each chosen lead, write to `leads/<run>/<business-slug>.md`:

- **First message**, under 90 words. Lead with one specific, true observation about their business (a review theme, their missing booking link), then the offer in one sentence, then one low-effort ask. No flattery, no "I hope this finds you well", no invented facts.
- **Two follow-ups**, shorter than the first, each adding something new instead of "just checking in".
- **Channel**: prefer the contact method the business publishes for enquiries.

If the user wants a preview site or a proposal for a lead, the `preview-site` and `proposal` skills take it from here.

## 5. Stay inside the rules

Say this once per run, briefly, and build it into the drafts:

- **Australia:** commercial emails and texts fall under the Spam Act. They need the recipient's consent (which can be inferred in limited cases, such as a business address published for enquiries where the message relates to that role), must identify the sender, and must include a way to unsubscribe.
- **US:** commercial email falls under CAN-SPAM: no misleading headers or subject lines, a physical postal address, and a working opt-out. Marketing texts and automated calls need prior consent under the TCPA.

This is a summary, not legal advice. Every drafted email includes the agency's name, a real contact address and an opt-out line. Do not draft SMS campaigns to people who have not agreed to receive them.

## Output

End with: how many places were found, how many made the shortlist, where the files are, and which leads the user chose.
