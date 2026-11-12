#!/usr/bin/env node
// Builds an Instagram carousel from a JSON file of slides.
//
//   node render.mjs --slides slides.json --out content/2026-11/carousel-drains
//
// Always writes <out>/slides.html (all slides on one page, for review). When
// Playwright is installed it also writes slide-01.png, slide-02.png, ... at
// the exact pixel size. Install it with:
//   npm install playwright && npx playwright install chromium

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/** Supported sizes in pixels. portrait is the 4:5 feed format. */
export const SIZES = {
  portrait: { width: 1080, height: 1350 },
  tall: { width: 1080, height: 1440 },
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
}

/** Longest text that still reads at phone size, per field. */
export const LIMITS = { title: 70, body: 220, kicker: 40 }

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

const HEX = /^#[0-9a-fA-F]{3,8}$/
const colour = (value, fallback) => (HEX.test(String(value ?? '')) ? value : fallback)
/** Font names are letters, digits and spaces only, so they are safe inside CSS. */
const font = (value, fallback) => (/^[A-Za-z0-9 ]{1,40}$/.test(String(value ?? '')) ? value : fallback)

/** Problems that would make the carousel unreadable or break the layout. */
export function validate(deck) {
  const problems = []
  if (!SIZES[deck?.size ?? 'portrait']) problems.push('unknown size "' + deck.size + '": use ' + Object.keys(SIZES).join(', '))
  const slides = deck?.slides
  if (!Array.isArray(slides) || slides.length < 2) return [...problems, '"slides" needs at least two slides']
  if (slides.length > 20) problems.push('Instagram carousels hold at most 20 slides; this has ' + slides.length)
  slides.forEach((slide, i) => {
    const n = 'slide ' + (i + 1)
    if (!slide.title && !slide.body) problems.push(n + ' has no title or body')
    for (const field of Object.keys(LIMITS)) {
      const length = String(slide[field] ?? '').length
      if (length > LIMITS[field]) problems.push(n + ' ' + field + ' is ' + length + ' characters; keep it under ' + LIMITS[field])
    }
  })
  return problems
}

export function render(deck) {
  const size = SIZES[deck.size ?? 'portrait']
  const brand = deck.brand ?? {}
  const total = deck.slides.length

  const slides = deck.slides.map((slide, i) => {
    const kind = slide.kind ?? (i === 0 ? 'cover' : i === total - 1 ? 'cta' : 'point')
    return (
      '<section class="slide ' + escapeHtml(kind) + '" id="slide-' + (i + 1) + '">' +
      (slide.kicker ? '<p class="kicker">' + escapeHtml(slide.kicker) + '</p>' : '') +
      (slide.title ? '<h2>' + escapeHtml(slide.title) + '</h2>' : '') +
      (slide.body ? '<p class="body">' + escapeHtml(slide.body) + '</p>' : '') +
      '<footer><span>' + escapeHtml(brand.handle ?? '') + '</span><span>' + (i + 1) + ' / ' + total + '</span></footer>' +
      '</section>'
    )
  }).join('\n')

  const heading = font(brand.headingFont, 'system-ui')
  const body = font(brand.bodyFont, 'system-ui')

  return `<!DOCTYPE html>
<html lang="${escapeHtml(deck.locale ?? 'en-AU')}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(deck.title ?? 'Carousel')}</title>
<style>
  :root { --bg: ${colour(brand.background, '#ffffff')}; --ink: ${colour(brand.text, '#14171a')}; --brand: ${colour(brand.primary, '#0f62fe')}; --on-brand: ${colour(brand.onPrimary, '#ffffff')}; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #d9dce1; display: flex; flex-wrap: wrap; gap: 24px; padding: 24px; }
  .slide { width: ${size.width}px; height: ${size.height}px; background: var(--bg); color: var(--ink); padding: 96px 88px 120px; position: relative; display: flex; flex-direction: column; justify-content: center; overflow: hidden; font-family: "${body}", system-ui, sans-serif; }
  .slide.cover, .slide.cta { background: var(--brand); color: var(--on-brand); }
  .kicker { font-size: 34px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; margin: 0 0 28px; opacity: .8; }
  h2 { font-family: "${heading}", system-ui, sans-serif; font-size: 84px; line-height: 1.05; letter-spacing: -.02em; margin: 0 0 36px; text-wrap: balance; }
  .cover h2 { font-size: 112px; }
  .body { font-size: 46px; line-height: 1.35; margin: 0; text-wrap: pretty; }
  footer { position: absolute; left: 88px; right: 88px; bottom: 56px; display: flex; justify-content: space-between; font-size: 30px; opacity: .7; }
</style>
</head>
<body>
${slides}
</body>
</html>
`
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
  for (let i = 0; i < argv.length; i += 2) if (argv[i]?.startsWith('--')) out[argv[i].slice(2)] = argv[i + 1]
  return out
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = parseArgs(process.argv.slice(2))
  if (!args.slides || !args.out) {
    console.error('Usage: node render.mjs --slides slides.json --out <folder>')
    process.exit(2)
  }
  const deck = JSON.parse(readFileSync(args.slides, 'utf8'))
  const problems = validate(deck)
  if (problems.length) {
    console.error('The slides are not ready:\n- ' + problems.join('\n- '))
    process.exit(1)
  }
  mkdirSync(args.out, { recursive: true })
  const htmlFile = resolve(args.out, 'slides.html')
  writeFileSync(htmlFile, render(deck))
  console.log('Wrote ' + htmlFile)

  const playwright = await loadPlaywright()
  const chromium = playwright?.chromium ?? playwright?.default?.chromium
  if (!chromium) {
    console.log('Playwright is not installed, so no PNG files were made. Review slides.html in a browser, then run this in your workspace folder: npm install playwright && npx playwright install chromium')
    process.exit(0)
  }
  const size = SIZES[deck.size ?? 'portrait']
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: size.width + 48, height: size.height + 48 } })
  await page.goto(pathToFileURL(htmlFile).href)
  await page.evaluate(() => document.fonts.ready)
  for (let i = 1; i <= deck.slides.length; i++) {
    const file = resolve(args.out, 'slide-' + String(i).padStart(2, '0') + '.png')
    await page.locator('#slide-' + i).screenshot({ path: file })
    console.log('Wrote ' + file)
  }
  await browser.close()
}
