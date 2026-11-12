#!/usr/bin/env node
// Looks a business up in the Australian Business Register (ABN Lookup).
// Needs a free GUID from https://abr.business.gov.au/Tools/WebServices.
//
//   ABN_LOOKUP_GUID=... node abn-lookup.mjs --name "Acme Plumbing" [--max 5]
//   ABN_LOOKUP_GUID=... node abn-lookup.mjs --abn 51824753556
//
// Prints JSON. A name search returns candidates, not a confirmed match: the
// same trading name is often registered by several unrelated entities.

import { parseArgs, parseJsonp, validAbn } from './lib.mjs'

const BASE = 'https://abr.business.gov.au/json/'
const args = parseArgs(process.argv.slice(2))
const guid = process.env.ABN_LOOKUP_GUID

if (!args.name && !args.abn) {
  console.error('Usage: node abn-lookup.mjs --name "Business name" [--max 5]   or   --abn 12345678901')
  process.exit(2)
}
if (!guid) {
  console.error('ABN_LOOKUP_GUID is not set. Register for a free GUID at https://abr.business.gov.au/Tools/WebServices and put it in the workspace .env file or the environment.')
  process.exit(2)
}

let url
if (args.abn) {
  const abn = String(args.abn).replace(/\s/g, '')
  if (!validAbn(abn)) {
    console.log(JSON.stringify({ abn, valid: false, message: 'Not a valid ABN (checksum failed)' }, null, 2))
    process.exit(0)
  }
  url = BASE + 'AbnDetails.aspx?abn=' + abn + '&callback=callback&guid=' + encodeURIComponent(guid)
} else {
  url = BASE + 'MatchingNames.aspx?name=' + encodeURIComponent(String(args.name)) +
    '&maxResults=' + (Number(args.max) || 5) + '&callback=callback&guid=' + encodeURIComponent(guid)
}

const response = await fetch(url)
if (!response.ok) {
  console.error('ABN Lookup answered ' + response.status)
  process.exit(1)
}
let data
try {
  data = parseJsonp(await response.text())
} catch {
  console.error('ABN Lookup returned something that is not JSON. Check the GUID.')
  process.exit(1)
}
if (data.Message) console.error('ABN Lookup message: ' + data.Message)
console.log(JSON.stringify(data, null, 2))
