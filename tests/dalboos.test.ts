import { expect, test } from 'claude-code/testing'
import { activeClient, candidates, compose, isFilled, parentOf } from '../hooks/memory.js'
import { isDestructiveGit } from '../hooks/register.js'

const FILLED = '# Profile\n\n- **Name:** Northside Media\n- **Location:** Gold Coast, QLD\n- **Services:** monthly video packages and websites\n'
const TEMPLATE = '# Profile\n\n<!-- Filled in by /dalboos:setup -->\n\n- **Name:**\n- **Location:**\n'

/** Stubs the file system from a map of absolute path to content. */
function stubFiles(on, cwd: string, files: Record<string, string>) {
  on('session.cwd', () => ({ value: cwd }))
  on('fs.exists', ($, e) => ({ value: Object.keys(files).some((p) => p === e.path) }))
  on('fs.read', ($, e) => ({ value: files[e.path] ?? '' }))
  on('fs.list', ($, e) => {
    const prefix = e.path + '/'
    const names = new Set<string>()
    for (const p of Object.keys(files)) {
      if (p.startsWith(prefix)) names.add(p.slice(prefix.length).split('/')[0])
    }
    return { value: [...names].map((name) => ({ name, kind: 'directory', size: 0, isLink: false })) }
  })
  on('ui.log', () => ({ value: undefined }))
}

test('path helpers handle POSIX and Windows paths', async () => {
  expect(parentOf('/work/agency')).toBe('/work')
  expect(parentOf('C:\\work\\agency\\')).toBe('C:/work')
  expect(candidates('/a/b/c')).toEqual(['/a/b/c', '/a/b', '/a'])
  expect(activeClient('/work', '/work/clients/acme-plumbing/content')).toBe('acme-plumbing')
  expect(activeClient('C:\\work', 'C:\\work\\clients\\acme')).toBe('acme')
  expect(activeClient('/work', '/work')).toBe(null)
  expect(activeClient('/work', '/work/clients')).toBe(null)
  expect(activeClient('/work', '/workshop/clients/acme')).toBe(null)
})

test('an untouched template does not count as filled', async () => {
  expect(isFilled(TEMPLATE)).toBe(false)
  expect(isFilled(FILLED)).toBe(true)
  expect(isFilled('')).toBe(false)
})

test('compose reports template files and keeps them out of the text', async () => {
  const out = compose({
    root: '/work',
    client: null,
    clients: ['acme'],
    agency: [
      { label: 'Agency profile', path: 'agency/profile.md', text: FILLED },
      { label: 'Agency voice', path: 'agency/voice.md', text: TEMPLATE },
    ],
    clientFiles: [],
  })
  expect(out.text).toContain('Northside Media')
  expect(out.missing).toEqual(['agency/voice.md'])
  expect(out.text).toContain('Client folders: acme')
})

test('the first prompt in a client folder carries that client\'s memory', async ($, on) => {
  stubFiles(on, '/work/clients/acme/content', {
    '/work/agency/profile.md': FILLED,
    '/work/clients/acme/memory/business.md': '# Business\n\n- **Name:** Acme Plumbing\n- **Suburb:** Southport\n- **Locale:** en-AU\n',
    '/work/clients/zen-yoga/memory/business.md': '# Business\n\n- **Name:** Zen Yoga\n- **Suburb:** Burleigh\n',
  })
  const seen: unknown[] = []
  on('prompt.submit', ($, e) => {
    seen.push(e.context)
    return { text: e.text }
  })

  await $.prompt.submit({ text: 'write three captions' })
  const context = (seen[0] as string[]).join('\n')
  expect(context).toContain('Active client: acme')
  expect(context).toContain('Acme Plumbing')
  expect(context).toContain('Northside Media')
  // Another client's details never ride along
  expect(context).not.toContain('Zen Yoga')
})

test('memory is sent once, then again only when a file changes', async ($, on) => {
  const files: Record<string, string> = { '/work/agency/profile.md': FILLED }
  stubFiles(on, '/work', files)
  const seen: unknown[] = []
  on('prompt.submit', ($, e) => {
    seen.push(e.context)
    return { text: e.text }
  })

  await $.prompt.submit({ text: 'one' })
  await $.prompt.submit({ text: 'two' })
  expect(Array.isArray(seen[0])).toBe(true)
  expect(seen[1]).toBeUndefined()

  files['/work/agency/profile.md'] = FILLED + '- **Team:** two editors\n'
  await $.prompt.submit({ text: 'three' })
  expect((seen[2] as string[])[0]).toContain('two editors')
  expect((seen[2] as string[])[0]).toContain('replaces the earlier one')
})

test('outside a workspace the prompt goes through untouched', async ($, on) => {
  stubFiles(on, '/home/someone/project', {})
  const seen: unknown[] = []
  on('prompt.submit', ($, e) => {
    seen.push(e.context)
    return { text: e.text }
  })
  await $.prompt.submit({ text: 'hello' })
  expect(seen[0]).toBeUndefined()
})

test('/dalbo-status names the active client and the files still to fill', async ($, on) => {
  stubFiles(on, '/work/clients/acme', {
    '/work/agency/profile.md': FILLED,
    '/work/clients/acme/memory/business.md': TEMPLATE,
  })
  const answer = await $.command.run({ command: 'dalbo-status', args: '' })
  expect(answer.text).toContain('Active client: acme')
  expect(answer.text).toContain('clients/acme/memory/business.md')
})

test('destructive git commands are recognised, ordinary ones are not', async () => {
  for (const command of [
    'git push --force', 'git push origin main -f', 'git push --force-with-lease origin main',
    'git reset --hard HEAD~3', 'cd site && git clean -fd', 'git checkout -- .', 'git restore .',
    'git branch -D old-work', 'git stash drop', 'git rebase main', 'git push origin --delete feature',
  ]) expect(isDestructiveGit(command)).toBe(true)
  for (const command of [
    'git status', 'git add clients/acme', 'git commit -m "acme: november content"', 'git push',
    'git push origin main', 'git pull', 'git log --oneline', 'git checkout -b new-idea',
    'git restore --staged notes.md', 'git reset HEAD notes.md', 'git diff', 'ls -f',
  ]) expect(isDestructiveGit(command)).toBe(false)
})

/** Answers the guard's question with `choice`, and every other tool call with "ran". */
function stubTools(on, choice: string) {
  on('tool.call', ($, e) =>
    e.tool === 'AskUserQuestion'
      ? { result: { answers: { [e.questions[0].question]: choice } } }
      : { result: 'ran' })
}

test('in a workspace, a destructive git command is held until the user approves', async ($, on) => {
  stubFiles(on, '/work/clients/acme', { '/work/agency/profile.md': FILLED })
  stubTools(on, 'Cancel')
  const refused = await $.tool.call({ tool: 'Bash', command: 'git reset --hard HEAD~3' })
  expect(refused.deny).toBeDefined()
  // Ordinary commands are never held
  expect(await $.tool.call({ tool: 'Bash', command: 'git status' })).toEqual({ result: 'ran' })
})

test('an approved destructive git command runs', async ($, on) => {
  stubFiles(on, '/work', { '/work/agency/profile.md': FILLED })
  stubTools(on, 'Run it')
  expect(await $.tool.call({ tool: 'Bash', command: 'git push --force' })).toEqual({ result: 'ran' })
})

test('outside a workspace the git guard stays out of the way', async ($, on) => {
  stubFiles(on, '/home/someone/project', {})
  stubTools(on, 'Cancel')
  expect(await $.tool.call({ tool: 'Bash', command: 'git reset --hard' })).toEqual({ result: 'ran' })
})
