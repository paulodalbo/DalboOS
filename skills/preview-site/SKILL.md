---
name: preview-site
description: Build a one-page concept website for a prospect or client from their public details, as a clearly labelled preview the agency can send or screen-share. Use when the user wants a demo site, mock website, preview site, concept page or "show them what their site could look like" for a lead or a client.
---

# Build a preview site

A preview site shows a business owner what they could have, using their own name, services and reviews. It is the strongest thing to attach to a first message. A script in this skill builds the page from a short JSON brief, so the layout is the same every time and only the words change.

The page always carries a visible banner saying it is a concept prepared by the agency, and a `noindex` tag. Keep both. A preview that could be mistaken for the business's real site is a liability for the agency.

## 1. Gather the facts

From the lead file (if the `prospect` skill made one), the business's Google listing and its existing pages, collect:

- Name, service area, phone, email, address.
- What they do: three to six services.
- Rating and review count, and two or three short review excerpts (under 30 words each, with the reviewer's first name as shown publicly).
- Brand colours, if they have a logo or signage to take them from.

Use only what is public and true. If a detail is not known, leave it out; do not invent services, awards, years in business or testimonials.

## 2. Write the brief

Save `brief.json` in the lead's folder (`leads/<run>/<business-slug>/`):

```json
{
  "name": "Acme Plumbing",
  "locale": "en-AU",
  "headline": "Blocked drain? We're there today.",
  "intro": "Licensed plumbers covering Southport and Labrador, with upfront prices and same-day call-outs.",
  "area": "Serving Southport, Labrador and Biggera Waters",
  "servicesTitle": "What we fix",
  "services": [
    { "title": "Blocked drains", "text": "Cleared with a camera inspection so it stays cleared." },
    { "title": "Hot water", "text": "Repairs and replacements for gas and electric systems." }
  ],
  "rating": "4.8",
  "reviewCount": "126",
  "reviews": [{ "text": "Turned up within the hour and fixed it first go.", "author": "Sarah" }],
  "phone": "07 5555 0100",
  "email": "",
  "address": "Southport QLD",
  "cta": "Call 07 5555 0100",
  "colours": { "brand": "#0f62fe", "brandDark": "#0a3d91", "onBrand": "#ffffff" },
  "heroImage": "",
  "agency": "Northside Media"
}
```

Writing the words:

- **Headline**: the customer's problem or the outcome, in under eight words. Not the business name, not "Welcome to".
- **Intro**: one sentence saying who they help, where, and why them.
- **Services**: a plain title and one sentence each.
- Spelling follows `locale` (`en-AU` or `en-US`).
- **Colours**: `onBrand` is the text colour on top of `brand` and must be readable on it. When unsure, use white on a dark brand colour.
- **heroImage**: leave empty unless the user supplies a photo they have the right to use. Do not download photos from the business's listing or from the web.

`name`, `headline`, `intro`, `agency`, at least two services, and a phone or email are required.

## 3. Build

```bash
node <skill folder>/scripts/build.mjs --brief leads/<run>/<slug>/brief.json --out leads/<run>/<slug>/preview
```

In Claude Code the skill folder is `${CLAUDE_SKILL_DIR}`. The script writes `preview/index.html`, a single self-contained file. It needs Node 20 or later and nothing else.

## 4. Check and hand over

Open the file and read it as the business owner would: is every fact right, does the headline sound like them, does the call button dial the right number? Fix the brief and rebuild if not.

Tell the user where the file is and how to share it: screen-share it, send a screenshot, or publish it on the agency's own hosting under the agency's domain. It should never go on a domain that imitates the business's name.
