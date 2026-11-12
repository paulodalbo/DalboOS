import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { hostOf, parseArgs, parseJsonp, rank, scoreLead, toLead, validAbn, websiteKind } from '../../skills/prospect/scripts/lib.mjs'
import * as site from '../../skills/preview-site/scripts/build.mjs'
import * as proposal from '../../skills/proposal/scripts/build.mjs'
import * as carousel from '../../skills/carousel/scripts/render.mjs'
import { compare, parseCsv, summarize, toNumber } from '../../skills/monthly-report/scripts/summarize.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const fixture = (name) => readFileSync(join(root, 'tests/node/fixtures', name), 'utf8')

test('prospect: website kinds', () => {
  assert.equal(websiteKind(''), 'none')
  assert.equal(websiteKind('https://www.facebook.com/acmeplumbing'), 'social')
  assert.equal(websiteKind('https://m.facebook.com/acme'), 'social')
  assert.equal(websiteKind('https://acmeplumbing.com.au/'), 'site')
  assert.equal(websiteKind('https://notfacebook.com'), 'site')
  assert.equal(hostOf('not a url'), '')
})

test('prospect: a Places result becomes a lead and is scored', () => {
  const lead = toLead({
    id: 'abc', displayName: { text: 'Acme Plumbing' }, formattedAddress: '1 High St, Southport QLD',
    nationalPhoneNumber: '07 5555 0100', rating: 4.8, userRatingCount: 126, businessStatus: 'OPERATIONAL',
  })
  assert.equal(lead.name, 'Acme Plumbing')
  assert.equal(lead.websiteKind, 'none')
  const { score, reasons } = scoreLead(lead)
  assert.equal(score, 75)
  assert.ok(reasons.some((r) => r.includes('no website')))
  assert.equal(scoreLead({ ...lead, status: 'CLOSED_PERMANENTLY' }).score, 0)
})

test('prospect: ranking removes duplicates and puts the best first', () => {
  const base = { address: '', phone: '', rating: 4.5, reviewCount: 30, status: 'OPERATIONAL' }
  const ranked = rank([
    { ...base, placeId: '1', name: 'Has site', websiteKind: 'site' },
    { ...base, placeId: '2', name: 'No site', websiteKind: 'none' },
    { ...base, placeId: '2', name: 'No site', websiteKind: 'none' },
  ])
  assert.deepEqual(ranked.map((l) => l.name), ['No site', 'Has site'])
})

test('prospect: ABN checksum', () => {
  assert.equal(validAbn('51 824 753 556'), true)
  assert.equal(validAbn('51824753557'), false)
  assert.equal(validAbn('123'), false)
})

test('prospect: JSONP and argument parsing', () => {
  assert.deepEqual(parseJsonp('callback({"Abn":"51824753556","Message":""})'), { Abn: '51824753556', Message: '' })
  assert.deepEqual(parseJsonp('{"a":1}'), { a: 1 })
  assert.deepEqual(parseArgs(['--query', 'plumbers in Southport', '--pdf', '--max', '20']), { query: 'plumbers in Southport', pdf: true, max: '20' })
})

const brief = {
  name: 'Acme <Plumbing>', headline: 'Blocked drain? We\'re there today.', intro: 'Licensed plumbers.', agency: 'Northside Media',
  services: [{ title: 'Drains', text: 'Cleared.' }, { title: 'Hot water', text: 'Fixed.' }],
  phone: '07 5555 0100', colours: { brand: 'red; } body { display:none', brandDark: '#0a3d91' },
  reviews: [{ text: '<script>alert(1)</script>', author: 'Sarah' }],
}

test('preview site: validation', () => {
  assert.deepEqual(site.validate(brief), [])
  assert.ok(site.validate({ name: 'X' }).length >= 4)
})

test('preview site: the page is escaped, labelled as a preview and not indexable', () => {
  const html = site.render(readFileSync(join(root, 'skills/preview-site/assets/template.html'), 'utf8'), brief)
  assert.ok(html.includes('Acme &lt;Plumbing&gt;'))
  assert.ok(!html.includes('<script>alert(1)</script>'))
  assert.ok(!html.includes('display:none'), 'a bad colour value falls back to the default')
  assert.ok(html.includes('--brand: #0f62fe'))
  assert.ok(html.includes('noindex'))
  assert.ok(html.includes('Preview prepared by Northside Media'))
  assert.ok(html.includes('href="tel:0755550100"'))
  assert.ok(!/\{\{[A-Z_]+\}\}/.test(html), 'no placeholder is left unfilled')
})

const deal = {
  client: 'Acme Plumbing', agency: { name: 'Northside Media' }, date: '12 November 2026', currency: 'AUD',
  summary: 'A site and videos.', scope: [{ title: 'Website', items: ['Five pages'] }],
  pricing: [
    { item: 'Website build', period: 'one-off', price: 2400 },
    { item: 'Videos', period: 'monthly', price: 1500 },
    { item: 'Extra shoot', period: 'monthly', price: 250.5 },
    { item: 'Ad spend', price: 'paid directly to Google' },
  ],
}

test('proposal: totals per billing period and money formatting', () => {
  assert.deepEqual(proposal.totals(deal.pricing), { 'one-off': 2400, monthly: 1750.5 })
  assert.equal(proposal.money(2400, 'en-AU', 'AUD'), '$2,400')
  assert.equal(proposal.money(1750.5, 'en-US', 'USD'), '$1,750.50')
  assert.equal(proposal.money('paid directly to Google', 'en-AU', 'AUD'), 'paid directly to Google')
})

test('proposal: renders every section and picks the paper size by locale', () => {
  const template = readFileSync(join(root, 'skills/proposal/assets/template.html'), 'utf8')
  assert.deepEqual(proposal.validate(deal), [])
  const au = proposal.render(template, deal)
  assert.ok(au.includes('size: A4'))
  assert.ok(au.includes('$1,750.50'))
  assert.ok(!/\{\{[A-Z_]+\}\}/.test(au))
  assert.ok(proposal.render(template, { ...deal, locale: 'en-US', currency: 'USD' }).includes('size: Letter'))
  assert.ok(proposal.validate({}).length >= 5)
})

test('carousel: validation catches long text and too few slides', () => {
  assert.ok(carousel.validate({ slides: [{ title: 'One' }] }).some((p) => p.includes('at least two')))
  const long = carousel.validate({ slides: [{ title: 'x'.repeat(71) }, { title: 'ok' }] })
  assert.ok(long.some((p) => p.includes('slide 1 title is 71 characters')))
  assert.ok(carousel.validate({ size: 'banner', slides: [{ title: 'a' }, { title: 'b' }] }).some((p) => p.includes('unknown size')))
})

test('carousel: renders one section per slide at the chosen size', () => {
  const deck = {
    size: 'portrait', brand: { primary: '#0f62fe', headingFont: 'Inter"; } *{', handle: '@acme' },
    slides: [{ title: 'Three signs' }, { title: 'Rusty <water>', body: 'Brown water.' }, { title: 'Call us' }],
  }
  assert.deepEqual(carousel.validate(deck), [])
  const html = carousel.render(deck)
  assert.equal(html.match(/<section class="slide/g).length, 3)
  assert.ok(html.includes('width: 1080px; height: 1350px'))
  assert.ok(html.includes('class="slide cover"') && html.includes('class="slide cta"'))
  assert.ok(html.includes('Rusty &lt;water&gt;'))
  assert.ok(!html.includes('Inter";'), 'an unsafe font name falls back')
  assert.ok(html.includes('2 / 3'))
})

test('report: CSV parsing and number cleaning', () => {
  assert.deepEqual(parseCsv('a,"b, c","d ""e"""\r\n1,2,3\n'), [['a', 'b, c', 'd "e"'], ['1', '2', '3']])
  assert.equal(toNumber('$1,020.50'), 1020.5)
  assert.equal(toNumber('--'), 0)
  assert.equal(toNumber('6.77%'), 6.77)
})

test('report: a Google Ads export, skipping the preamble and total rows', () => {
  const out = summarize(fixture('google-ads.csv'))
  assert.equal(out.campaigns.length, 3)
  assert.deepEqual(out.totals, { cost: 1488.5, impressions: 17500, clicks: 406, conversions: 31, ctr: 2.32, cpc: 3.67, costPerConversion: 48.02 })
  assert.equal(out.campaigns[0].name, 'Plumbing - Southport')
  const paused = out.campaigns.find((c) => c.name === 'Brand')
  assert.equal(paused.ctr, null)
  assert.equal(paused.costPerConversion, null)
})

test('report: a Meta export with a BOM, CRLF and a comma in a name', () => {
  const out = summarize(fixture('meta.csv'))
  assert.equal(out.campaigns[0].name, 'Reels, November')
  assert.equal(out.totals.cost, 420)
  assert.equal(out.totals.clicks, 660)
  assert.equal(out.totals.conversions, 12)
  assert.deepEqual(out.columnsMissing, [])
})

test('report: change against the previous month', () => {
  const change = compare(summarize(fixture('google-ads.csv')).totals, summarize(fixture('google-ads-prev.csv')).totals)
  assert.equal(change.conversions, 29.2)
  assert.equal(change.cost, 6.3)
  assert.equal(compare({ cost: 5 }, { cost: 0 }).cost, null)
})

test('report: an export without a cost column is refused with a useful message', () => {
  assert.throws(() => summarize('Campaign,Clicks\nA,3\n'), /cost column/)
})
