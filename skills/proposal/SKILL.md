---
name: proposal
description: Write a client proposal for the agency's services and build it as a printable HTML page and PDF, with scope, pricing, timeline and terms. Use when the user asks for a proposal, quote, pitch document, scope of work or pricing document for a lead or an existing client.
---

# Write a proposal

A proposal is read by a busy owner deciding whether to spend money. It should make three things obvious in under two minutes: you understood their situation, what exactly they get, and what it costs. A script in this skill lays it out; this skill's job is the content.

## 1. Collect the inputs

Read `agency/profile.md` for the services and prices the agency actually offers, and the lead's or client's files for what is known about them. Then ask the user only for what is missing:

- Who it is for, and the contact's name.
- Which services, and the price of each. **Prices come from the user or from `agency/profile.md`. Never make one up or adjust one.** If a price is missing, ask.
- Start date and how long the proposal is valid.
- Payment terms and minimum commitment.
- Tax wording. In Australia, whether prices include GST; in the US, whether sales tax applies. Record what the user says; do not calculate tax.

## 2. Write `proposal.json`

Save it in the lead's or client's folder.

```json
{
  "client": "Acme Plumbing",
  "contact": "(attn. Dave)",
  "locale": "en-AU",
  "currency": "AUD",
  "date": "12 November 2026",
  "validUntil": "12 December 2026",
  "title": "More booked jobs from Google and Instagram",
  "summary": "Acme has 126 strong reviews but no website to send people to. We'll build one and publish eight short videos a month so the reviews turn into calls.",
  "problems": [
    "The Google listing links to a Facebook page that was last updated in March.",
    "Customers can't book or request a quote online."
  ],
  "scope": [
    { "title": "Website", "items": ["Five-page site with click-to-call and a quote form", "Set up on your domain"] },
    { "title": "Monthly video package", "items": ["Eight short videos filmed on site", "Captions and scheduling"] }
  ],
  "pricing": [
    { "item": "Website build", "period": "one-off", "price": 2400 },
    { "item": "Monthly video package", "period": "monthly", "price": 1500, "note": "Three-month minimum" }
  ],
  "taxNote": "Prices exclude GST.",
  "timeline": [
    { "when": "Week 1", "what": "Kick-off call and content collection" },
    { "when": "Week 3", "what": "Website live" }
  ],
  "terms": ["50% of the website fee on acceptance, 50% on launch.", "Monthly packages are billed in advance."],
  "nextStep": "Reply to this email to accept and we'll send the first invoice and book the kick-off call.",
  "agency": { "name": "Northside Media", "email": "hello@example.com", "phone": "", "website": "", "businessId": "ABN 00 000 000 000", "colour": "#0f62fe" }
}
```

Writing it:

- **Title**: the outcome for the client, not "Marketing Proposal".
- **Summary**: two or three sentences. Their situation, what you will do, the result it is meant to produce.
- **Problems**: specific and checkable observations about their business. Skip the section if you have none.
- **Scope items**: things they can count or see. "Eight videos a month", not "ongoing content support".
- **Results**: describe the work and the aim. Do not promise rankings, lead numbers or revenue.
- `price` is a number without symbols; the script formats it for the locale and adds a total per billing period. `en-US` prints on Letter paper, anything else on A4.

## 3. Build

```bash
node <skill folder>/scripts/build.mjs --data <folder>/proposal.json --out <folder>/proposal --pdf
```

In Claude Code the skill folder is `${CLAUDE_SKILL_DIR}`. This writes `proposal.html`, and `proposal.pdf` when Playwright is installed. Without Playwright the script says so: the user can open the HTML and print to PDF from the browser, or install Playwright with the command the script prints.

## 4. Review with the user

Read the output once more for wrong names, prices and dates before sending anything. Show the user the totals per billing period and ask them to confirm. Then draft a short covering email in the agency's voice that states the single next step.
