# Changelog

## 0.2.0

- New skills: `prospect`, `preview-site`, `proposal`, `content-pack`, `carousel`, `review-replies`, `local-seo`, `google-ads-local`, `monthly-report`, `update-memory`, `save`, `map-routines`.
- Bundled scripts with tests: Places API lead search and scoring, ABN Lookup, preview site builder, proposal builder (HTML and PDF), carousel renderer (HTML and PNG), ad export summariser.
- Git guard: inside a workspace, destructive git commands wait for the user's confirmation. Option `guardGit`.
- `.env.example` in the workspace template.

## 0.1.0

First version.

- Mod that loads the agency's memory, and the active client's memory when the session is inside `clients/<slug>/`, once per conversation and again when a file changes.
- `/dalbo-status` command.
- Skills: `setup`, `new-client`, `brief`.
- Workspace and client templates.
