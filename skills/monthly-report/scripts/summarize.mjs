#!/usr/bin/env node
// Turns a campaign export from Google Ads or Meta Ads Manager (CSV) into
// clean numbers: totals and per-campaign cost, impressions, clicks,
// conversions, CTR, CPC and cost per conversion, with change against a
// previous period when one is given.
//
//   node summarize.mjs --current nov.csv [--previous oct.csv] [--out nov.json]
//
// The arithmetic lives here so the report's numbers are computed, not
// estimated in prose.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** Parses CSV text into rows of cells. Handles quotes, commas and newlines inside quotes, and a BOM. */
export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  const src = String(text ?? '').replace(/^﻿/, '')
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"'
        i += 1
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  if (cell !== '' || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

/** "$1,234.50" -> 1234.5, "3.2%" -> 3.2, "--" or "" -> 0. */
export function toNumber(value) {
  const cleaned = String(value ?? '').replace(/[^0-9.\-]/g, '')
  const n = Number(cleaned)
  return cleaned === '' || cleaned === '-' || Number.isNaN(n) ? 0 : n
}

// Column names each platform uses, lowercased. First match wins, in this order.
const COLUMNS = {
  campaign: [/^campaign name$/, /^campaign$/],
  cost: [/^cost$/, /^amount spent/, /^spend$/],
  impressions: [/^impressions$/, /^impr\.?$/],
  clicks: [/^link clicks$/, /^clicks$/, /^clicks \(all\)$/],
  conversions: [/^conversions$/, /^results$/, /^leads$/, /^purchases$/],
}

/** Finds the header row and which column holds each metric. */
export function findColumns(rows) {
  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const header = rows[r].map((c) => c.trim().toLowerCase())
    const map = {}
    for (const [key, patterns] of Object.entries(COLUMNS)) {
      for (const pattern of patterns) {
        const index = header.findIndex((h) => pattern.test(h))
        if (index >= 0) {
          map[key] = index
          break
        }
      }
    }
    if (map.campaign !== undefined && map.cost !== undefined) return { headerRow: r, map }
  }
  return null
}

const round = (n, places = 2) => Math.round(n * 10 ** places) / 10 ** places

/** Rates from raw counts. A rate with a zero denominator is null, not 0. */
export function withRates(m) {
  return {
    ...m,
    cost: round(m.cost),
    ctr: m.impressions ? round((m.clicks / m.impressions) * 100) : null,
    cpc: m.clicks ? round(m.cost / m.clicks) : null,
    costPerConversion: m.conversions ? round(m.cost / m.conversions) : null,
  }
}

/** Totals and per-campaign metrics from one export. */
export function summarize(csvText) {
  const rows = parseCsv(csvText)
  const found = findColumns(rows)
  if (!found) throw new Error('Could not find a header row with a campaign column and a cost column. Export at campaign level with Cost (Google Ads) or Amount spent (Meta).')

  const { headerRow, map } = found
  const byName = new Map()
  for (const row of rows.slice(headerRow + 1)) {
    const name = (row[map.campaign] ?? '').trim()
    // Both platforms append total rows; counting them would double everything.
    if (!name || /^total/i.test(name) || /^total/i.test((row[0] ?? '').trim()) || name === '--') continue
    const m = byName.get(name) ?? { name, cost: 0, impressions: 0, clicks: 0, conversions: 0 }
    m.cost += toNumber(row[map.cost])
    if (map.impressions !== undefined) m.impressions += toNumber(row[map.impressions])
    if (map.clicks !== undefined) m.clicks += toNumber(row[map.clicks])
    if (map.conversions !== undefined) m.conversions += toNumber(row[map.conversions])
    byName.set(name, m)
  }

  const campaigns = [...byName.values()].map(withRates).sort((a, b) => b.cost - a.cost)
  const sum = campaigns.reduce(
    (t, c) => ({ cost: t.cost + c.cost, impressions: t.impressions + c.impressions, clicks: t.clicks + c.clicks, conversions: t.conversions + c.conversions }),
    { cost: 0, impressions: 0, clicks: 0, conversions: 0 },
  )
  return {
    columnsFound: Object.keys(map),
    columnsMissing: Object.keys(COLUMNS).filter((k) => map[k] === undefined),
    totals: withRates(sum),
    campaigns,
  }
}

/** Percentage change per metric. Null when the previous value is zero or missing. */
export function compare(current, previous) {
  const out = {}
  for (const key of ['cost', 'impressions', 'clicks', 'conversions', 'ctr', 'cpc', 'costPerConversion']) {
    const now = current[key]
    const before = previous[key]
    out[key] = typeof now === 'number' && typeof before === 'number' && before !== 0
      ? round(((now - before) / before) * 100, 1)
      : null
  }
  return out
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 2) if (argv[i]?.startsWith('--')) out[argv[i].slice(2)] = argv[i + 1]
  return out
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = parseArgs(process.argv.slice(2))
  if (!args.current) {
    console.error('Usage: node summarize.mjs --current export.csv [--previous export.csv] [--out result.json]')
    process.exit(2)
  }
  let result
  try {
    result = { current: summarize(readFileSync(args.current, 'utf8')) }
    if (args.previous) {
      result.previous = summarize(readFileSync(args.previous, 'utf8'))
      result.changePercent = compare(result.current.totals, result.previous.totals)
    }
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
  const json = JSON.stringify(result, null, 2)
  if (args.out) {
    writeFileSync(args.out, json)
    console.log('Wrote ' + args.out)
  } else console.log(json)
}
