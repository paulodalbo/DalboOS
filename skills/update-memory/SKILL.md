---
name: update-memory
description: Review an DalboOS workspace's memory files against what has changed and update them with the user's agreement, for the agency or the active client. Use when the user says something in memory is out of date, a client changed services, prices, goals or voice, a focus needs its monthly review, or asks to "update memory", "refresh the client file" or "save that for next time".
---

# Update memory

Memory files are read at the start of every conversation, so a stale line misleads all future work. This skill brings them up to date. It changes only what the user confirms.

## 1. Find what changed

Scope is the active client when the session is inside `clients/<slug>/`, otherwise the agency. Read the memory files in scope, then gather candidates for change from:

- **This conversation**: corrections the user made ("they don't do gas fitting any more", "less formal than that").
- **Recent work** under `content/`, `reports/` and `leads/`: a new service being advertised, a different call to action, a goal that has been met.
- **`focus.md`**: a `Last reviewed` date over 30 days old, dates that have passed, a goal that no longer matches the work.
- **Empty fields** that the conversation has since answered.

## 2. Propose, then ask

List each proposed change as: the file, the current line, the new line, and where the new information came from. Group by file. Include removals: a line that is no longer true should go, not gather qualifiers.

Ask the user which to apply. Things you inferred from files, and not from the user's own words, need an explicit yes.

## 3. Apply

- Edit the specific lines; do not rewrite or reorganise the file.
- Keep each file short. If a file is growing past a page, suggest what to cut: old decisions, superseded goals, detail that belongs in a work file instead.
- When a fact changes, replace it. Keep the old value only if the history matters ("moved from Southport to Labrador in Oct 2026").
- Voice changes are best recorded as a new sample pasted word for word, plus one line saying what changed.
- Update `Last reviewed` in `focus.md` to today's date whenever the focus was reviewed, even if nothing changed.

## What does not go in memory

- Guesses, research findings and suggestions that the user has not confirmed.
- Passwords, API keys, card or bank details. Keys go in `.env`; the rest stays out of the workspace.
- One client's details in another client's files.
- Personal information about the client's customers.

## 4. Confirm

Show the applied changes in a few lines. In Claude Code the updated files are sent to the model again with the next prompt, so nothing else is needed.
