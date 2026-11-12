# Clients

One folder per client, created with `/dalboos:new-client`.

```
clients/<client-name>/
  memory/business.md     what they sell, to whom, where
  memory/voice.md        how they sound
  memory/focus.md        what the current work is for
  brand/brand-guide.md   colours, fonts, logo, imagery
  content/               posts, scripts, captions, pages
  reports/               monthly reports
  leads/                 prospecting and proposals
```

Open Claude Code inside a client's folder and that client's memory is loaded for the conversation. Folders whose names start with `_` or `.` are ignored, so `_archive/` is a good place for past clients.
