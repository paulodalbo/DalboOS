---
name: save
description: Save the DalboOS workspace to git with a clear commit, and push it to a private remote when one is set up, explaining each step for people who do not use git. Use when the user says save, back up, commit, push, "save my work" or "sync to GitHub" in an agency workspace.
---

# Save the workspace

A workspace holds client information, so saving it is about two things: not losing work, and not publishing something private. This skill commits the changes and pushes them if a remote exists. It explains what it is doing in plain words, because many users here have never used git.

## 1. Check the state

Run `git status --short` in the workspace root.

- **Not a git repository:** explain in one sentence that git keeps a history of every change so nothing is lost, and ask whether to start one. If yes, run `git init` and continue.
- **Nothing changed:** say so and stop.

## 2. Look before saving

Read the list of changed files and check for things that must not be saved:

- `.env` files, keys, tokens, or files with `password`, `secret` or `credentials` in the name. The workspace `.gitignore` excludes the common ones; if one shows up anyway, do not add it. Tell the user and add it to `.gitignore`.
- Large media (raw video, design source files). Git handles these badly. Suggest keeping them in cloud storage and adding the folder to `.gitignore`.

Show the user a short summary of what will be saved, grouped by client folder.

## 3. Commit

Add the files by path, leaving out anything flagged above. Write a commit message that says what changed in plain words, with the client name first when the changes belong to one client:

```
acme-plumbing: November content pack and carousel
```

One commit for one client's work is easiest to find later. If changes span several clients, make one commit per client.

## 4. Push

Run `git remote -v`.

- **A remote exists:** push the current branch. If the push is rejected because the remote has newer commits, stop and explain; do not force it.
- **No remote:** tell the user the work is saved on this computer only. Offer to help connect a remote, and say plainly that **the repository must be private**, because it contains client details. If they create one on GitHub, check it is set to private before the first push.

Never use `--force`, never rewrite history, and never change a repository's visibility.

## 5. Confirm

One or two lines: what was saved, and whether it is also on the remote.
