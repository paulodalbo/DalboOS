// Pure helpers for finding an DalboOS workspace and turning its memory
// files into the text Claude reads. No Claude Code APIs in this file, so it
// can be unit tested on its own.

/** Longest slice of one memory file that is sent to Claude. */
export const MAX_FILE_CHARS = 6000

/** Memory files that describe the agency itself, relative to the workspace root. */
export const AGENCY_FILES = [
  { label: 'Agency profile', path: 'agency/profile.md' },
  { label: 'Agency voice', path: 'agency/voice.md' },
  { label: 'Agency focus', path: 'agency/focus.md' },
]

/** Memory files that describe one client, relative to clients/<slug>/. */
export const CLIENT_FILES = [
  { label: 'Business', path: 'memory/business.md' },
  { label: 'Voice', path: 'memory/voice.md' },
  { label: 'Current focus', path: 'memory/focus.md' },
  { label: 'Brand guide', path: 'brand/brand-guide.md' },
]

/** The file whose presence marks a folder as a workspace root. */
export const MARKER = 'agency/profile.md'

/** Forward slashes, no trailing slash, so Windows and POSIX paths compare alike. */
export function normalize(path) {
  return String(path ?? '').replace(/\\/g, '/').replace(/\/+$/, '')
}

/** The parent directory, or '' once there is nothing above. */
export function parentOf(path) {
  const p = normalize(path)
  const i = p.lastIndexOf('/')
  return i <= 0 ? '' : p.slice(0, i)
}

/** cwd and each directory above it, nearest first, at most `limit` entries. */
export function candidates(cwd, limit = 12) {
  const out = []
  for (let dir = normalize(cwd); dir && out.length < limit; dir = parentOf(dir)) out.push(dir)
  return out
}

/** The client slug when cwd is inside <root>/clients/<slug>, otherwise null. */
export function activeClient(root, cwd) {
  const r = normalize(root)
  const c = normalize(cwd)
  if (!c.startsWith(r + '/')) return null
  const match = /^\/clients\/([^/]+)/.exec(c.slice(r.length))
  if (!match) return null
  const slug = match[1]
  return slug.startsWith('.') || slug.startsWith('_') ? null : slug
}

/**
 * Whether a memory file holds real content, as opposed to an untouched
 * template. Headings, HTML comments and bare "**Label:**" lines don't count.
 */
export function isFilled(text) {
  const body = String(text ?? '').replace(/<!--[\s\S]*?-->/g, '')
  let lines = 0
  for (const raw of body.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#') || line.startsWith('>')) continue
    const rest = line
      .replace(/^[-*]\s*/, '')
      .replace(/^\*\*[^*]+\*\*:?\s*/, '')
      .replace(/^[A-Za-z][A-Za-z /&-]{0,40}:\s*/, '')
    if (rest.length >= 3) lines += 1
  }
  return lines >= 2
}

/** One file as a labelled block, cut at MAX_FILE_CHARS. */
export function block(label, text) {
  const clean = String(text).replace(/<!--[\s\S]*?-->/g, '').trim()
  const cut = clean.length > MAX_FILE_CHARS
    ? clean.slice(0, MAX_FILE_CHARS) + '\n[cut here: open the file for the rest]'
    : clean
  return '### ' + label + '\n' + cut
}

/**
 * Builds the text Claude reads.
 * @param {{ root: string, client: string|null, clients: string[],
 *   agency: {label:string,path:string,text:string}[],
 *   clientFiles: {label:string,path:string,text:string}[] }} ws
 * @returns {{ text: string, summary: string, missing: string[] }}
 */
export function compose(ws) {
  const parts = []
  const missing = []

  parts.push(
    'This folder is an DalboOS workspace at ' + ws.root + '. ' +
    'The notes below are the saved memory for it. They were written by the user and are the ' +
    'source of truth about the agency and its clients, so they take priority over assumptions.',
  )

  const agencyBlocks = []
  for (const f of ws.agency) {
    if (isFilled(f.text)) agencyBlocks.push(block(f.label, f.text))
    else missing.push(f.path)
  }
  if (agencyBlocks.length) parts.push('## The agency\n\n' + agencyBlocks.join('\n\n'))

  if (ws.client) {
    const base = 'clients/' + ws.client + '/'
    const clientBlocks = []
    for (const f of ws.clientFiles) {
      if (isFilled(f.text)) clientBlocks.push(block(f.label, f.text))
      else missing.push(base + f.path)
    }
    parts.push(
      '## Active client: ' + ws.client + '\n\n' +
      'The session is running inside ' + base + ', so the work in this conversation is for this client. ' +
      'Deliverables for them follow their voice and brand guide, not the agency\'s.' +
      (clientBlocks.length ? '\n\n' + clientBlocks.join('\n\n') : ''),
    )
  } else if (ws.clients.length) {
    parts.push(
      '## Clients\n\n' +
      'No client is active because the session is at the workspace root. Client folders: ' +
      ws.clients.join(', ') + '. Each client\'s memory is in clients/<slug>/memory/ and ' +
      'clients/<slug>/brand/; reading those files comes before writing anything for that client.',
    )
  }

  if (missing.length) {
    parts.push(
      '## Not filled in yet\n\n' + missing.join(', ') + '. ' +
      'These files are still templates. The dalboos setup and new-client skills fill them in by interview.',
    )
  }

  parts.push(
    '## How this workspace is run\n\n' +
    '- Work for a client is saved under clients/<slug>/ (content/, reports/, leads/), never at the workspace root.\n' +
    '- Each client\'s details are confidential to that client. Facts, numbers and copy from one client\'s folder do not go into another client\'s deliverables.\n' +
    '- Spelling, currency and date format follow the locale recorded for the client (for example en-AU or en-US).\n' +
    '- When the user corrects a fact, a tone or a priority that these files record, the matching file is out of date: offer to update it, and edit it once they agree.\n' +
    '- Memory files record what the user said. Guesses and research findings stay out of them unless the user confirms them.',
  )

  const filled = ws.agency.length + (ws.client ? ws.clientFiles.length : 0) - missing.length
  const summary = ws.client
    ? 'loaded memory for client ' + ws.client + ' (' + filled + ' files)'
    : 'loaded agency memory (' + filled + ' files, ' + ws.clients.length + ' clients)'

  return { text: parts.join('\n\n'), summary, missing }
}
