---
name: map-routines
description: Interview the user about the tasks they repeat for the agency or its clients, and turn the ones worth automating into their own custom skills saved in the workspace. Use when the user wants to automate a recurring task, says "I do this every week", asks to create a custom skill or workflow for their agency, or wants to map their routines or processes.
---

# Map routines into skills

The skills that ship with DalboOS cover common agency work. The ones that save the most time are usually specific to how one agency operates: its weekly client check-in, its invoice chase, its way of briefing an editor. This skill finds those and writes them down as skills the user owns.

## 1. Find the routines

Ask, a couple of questions at a time:

- What do you do every week or month that follows the same steps each time?
- Which of those do you put off, or get wrong when you are busy?
- What do you explain to Claude over and over?

For each candidate, get: what starts it, the steps, what "done" looks like, and what a good result looks like compared with a poor one. Ask for a real past example; it shows the standard better than a description.

## 2. Pick what is worth a skill

A routine is worth a skill when it recurs, takes more than a few minutes, and has steps or standards that Claude would not guess. Leave out:

- One-off tasks, and things Claude already does well when simply asked.
- Routines that an existing skill covers. Check the DalboOS skills and any other installed skill packs first, and suggest those instead.
- Anything that sends messages, spends money or publishes on its own. A skill can prepare those for the user to approve; it should not do them unattended.

Show the shortlist with one line each and agree which to build. Two or three good ones beat ten thin ones.

## 3. Write each skill

Save to `.claude/skills/<name>/SKILL.md` in the workspace root, so it is available in every client folder beneath it. Name: lowercase words joined by hyphens.

```markdown
---
name: weekly-client-checkin
description: <what it does, then when to use it, including the words the user would actually say>
---

# <Title>

<Two or three sentences: what this produces and why it matters.>

## Steps
<The steps, with the reason behind any that are not obvious.>

## What good looks like
<The standard, with the user's real example.>

## Output
<Where files are saved and what the user is shown.>
```

Guidance for writing it:

- **The description decides whether the skill is ever used.** Say what it does and when, in the user's own phrases.
- Explain the purpose and the judgement calls. Skip instructions Claude would follow anyway.
- Point to the workspace memory instead of repeating it: "use the active client's `memory/voice.md`".
- If the routine needs a calculation or a file conversion done the same way every time, put a small script in the skill's folder and have the skill run it.
- Keep it under about a page. If it is longer, it is probably two skills.

If a dedicated skill-authoring skill is installed (such as Anthropic's `skill-creator`), use it for anything complex and for testing the result.

## 4. Try it

Run each new skill once on a real case with the user and adjust it from what happens. Then list what was created and how to invoke each one.
