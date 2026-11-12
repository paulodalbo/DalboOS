---
name: carousel
description: Create an Instagram or LinkedIn carousel in the active client's brand, from topic to finished PNG slides and caption. Use when the user asks for a carousel, swipe post, slide post, or wants a topic, article or video turned into carousel slides for a client or for the agency.
---

# Make a carousel

Produces the slides as images at the exact pixel size, in the client's colours and fonts, with a caption. A script in this skill does the layout and rendering, so the design is consistent from one carousel to the next and only the words are written fresh.

Work from the active client's `memory/voice.md`, `memory/business.md` and `brand/brand-guide.md`. If the session is at the workspace root, ask which client this is for, or whether it is for the agency itself.

## 1. Settle the idea

A carousel earns the swipe when slide one makes a promise and each slide after it pays a little of it. Agree with the user:

- **Topic and angle**: one idea. "Three signs your hot water system is about to fail" works; "everything about plumbing" does not.
- **Who it is for** and what they should do at the end.
- **Size**: `portrait` (1080×1350, the default for the feed), `tall` (1080×1440), `square` (1080×1080) or `story` (1080×1920).

If the source is an article, video transcript or the client's own notes, take the facts from it and nothing else. Do not add statistics or claims that are not in the source or confirmed by the user.

## 2. Write the slides

Five to nine slides is the usual range. Instagram allows up to 20.

- **Slide 1, cover**: the hook, under ten words. A specific promise or a surprising true statement.
- **Middle slides**: one point each. A short title and one or two sentences. If a slide needs a third sentence, it is two slides.
- **Last slide, call to action**: one action, matching the client's goal in `memory/focus.md` (call, book, save, follow).

The script enforces length limits because long text becomes unreadable on a phone: title 70 characters, body 220, kicker 40. Write in the client's voice and spelling.

Save `slides.json` under the client's `content/<month or campaign>/<carousel-name>/`:

```json
{
  "title": "Three signs your hot water system is failing",
  "locale": "en-AU",
  "size": "portrait",
  "brand": {
    "primary": "#0f62fe", "onPrimary": "#ffffff",
    "background": "#ffffff", "text": "#14171a",
    "headingFont": "Inter", "bodyFont": "Inter",
    "handle": "@acmeplumbing"
  },
  "slides": [
    { "kicker": "Hot water", "title": "3 signs your system is about to quit" },
    { "title": "Rusty water", "body": "Brown or orange water from the hot tap usually means the tank is corroding from the inside." },
    { "title": "Seen one of these?", "body": "Call us before it becomes a cold shower. 07 5555 0100" }
  ]
}
```

Take colours and fonts from the brand guide. `onPrimary` is the text colour on the cover and final slide, so it must be readable on `primary`. A font only renders if it is installed on the computer; otherwise the system font is used, so say which one was used.

## 3. Render

```bash
node <skill folder>/scripts/render.mjs --slides <folder>/slides.json --out <folder>
```

In Claude Code the skill folder is `${CLAUDE_SKILL_DIR}`. This writes `slides.html` with every slide on one page, and `slide-01.png` onward when Playwright is installed. Without Playwright the script prints the install command; the user can still review `slides.html` in a browser.

Look at the result. If text is cramped or a slide looks empty, edit the JSON and render again.

## 4. Write the caption

Save `caption.md` next to the slides:

- First line restates the hook, because it shows before "more".
- Two to four short lines of context.
- The same call to action as the last slide.
- Three to five specific hashtags, including a local one where it fits. Skip generic ones.

## 5. Hand over

Tell the user where the files are and show the caption. This skill does not post anything: publishing to the client's account is the user's step, after the client has approved.
