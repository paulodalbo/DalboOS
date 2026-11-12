#!/usr/bin/env node
// Finds local businesses with Google's Places API (Text Search) and ranks them
// as leads. Uses the official API, so it needs a key and stays within Google's
// terms; it does not scrape Google Maps.
//
//   GOOGLE_PLACES_API_KEY=... node find-places.mjs \
//     --query "plumbers in Southport QLD" --region AU --max 40 --out leads.json
//
// --region is a two-letter country code (AU, US). --max is capped at 60, the
// most the API returns for one query. Phone, website and rating fields are
// billed by Google at its higher Text Search rate.

import { writeFileSync } from 'node:fs'
import { parseArgs, rank, toLead } from './lib.mjs'

const ENDPOINT = 'https://places.googleapis.com/v1/places:searchText'
const FIELDS = [
  'places.id', 'places.displayName', 'places.formattedAddress', 'places.nationalPhoneNumber',
  'places.internationalPhoneNumber', 'places.websiteUri', 'places.rating', 'places.userRatingCount',
  'places.googleMapsUri', 'places.businessStatus', 'places.primaryType', 'nextPageToken',
].join(',')

const args = parseArgs(process.argv.slice(2))
const key = process.env.GOOGLE_PLACES_API_KEY

if (!args.query) {
  console.error('Usage: node find-places.mjs --query "plumbers in Southport QLD" [--region AU] [--max 40] [--out leads.json]')
  process.exit(2)
}
if (!key) {
  console.error('GOOGLE_PLACES_API_KEY is not set. Create a key with the Places API (New) enabled in Google Cloud, then put it in the workspace .env file or the environment.')
  process.exit(2)
}

const max = Math.min(60, Math.max(1, Number(args.max) || 40))
const places = []
let pageToken

while (places.length < max) {
  const body = { textQuery: String(args.query), pageSize: Math.min(20, max - places.length) }
  if (args.region) body.regionCode = String(args.region).toUpperCase()
  if (pageToken) body.pageToken = pageToken

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': FIELDS },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    console.error('Places API answered ' + response.status + ': ' + (await response.text()).slice(0, 500))
    process.exit(1)
  }
  const data = await response.json()
  places.push(...(data.places ?? []))
  pageToken = data.nextPageToken
  if (!pageToken) break
}

const leads = rank(places.map(toLead)).filter((lead) => lead.score > 0)
const result = { query: String(args.query), region: args.region ?? null, found: places.length, leads }

if (args.out) {
  writeFileSync(String(args.out), JSON.stringify(result, null, 2))
  console.log('Saved ' + leads.length + ' leads to ' + args.out + ' (' + places.length + ' places found)')
} else {
  console.log(JSON.stringify(result, null, 2))
}
