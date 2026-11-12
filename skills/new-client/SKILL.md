---
name: new-client
description: Add a client to an DalboOS workspace, with their own memory (business, voice, focus) and brand guide, filled in from their public presence and a short interview. Use when the user signs, onboards or adds a new client, wants a client folder created, or wants an existing client's empty memory or brand guide filled in.
---

# Add a client

Each client in an DalboOS workspace has a folder under `clients/`. When Claude Code is opened inside that folder, the client's memory and brand guide are loaded into the conversation, so every caption, page and report for them starts from the right facts and the right voice.

This skill creates the folder and fills it in. The quality of everything produced for the client later depends on this step, so prefer the client's real words and real assets over tidy summaries.

## 1. Find the workspace

Look for `agency/profile.md` in the current folder and the folders above it. That folder is the workspace root. If there is none, tell the user to run `/dalboos:setup` first and stop.

## 2. Name the folder

Ask for the client's business name. Make a slug from it: lowercase, words joined by hyphens, no accents or punctuation (`Acme Plumbing & Gas` becomes `acme-plumbing-gas`). If `clients/<slug>/` exists, say so and ask whether to fill in what is missing there or pick a different name.

Copy this skill's `templates/client/` folder to `clients/<slug>/`, keeping the layout. Never replace a file that already exists.

## 3. Gather what is public, with permission

Ask the user for the client's website, Google Business Profile and social handles, and whether you may read them. If they agree and you have a way to fetch web pages, read those pages and note:

- What the business sells and the areas it serves.
- How it describes itself, in its own words. Copy two or three sentences exactly: they are voice samples.
- Colours, fonts and logo use that are visible on the site.
- Opening hours, phone, address, and review themes if shown.

Treat this as a draft to confirm with the user, not as fact. Websites are often out of date. If you cannot fetch pages in this session, skip this step and ask the questions directly.

## 4. Interview the user

Show what you found first, so the user corrects and adds instead of starting from nothing. Ask in batches of two or three questions and skip what is already answered.

**Business** (`memory/business.md`)
- What they sell, and which service or product makes them the most money.
- Where they operate: suburbs, city or region, and country. Record the locale (`en-AU` or `en-US`) and currency.
- Who their customers are and what makes those customers pick up the phone.
- Their main competitors.
- Contact details to use in content: phone, booking link, address.
- For Australian businesses, the ABN if the user has it; for US businesses, the state. Also any licence numbers or wording the client is required to show in their advertising. Record what the user tells you and do not add legal requirements of your own.

**Voice** (`memory/voice.md`)
- Two or three real samples: captions, replies to reviews, a paragraph from the site. Paste them word for word.
- Words and phrases they always use, and ones they never want used.
- How formal, how playful, whether they use emoji.

**Focus** (`memory/focus.md`)
- What the agency has been hired to do for them, and what is included each month.
- The result the client cares about (calls, bookings, foot traffic, followers) and how it will be measured.
- Approval process: who signs off, and how long it usually takes.
- Dates that matter: launch, seasonal peaks, contract review.

**Brand** (`brand/brand-guide.md`)
- Colours as hex codes. If the user only has a logo file or a website, offer to read the colours from it and confirm them.
- Fonts for headings and body text.
- Where the logo files are. Ask the user to drop them into `brand/` and record the file names.
- Photography and video style: real photos or stock, people or product, light or moody.
- Things that must never appear.

## 5. Write the files

Fill in the four files under the headings already in each template. Remove the HTML comment at the top of a file once it has real content. Leave a field empty when it was not answered, and list the gaps for the user at the end so they can ask the client. Set `Last reviewed` in `focus.md` to today's date.

Mark anything taken from the website and not confirmed by the user with `(from website, unconfirmed)`.

## 6. Confirm

Show a one-line summary per file and the list of gaps. Then tell the user to open Claude Code in `clients/<slug>/` when working for this client, so their memory loads on its own.
