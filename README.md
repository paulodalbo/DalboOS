# DalboOS

The operating kit for marketing agencies using Claude Code.

DalboOS is a Claude Code plugin for agencies and freelancers who do marketing for local businesses. It gives every client a folder holding their business facts, their voice, the current focus and their brand guide, and loads the right one into Claude at the start of each conversation. On top of that memory sit fifteen skills for the work an agency repeats: finding leads, pitching them, producing the month's content and reporting on it.

It is written in English for the Australian and US markets. Each client records a locale, and spelling, currency, paper size and date format follow it.

> **Status: 0.2.0.** Everything here is tested with automated tests. It has not yet had long use in real client work, so expect rough edges and please report them.

## What you get

**Memory that loads itself.** Open Claude Code inside `clients/acme-plumbing/` and Claude reads that client's business, voice, focus and brand guide with your first prompt. Open it at the workspace root and it reads the agency's own profile and the list of clients. Edit a memory file mid-session and the new version is sent with your next prompt.

**One client at a time.** Only the active client's memory is loaded. Another client's details are never added to the conversation.

**A brake on destructive git commands.** Inside a workspace, `git push --force`, `git reset --hard`, `git clean -f` and similar wait for your confirmation.

**Scripts included.** Where a skill needs code (rendering slides, building a proposal, adding up ad spend), the script ships inside the skill and is tested. Nothing is written on the spot, so results are the same every time.

## Skills

Type `/dalboos:` in Claude Code to see them.

### Run the workspace

| Skill | What it does |
| :- | :- |
| `setup` | Turns a folder into a workspace and fills in the agency's profile, voice and focus by interview |
| `new-client` | Adds a client folder and fills in their memory and brand guide from their public pages and a short interview |
| `brief` | A five-line start-of-session brief for the agency or the active client, with what is out of date |
| `update-memory` | Proposes updates to memory from what changed, and applies the ones you approve |
| `save` | Commits the workspace to git and pushes to a private remote, explained for people who don't use git |
| `map-routines` | Turns the tasks you repeat into your own custom skills |

### Win clients

| Skill | What it does | Needs |
| :- | :- | :- |
| `prospect` | Niche and location in; a ranked list of real local businesses and drafted first-contact messages out | Google Places API key. Optional ABN Lookup GUID for Australia |
| `preview-site` | A one-page concept website for a lead, clearly labelled as a preview | Node |
| `proposal` | A proposal with scope, pricing, timeline and terms, as HTML and PDF | Node. Playwright for the PDF |

### Deliver the work

| Skill | What it does | Needs |
| :- | :- | :- |
| `content-pack` | A month of content: calendar, video scripts with shot lists, prompts for AI visuals, captions | |
| `carousel` | Instagram or LinkedIn carousel in the client's brand, as PNG slides with a caption | Node. Playwright for the PNGs |
| `review-replies` | Replies to Google reviews and Google Business Profile posts in the client's voice | |
| `local-seo` | Local search audit: Business Profile, site basics, area pages, citations, AI assistants | Web access helps |
| `google-ads-local` | A local search campaign: structure, keywords, negatives and ads within character limits, as import files | |
| `monthly-report` | The client's monthly report with computed numbers and change against last month | Node, and ad exports or connected accounts |

The command `/dalbo-status` shows the workspace, the active client and which memory files are still empty templates.

## Install

In a Claude Code session:

```
/plugin marketplace add paulodalbo/DalboOS
/plugin install dalboos@dalboos
```

DalboOS includes a mod (code that runs inside Claude Code), so it needs a recent Claude Code; it was built and tested on 2.1.322.

To try a local copy without installing it:

```bash
claude --plugin-dir /path/to/DalboOS
```

### What the skills need

- **Node 20 or later** for the bundled scripts. The memory loading itself needs nothing.
- **Playwright**, only for PNG slides and PDF proposals. In your workspace folder: `npm install playwright && npx playwright install chromium`. Without it, those skills still produce HTML you can open and print.
- **API keys**, only for prospecting. `setup` puts a `.env.example` in your workspace listing them. Google bills Places API searches; check Google's current pricing before large runs.

## Get started

1. Make a folder for your agency and open Claude Code in it.
2. Run `/dalboos:setup` and answer the questions. It takes about five minutes.
3. Run `/dalboos:new-client` for each client.
4. When you work for a client, open Claude Code in `clients/<client-name>/` and ask for what you need.

## How a workspace is laid out

```
your-agency/
  agency/
    profile.md            who the agency is, what it sells, who it serves
    voice.md              how the agency writes
    focus.md              what matters this quarter
  clients/
    acme-plumbing/
      memory/business.md  what they sell, to whom, where
      memory/voice.md     how they sound
      memory/focus.md     what the current work is for
      brand/brand-guide.md
      content/  reports/  leads/
  leads/                  the agency's own prospecting
  .env                    your API keys (never committed)
```

Everything is a plain file on your computer. You can read it, edit it by hand and keep it in a **private** git repository. Folders under `clients/` whose names start with `_` or `.` are ignored, so `clients/_archive/` works for past clients.

## What the plugin does inside Claude Code

The code is in [`hooks/register.js`](hooks/register.js) and [`hooks/memory.js`](hooks/memory.js), about 350 lines in total.

- On each prompt, it looks for `agency/profile.md` in the current folder and up to eleven folders above it. If it finds one, it reads the memory files and adds them for Claude to read. This happens once per conversation, and again only when a file's content changes.
- Files that are still untouched templates are not loaded. Claude is told which ones they are.
- Each file is cut at 6,000 characters. Keep memory files short: they are read in every conversation.
- It registers `/dalbo-status`.
- Inside a workspace, it holds destructive git commands until you confirm. Turn this off with the plugin's `guardGit` option in `/plugin`.

The mod only reads files inside the workspace. It writes nothing, makes no network calls and collects nothing. Outside a workspace it does nothing at all.

The scripts inside the skills run only when a skill runs them. Two of them call outside services, both in `prospect`: Google's Places API and the Australian Business Register.

## What it deliberately does not do

- **Post to social accounts or launch ads.** Every skill stops at files for you to review. Publishing to a client's live account stays a human step.
- **Scrape Google Maps.** Prospecting uses Google's official API.
- **Write fake reviews or testimonials**, or preview sites that could pass as a business's real site.
- **Promise results.** Proposals and reports describe work and measured numbers.

## Recommended companions

DalboOS covers who the client is and the local-business workflows. For depth in general SEO, paid media audits and copywriting, these are well maintained and pair well with it:

- [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills): copywriting, conversion, SEO and ads skills
- [AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo): full SEO audits, including technical and AI search
- [AgriciDaniel/claude-ads](https://github.com/AgriciDaniel/claude-ads): paid media audits for Google, Meta and others
- Anthropic's `marketing` plugin, in the `knowledge-work-plugins` marketplace
- Anthropic's `skill-creator`, for building and testing your own skills

Follow each project's own install instructions. With DalboOS loaded, their output starts from the client's real facts and voice.

## Using the skills outside Claude Code

The skills follow the [Agent Skills](https://agentskills.io) format and keep their scripts and templates inside their own folders, so they can be copied into any agent that reads `SKILL.md` files. The automatic memory loading and the git guard are the mod, which is specific to Claude Code; elsewhere, ask the agent to read the client's `memory/` and `brand/` files at the start of the session.

## Development

```bash
node scripts/check-skills.mjs            # skill frontmatter, templates, manifests
node --test tests/node/scripts.test.mjs  # the scripts inside the skills
claude plugin validate .                 # manifest, marketplace and hooks module
claude plugin test .                     # the mod
```

Bump `version` in `.claude-plugin/plugin.json` and add an entry to `CHANGELOG.md` with every change users should receive.

## License

[MIT](LICENSE)
