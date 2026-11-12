#!/usr/bin/env node
// Builds a printable proposal from a JSON file.
//
//   node build.mjs --data proposal.json --out leads/acme-plumbing/proposal [--pdf]
//
// Always writes <out>/proposal.html. With --pdf it also writes proposal.pdf
// when Playwright is installed (npm install playwright && npx playwright
// install chromium); without Playwright, open the HTML and print to PDF.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** 1500 -> "$1,500" for en-AU/AUD. Non-numbers are shown as written. */
export function money(amount, locale, currency) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return String(amount ?? '')
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency, maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)
}

/** Sums numeric prices by billing period, such as { monthly: 1500, 'one-off': 2400 }. */
export function totals(pricing) {
  const out = {}
  for (const row of pricing ?? []) {
    if (typeof row.price !== 'number') continue
    const period = row.period || 'one-off'
    out[period] = (out[period] ?? 0) + row.price
  }
  return out
}

export function validate(data) {
  const problems = []
  for (const field of ['client', 'agency', 'date', 'summary', 'currency']) {
    if (!data?.[field]) problems.push('missing "' + field + '"')
  }
  if (!data?.agency?.name) problems.push('missing "agency.name"')
  if (!Array.isArray(data?.scope) || !data.scope.length) problems.push('"scope" needs at least one section')
  if (!Array.isArray(data?.pricing) || !data.pricing.length) problems.push('"pricing" needs at least one row')
  return problems
}

const list = (items) => (items ?? []).map((item) => '<li>' + escapeHtml(item) + '</li>').join('')

export function render(template, data) {
  const locale = data.locale ?? 'en-AU'
  const currency = data.currency

  const scope = data.scope
    .map((s) => '<div class="block"><h3>' + escapeHtml(s.title) + '</h3><ul>' + list(s.items) + '</ul></div>')
    .join('\n')

  const rows = data.pricing
    .map((r) =>
      '<tr><td>' + escapeHtml(r.item) + (r.note ? '<small>' + escapeHtml(r.note) + '</small>' : '') + '</td>' +
      '<td>' + escapeHtml(r.period || 'one-off') + '</td>' +
      '<td class="num">' + escapeHtml(money(r.price, locale, currency)) + '</td></tr>')
    .join('\n')

  const totalRows = Object.entries(totals(data.pricing))
    .map(([period, sum]) =>
      '<tr class="total"><td>Total</td><td>' + escapeHtml(period) + '</td><td class="num">' +
      escapeHtml(money(sum, locale, currency)) + '</td></tr>')
    .join('\n')

  const timeline = (data.timeline ?? [])
    .map((t) => '<tr><td>' + escapeHtml(t.when) + '</td><td>' + escapeHtml(t.what) + '</td></tr>')
    .join('\n')

  const section = (title, body) => (body ? '<section><h2>' + title + '</h2>' + body + '</section>' : '')

  const values = {
    LANG: escapeHtml(locale),
    PAGE_SIZE: locale === 'en-US' ? 'Letter' : 'A4',
    CLIENT: escapeHtml(data.client),
    CONTACT: escapeHtml(data.contact ?? ''),
    AGENCY: escapeHtml(data.agency.name),
    AGENCY_DETAILS: [data.agency.email, data.agency.phone, data.agency.website, data.agency.businessId]
      .filter(Boolean).map(escapeHtml).join(' · '),
    DATE: escapeHtml(data.date),
    VALID_UNTIL: data.validUntil ? 'Valid until ' + escapeHtml(data.validUntil) : '',
    TITLE: escapeHtml(data.title ?? 'Proposal for ' + data.client),
    SUMMARY: escapeHtml(data.summary),
    PROBLEMS: section('What we noticed', (data.problems ?? []).length ? '<ul>' + list(data.problems) + '</ul>' : ''),
    SCOPE: scope,
    PRICING_ROWS: rows,
    TOTAL_ROWS: totalRows,
    TAX_NOTE: escapeHtml(data.taxNote ?? ''),
    TIMELINE: section('Timeline', timeline ? '<table>' + timeline + '</table>' : ''),
    TERMS: section('Terms', (data.terms ?? []).length ? '<ul>' + list(data.terms) + '</ul>' : ''),
    NEXT_STEP: escapeHtml(data.nextStep ?? ''),
    BRAND: /^#[0-9a-fA-F]{3,8}$/.test(String(data.agency.colour ?? '')) ? data.agency.colour : '#14171a',
  }
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => (key in values ? values[key] : match))
}

/** Playwright from next to this script or from the folder the command is run in; null when absent. */
async function loadPlaywright() {
  try {
    return await import('playwright')
  } catch {
    // Not installed beside the skill: look in the working folder, where the user installs it.
  }
  try {
    const require = createRequire(join(process.cwd(), 'package.json'))
    return await import(pathToFileURL(require.resolve('playwright')).href)
  } catch {
    return null
  }
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) out[argv[i].slice(2)] = true
    else out[argv[i].slice(2)] = argv[++i]
  }
  return out
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = parseArgs(process.argv.slice(2))
  if (!args.data || !args.out) {
    console.error('Usage: node build.mjs --data proposal.json --out <folder> [--pdf]')
    process.exit(2)
  }
  const data = JSON.parse(readFileSync(args.data, 'utf8'))
  const problems = validate(data)
  if (problems.length) {
    console.error('The proposal data is not ready:\n- ' + problems.join('\n- '))
    process.exit(1)
  }
  const template = readFileSync(join(here, '..', 'assets', 'template.html'), 'utf8')
  mkdirSync(args.out, { recursive: true })
  const htmlFile = resolve(args.out, 'proposal.html')
  writeFileSync(htmlFile, render(template, data))
  console.log('Wrote ' + htmlFile)

  if (args.pdf) {
    const playwright = await loadPlaywright()
    const chromium = playwright?.chromium ?? playwright?.default?.chromium
    if (!chromium) {
      console.log('Playwright is not installed, so no PDF was made. Open proposal.html and print to PDF, or run this in your workspace folder: npm install playwright && npx playwright install chromium')
      process.exit(0)
    }
    const browser = await chromium.launch()
    const page = await browser.newPage()
    await page.goto(pathToFileURL(htmlFile).href)
    const pdfFile = resolve(args.out, 'proposal.pdf')
    await page.pdf({ path: pdfFile, format: (data.locale ?? 'en-AU') === 'en-US' ? 'Letter' : 'A4', printBackground: true })
    await browser.close()
    console.log('Wrote ' + pdfFile)
  }
}
