---
name: content-pack
description: Plan and write a client's month of social content in one pass (calendar, short-video scripts with shot lists, image and video prompts for AI tools, captions and hashtags) in the client's voice and brand. Use when the user asks for a content plan, content calendar, monthly content, a batch of posts, Reels or TikTok scripts, video ideas, or "this month's content" for a client.
---

# Monthly content pack

Produces everything needed to film, generate and schedule a client's month: what goes out on which day, the script for each video, the prompts for any generated visuals, and the captions. It is built from the client's memory, so the content is about their actual services, customers and area.

Work from the active client's `memory/business.md`, `memory/voice.md`, `memory/focus.md` and `brand/brand-guide.md`. If no client is active, ask which one.

## 1. Set the brief

Confirm with the user, taking defaults from `memory/focus.md`:

- **Month**, and how many pieces of each format the package includes (for example eight short videos, four carousels, eight stories).
- **Platforms**: Instagram, TikTok, Facebook, YouTube Shorts, LinkedIn.
- **The goal for the month** and any dates to build around: promotions, seasonal demand, local events, public holidays in the client's country and state.
- **What can be filmed**: on-site access, who is willing to be on camera, and whether AI-generated visuals are acceptable to this client.

Look at what was made in previous months under `content/` so topics are not repeated.

## 2. Choose the topics

Mix content types so the month is not one note. A workable split for a local business:

- **Proof**: a job done, a before and after, a customer's words (with their permission).
- **Help**: one useful answer to a question customers actually ask.
- **People**: the owner, the team, how the work is done.
- **Offer**: what to buy and how, tied to the month's goal. Roughly one piece in four.

Each topic needs a reason a local customer would stop for it. List the topics with one line each and get the user's agreement before writing everything.

## 3. Write the pieces

For each **short video** (15 to 45 seconds unless told otherwise):

- **Hook**: the first two seconds, as on-screen text and as spoken line. Specific beats clever.
- **Script**: spoken lines in the client's voice, written to be said aloud. Short sentences.
- **Shot list**: numbered shots with what is on screen and roughly how long. Things a person with a phone can film.
- **On-screen text** and the **call to action**.
- **Generated visuals**, only if the client accepts them: a prompt per shot that names subject, setting, lighting, camera movement, aspect ratio (9:16) and duration, written so it can be pasted into the user's video or image tool. Keep the brand's colours and style from the brand guide. No real people's likenesses and no other brands' logos or characters.

For each **carousel**, write the outline here and use the `carousel` skill to produce the slides.

For each **caption**: first line that works before the "more" cut, a few short lines, one call to action, three to five specific hashtags including a local one. Spelling follows the client's locale.

Facts stay true: prices, guarantees, licence claims and statistics come from the client's memory or the user. If a script needs a fact you do not have, mark it `[CONFIRM: ...]` instead of inventing it.

## 4. Lay out the calendar

Spread formats across the weeks, avoid two offers in a row, and put the pieces tied to dates on those dates. Suggest posting days; do not claim a best time to post unless the user has the account's own data.

## 5. Save

Under the client's `content/<YYYY-MM>/`:

- `calendar.md`: a table of date, platform, format, topic, status.
- `videos/NN-<slug>.md`: one file per video with hook, script, shot list, on-screen text, prompts and caption.
- `captions.md`: every caption in date order, ready to paste.
- `shoot-list.md`: all shots grouped by location, so filming can be done in one visit.

## 6. Hand over

Give the user a summary: how many pieces of each format, the items marked `[CONFIRM]`, and what the client needs to approve. Nothing is published by this skill.
