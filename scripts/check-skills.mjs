// Checks that need no Claude Code install: every skill has valid frontmatter,
// every template the mod reads starts out as "not filled", and the JSON
// manifests parse. Run with: node scripts/check-skills.mjs

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AGENCY_FILES, CLIENT_FILES, isFilled } from '../hooks/memory.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const problems = []

for (const file of ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json', 'hooks/hooks.json']) {
  try {
    JSON.parse(readFileSync(join(root, file), 'utf8'))
  } catch (error) {
    problems.push(file + ': ' + error.message)
  }
}

const skillsDir = join(root, 'skills')
const skills = readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory())
for (const dir of skills) {
  const path = join(skillsDir, dir.name, 'SKILL.md')
  if (!existsSync(path)) {
    problems.push('skills/' + dir.name + ': no SKILL.md')
    continue
  }
  const text = readFileSync(path, 'utf8')
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text)
  if (!match) {
    problems.push('skills/' + dir.name + ': no frontmatter')
    continue
  }
  const name = /^name:\s*(.+)$/m.exec(match[1])?.[1]?.trim()
  const description = /^description:\s*(.+)$/m.exec(match[1])?.[1]?.trim()
  if (name !== dir.name) problems.push('skills/' + dir.name + ': name "' + name + '" does not match the folder')
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name ?? '') || (name ?? '').length > 64) {
    problems.push('skills/' + dir.name + ': name must be lowercase letters, digits and hyphens, 64 characters at most')
  }
  if (!description) problems.push('skills/' + dir.name + ': no description')
  else if (description.length > 1024) problems.push('skills/' + dir.name + ': description is over 1,024 characters')
}

const templates = [
  ...AGENCY_FILES.map((f) => join('skills/setup/templates', f.path)),
  ...CLIENT_FILES.map((f) => join('skills/new-client/templates/client', f.path)),
]
for (const file of templates) {
  const path = join(root, file)
  if (!existsSync(path)) problems.push(file + ': template is missing')
  else if (isFilled(readFileSync(path, 'utf8'))) problems.push(file + ': an untouched template must not count as filled')
}

if (problems.length) {
  console.error(problems.map((p) => '✗ ' + p).join('\n'))
  process.exit(1)
}
console.log('✓ ' + skills.length + ' skills, ' + templates.length + ' templates, 3 manifests')
