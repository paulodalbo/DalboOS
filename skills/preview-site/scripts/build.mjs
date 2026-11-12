#!/usr/bin/env node
// Builds a one-page preview website for a lead from a JSON brief.
//
//   node build.mjs --brief brief.json --out leads/acme-plumbing/preview
//
// Writes <out>/index.html. The page is self-contained (no external files
// except an optional hero image) and carries a visible "preview" banner and a
// noindex tag, so it can't be mistaken for the business's real site.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

const HEX = /^#[0-9a-fA-F]{3,8}$/
const colour = (value, fallback) => (HEX.test(String(value ?? '')) ? value : fallback)

/** Digits and a leading + only, for tel: links. */
export const telHref = (phone) => String(phone ?? '').replace(/[^\d+]/g, '')

/** Checks a brief and returns a list of problems, empty when it is usable. */
export function validate(brief) {
  const problems = []
  for (const field of ['name', 'headline', 'intro', 'agency']) {
    if (!brief?.[field]) problems.push('missing "' + field + '"')
  }
  if (!Array.isArray(brief?.services) || brief.services.length < 2) problems.push('"services" needs at least two items')
  if (!brief?.phone && !brief?.email) problems.push('needs "phone" or "email" for the contact button')
  return problems
}

/** Fills the template. Every value from the brief is HTML-escaped. */
export function render(template, brief) {
  const services = brief.services
    .map((s) => '<article class="card"><h3>' + escapeHtml(s.title) + '</h3><p>' + escapeHtml(s.text) + '</p></article>')
    .join('\n        ')

  const reviews = (brief.reviews ?? [])
    .map((r) => '<blockquote><p>' + escapeHtml(r.text) + '</p><cite>' + escapeHtml(r.author) + '</cite></blockquote>')
    .join('\n        ')

  const rating = brief.rating && brief.reviewCount
    ? '<p class="rating">★ ' + escapeHtml(brief.rating) + ' from ' + escapeHtml(brief.reviewCount) + ' Google reviews</p>'
    : ''

  const contactHref = brief.phone ? 'tel:' + telHref(brief.phone) : 'mailto:' + encodeURI(String(brief.email))
  const hero = brief.heroImage
    ? 'linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.55)),url("' + encodeURI(String(brief.heroImage)) + '") center/cover'
    : 'linear-gradient(135deg,var(--brand-dark),var(--brand))'

  const values = {
    LANG: escapeHtml(brief.locale ?? 'en-AU'),
    NAME: escapeHtml(brief.name),
    HEADLINE: escapeHtml(brief.headline),
    INTRO: escapeHtml(brief.intro),
    AREA: escapeHtml(brief.area ?? ''),
    SERVICES_TITLE: escapeHtml(brief.servicesTitle ?? 'What we do'),
    SERVICES: services,
    REVIEWS_SECTION: reviews ? '<section class="reviews"><h2>What customers say</h2>\n        ' + reviews + '\n      </section>' : '',
    RATING: rating,
    CTA: escapeHtml(brief.cta ?? (brief.phone ? 'Call ' + brief.phone : 'Get in touch')),
    CONTACT_HREF: escapeHtml(contactHref),
    PHONE: escapeHtml(brief.phone ?? ''),
    EMAIL: escapeHtml(brief.email ?? ''),
    ADDRESS: escapeHtml(brief.address ?? ''),
    AGENCY: escapeHtml(brief.agency),
    BRAND: colour(brief.colours?.brand, '#0f62fe'),
    BRAND_DARK: colour(brief.colours?.brandDark, '#0a3d91'),
    ON_BRAND: colour(brief.colours?.onBrand, '#ffffff'),
    HERO: hero,
  }
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => (key in values ? values[key] : match))
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 2) if (argv[i]?.startsWith('--')) out[argv[i].slice(2)] = argv[i + 1]
  return out
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = parseArgs(process.argv.slice(2))
  if (!args.brief || !args.out) {
    console.error('Usage: node build.mjs --brief brief.json --out <folder>')
    process.exit(2)
  }
  const brief = JSON.parse(readFileSync(args.brief, 'utf8'))
  const problems = validate(brief)
  if (problems.length) {
    console.error('The brief is not ready:\n- ' + problems.join('\n- '))
    process.exit(1)
  }
  const template = readFileSync(join(here, '..', 'assets', 'template.html'), 'utf8')
  mkdirSync(args.out, { recursive: true })
  const file = join(args.out, 'index.html')
  writeFileSync(file, render(template, brief))
  console.log('Wrote ' + file)
}
