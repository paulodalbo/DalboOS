---
name: brief
description: Give a short start-of-session brief for an DalboOS workspace or the active client (who they are, the current focus, recent work, what is out of date) and ask what to work on. Use when the user opens a session with "brief me", "where were we", "catch me up", "what's the status of this client", or asks what to work on next in an agency workspace.
---

# Session brief

A brief gets the user and Claude onto the same page in under a minute. It is read once and acted on, so it is short and specific, and it ends with a question.

## 1. Work out the scope

Find the workspace root: the nearest folder at or above the current one that contains `agency/profile.md`. If there is none, say this folder is not an DalboOS workspace and suggest `/dalboos:setup`.

- **Inside `clients/<slug>/`:** the brief is about that client.
- **At the workspace root:** the brief is about the agency, with one line per client.

## 2. Read

For a client: `memory/business.md`, `memory/voice.md`, `memory/focus.md`, `brand/brand-guide.md`, then the five most recently changed files under `content/`, `reports/` and `leads/`.

For the agency: `agency/profile.md`, `agency/focus.md`, and each client's `memory/focus.md`.

If these files are already in the conversation, use what is there and only read what is missing.

## 3. Write the brief

Five lines at most, in the reply itself, not in a file.

For a client:

1. Who they are and what the agency does for them, in one sentence.
2. The goal and how it is measured.
3. The most recent work: what it was and when.
4. What is due or coming up, from the dates in `focus.md`.
5. Anything out of date or missing (see below).

For the agency: the 90-day outcome, the bottleneck, then one line per client with their goal and their most recent work.

Flag these, and only these, as out of date or missing:

- A memory file that is still an empty template.
- `Last reviewed` in a `focus.md` more than 30 days ago, or absent.
- A date in `focus.md` that has passed.
- No work saved for a client in the last 30 days.

Do not pad. If nothing is out of date, leave line 5 out.

## 4. Ask

End with one question: what the user wants to work on now. If something is flagged, offer to fix that first.
