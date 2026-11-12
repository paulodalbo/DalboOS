// DalboOS hooks module.
//
// What it does, and nothing else:
//   1. On each prompt, finds the DalboOS workspace the session is in and
//      adds the agency's memory (and the active client's, when the session is
//      inside clients/<slug>/) for Claude to read. It is sent once per
//      conversation, and again only when one of the files changes.
//   2. Adds /dalbo-status, which shows what was found.
//   3. Inside a workspace, asks the user before Claude runs a git command
//      that can discard work (push --force, reset --hard, clean -f, ...).
//      Turn it off with the plugin's guardGit option.
//
// It reads files under the workspace only. It writes nothing and makes no
// network calls.

import {
  AGENCY_FILES,
  CLIENT_FILES,
  MARKER,
  activeClient,
  candidates,
  compose,
  normalize,
} from './memory.js'

async function exists($, path) {
  try {
    return Boolean(await $.fs.exists(path))
  } catch {
    return false
  }
}

async function read($, path) {
  try {
    if (!(await exists($, path))) return ''
    const value = await $.fs.read(path)
    return typeof value === 'string' ? value : ''
  } catch {
    return ''
  }
}

async function listClients($, root) {
  try {
    const entries = await $.fs.list(root + '/clients')
    return (Array.isArray(entries) ? entries : [])
      .filter((entry) => entry && entry.kind !== 'file')
      .map((entry) => String(entry.name))
      .filter((name) => name && !name.startsWith('.') && !name.startsWith('_'))
      .sort()
  } catch {
    return []
  }
}

/** Reads the workspace the session is in, or null when it isn't in one. */
async function loadWorkspace($) {
  const cwd = normalize(await $.session.cwd())
  if (!cwd) return null

  let root = null
  for (const dir of candidates(cwd)) {
    if (await exists($, dir + '/' + MARKER)) {
      root = dir
      break
    }
  }
  if (!root) return null

  const client = activeClient(root, cwd)
  const agency = []
  for (const f of AGENCY_FILES) agency.push({ ...f, text: await read($, root + '/' + f.path) })

  const clientFiles = []
  if (client) {
    for (const f of CLIENT_FILES) {
      clientFiles.push({ ...f, text: await read($, root + '/clients/' + client + '/' + f.path) })
    }
  }

  return { root, client, clients: await listClients($, root), agency, clientFiles }
}

// Git commands that throw work away or rewrite shared history.
const DESTRUCTIVE_GIT = [
  /\bgit\s+push\b[^|;&]*\s(--force(?!-with-lease)\b|-f\b|--force-with-lease\b|--mirror\b|--delete\b)/,
  /\bgit\s+reset\b[^|;&]*\s--hard\b/,
  /\bgit\s+clean\b[^|;&]*\s-[a-zA-Z]*f/,
  /\bgit\s+checkout\b[^|;&]*\s(--\s+\.|\.)(\s|$)/,
  /\bgit\s+restore\b[^|;&]*\s\.(\s|$)/,
  /\bgit\s+branch\b[^|;&]*\s-D\b/,
  /\bgit\s+stash\s+(drop|clear)\b/,
  /\bgit\s+(filter-branch|filter-repo)\b/,
  /\bgit\s+rebase\b/,
]

/** Whether a shell command contains a git operation that can destroy work. */
export function isDestructiveGit(command) {
  const text = String(command ?? '')
  return DESTRUCTIVE_GIT.some((pattern) => pattern.test(text))
}

export function register(on, options = {}) {
  // The text last sent to Claude in this conversation. Null means nothing yet.
  let lastSent = null

  // Inside a workspace, a git command that can destroy work waits for the user.
  if (options.guardGit !== false) {
    on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
      if (!isDestructiveGit(e.command)) return next(e)
      let inWorkspace = false
      try {
        inWorkspace = Boolean(await loadWorkspace($))
      } catch {
        inWorkspace = false
      }
      if (!inWorkspace) return next(e)

      let answer = 'Cancel'
      try {
        answer = await $.ui.ask(
          'This git command can permanently discard work in your agency workspace. Run it?\n' + e.command,
          ['Run it', 'Cancel'],
        )
      } catch {
        // Dismissed, or nobody is there to ask: leave it cancelled.
      }
      if (answer !== 'Run it') {
        return {
          deny:
            'The user did not approve this git command, so it was not run. ' +
            'Explain what it would have discarded and offer a way that keeps the work, such as a new commit or branch.',
        }
      }
      return next(e)
    })
  }

  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({
        name: 'dalbo-status',
        description: 'Show the DalboOS workspace, the active client and which memory files are filled in',
      })
    } catch {
      // The name is taken or commands are unavailable: the memory still loads.
    }
    return next(e)
  })

  // /clear, /resume and /branch start a conversation that hasn't read the memory.
  on('session.end', async ($, e, next) => {
    lastSent = null
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    let composed = null
    try {
      const ws = await loadWorkspace($)
      if (ws) composed = compose(ws)
    } catch {
      composed = null
    }
    if (!composed || composed.text === lastSent) return next(e)

    const isUpdate = lastSent !== null
    lastSent = composed.text
    try {
      await $.ui.log((isUpdate ? 're' : '') + composed.summary)
    } catch {
      // A missing log line is not worth failing the prompt for.
    }
    const note = isUpdate
      ? 'The DalboOS memory files changed since they were last read. This is the current version, and it replaces the earlier one.\n\n'
      : ''
    return next({ ...e, context: [...(e.context ?? []), note + composed.text] })
  })

  on('command.run', { command: 'dalbo-status' }, async ($) => {
    let ws = null
    try {
      ws = await loadWorkspace($)
    } catch {
      ws = null
    }
    if (!ws) {
      return {
        text:
          'This folder is not inside an DalboOS workspace. ' +
          'Run /dalboos:setup in the folder you want to use for your agency.',
      }
    }
    const { missing } = compose(ws)
    const lines = [
      'Workspace: ' + ws.root,
      'Active client: ' + (ws.client ?? 'none (session is at the workspace level)'),
      'Clients: ' + (ws.clients.length ? ws.clients.join(', ') : 'none yet'),
      'Still templates: ' + (missing.length ? missing.join(', ') : 'none, every memory file is filled in'),
    ]
    return { text: lines.join('\n') }
  })
}
