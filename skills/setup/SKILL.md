---
name: setup
description: Turn a folder into an DalboOS workspace and fill in the agency's own memory by interview. Use when the user wants to set up or install DalboOS in a folder, start a new agency workspace, or says the agency profile, voice or focus is empty or needs redoing from scratch.
---

# Set up an DalboOS workspace

An DalboOS workspace is a folder that holds what Claude should always know about a marketing agency and each of its clients. This skill creates the folder structure and fills in the agency's own three memory files by interviewing the user. Client folders are created later with the `new-client` skill.

The memory files are loaded into every future conversation, so everything written to them must be something the user actually said. A blank field is better than a guess, because a guess gets repeated as fact for months.

## 1. Check the folder

Look for `agency/profile.md` in the current folder and the folders above it.

- **Found, and filled in:** this is already a workspace. Tell the user, and ask whether they want to update specific answers instead. Do not overwrite existing memory files.
- **Found, but still a template:** skip to step 3.
- **Not found:** confirm with the user that the current folder is where the workspace should live, then continue. If the folder already holds unrelated files, say so and ask before adding to it.

## 2. Create the structure

Copy the contents of this skill's `templates/` folder into the workspace root, keeping the layout. Never replace a file that already exists.

```
agency/
  profile.md     who the agency is, what it sells, who it serves
  voice.md       how the agency writes
  focus.md       what matters this quarter
clients/         one folder per client (created by new-client)
.gitignore       keeps keys and credentials out of git
.env.example     the API keys some skills use; copy to .env and fill in what you need
```

## 3. Interview the user

Ask in small batches of two or three questions, in plain language, and wait for the answers before moving on. If the session offers a tool for multiple-choice questions, use it where the answer is one of a few options (market, pricing model) and plain questions for everything else. Skip anything the user has already told you in this conversation.

**The agency**
- Business name, and the name of the person you are talking to.
- Where it is based, and which markets it serves (for example Gold Coast and Brisbane, all of Australia, the US). This sets the default spelling, currency and date format.
- What it sells: each service or package, what is included, and the price or price range if they are happy to record it.
- Who the ideal client is: industry, size, location, and what usually makes them buy.
- What sets the agency apart from the others those clients could hire.
- The tools it works with (design, video, AI tools, scheduling, ads platforms, CRM).

**The voice**
- Ask for two or three real samples of their writing: a recent caption, an email to a client, a proposal paragraph. Samples beat adjectives. If they have none handy, ask how they would describe their tone and which words or phrases they never use.
- From the samples, note sentence length, formality, humour, emoji use, and spelling locale. Read your summary back and let them correct it.

**The focus**
- The one outcome that matters most in the next 90 days.
- The current bottleneck.
- Anything they have decided not to do right now.

## 4. Write the files

Fill in `agency/profile.md`, `agency/voice.md` and `agency/focus.md`, following the headings already in each template. Remove the HTML comment at the top of a file once it has real content. Leave a field empty when the user did not answer it. Set `Last reviewed` in `focus.md` to today's date.

Paste the voice samples into `voice.md` word for word under "Samples". They are the most useful thing in that file.

## 5. Confirm and point to what's next

Show a short summary of what was saved, one line per file, and ask if anything is wrong. Then tell the user:

- `/dalboos:new-client` adds a client, with their own memory and brand guide.
- `/dalbo-status` shows the workspace and which files are still empty.
- The other skills (prospecting, content, carousels, reports and more) work from this memory. Some need an API key in `.env`; `.env.example` lists them.
- Opening Claude Code inside `clients/<name>/` makes that client the active one for the conversation.
