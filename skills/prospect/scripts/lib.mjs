// Pure functions for the prospecting scripts: no network, no file access.

/** Hosts that mean "this business has a social page, not a website". */
const SOCIAL_HOSTS = [
  'facebook.com', 'instagram.com', 'linktr.ee', 'tiktok.com', 'yelp.com', 'yelp.com.au',
  'yellowpages.com', 'yellowpages.com.au', 'truelocal.com.au', 'hipages.com.au', 'google.com',
  'business.site', 'linkedin.com', 'x.com', 'twitter.com',
]

/** The host of a URL without "www.", or '' when it isn't a URL. */
export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

/** 'none', 'social' (a profile or directory page) or 'site' (their own domain). */
export function websiteKind(url) {
  const host = hostOf(url)
  if (!host) return 'none'
  return SOCIAL_HOSTS.some((s) => host === s || host.endsWith('.' + s)) ? 'social' : 'site'
}

/** Turns one Places API (New) place into the lead shape the skills use. */
export function toLead(place) {
  return {
    placeId: place.id ?? '',
    name: place.displayName?.text ?? '',
    address: place.formattedAddress ?? '',
    phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? '',
    website: place.websiteUri ?? '',
    websiteKind: websiteKind(place.websiteUri ?? ''),
    rating: typeof place.rating === 'number' ? place.rating : null,
    reviewCount: typeof place.userRatingCount === 'number' ? place.userRatingCount : 0,
    mapsUrl: place.googleMapsUri ?? '',
    type: place.primaryType ?? '',
    status: place.businessStatus ?? '',
  }
}

/**
 * Scores how good a fit a lead is for website and content services, 0 to 100,
 * with the reasons in plain words. A closed business scores 0.
 */
export function scoreLead(lead) {
  const reasons = []
  if (lead.status && lead.status !== 'OPERATIONAL') return { score: 0, reasons: ['not operating'] }

  let score = 0
  if (lead.websiteKind === 'none') {
    score += 40
    reasons.push('no website listed')
  } else if (lead.websiteKind === 'social') {
    score += 30
    reasons.push('only a social or directory page as website')
  }
  if (lead.rating !== null && lead.rating >= 4.3 && lead.reviewCount >= 20) {
    score += 25
    reasons.push('well reviewed (' + lead.rating + ' from ' + lead.reviewCount + '), so there is something good to show')
  } else if (lead.reviewCount < 10) {
    score += 10
    reasons.push('few reviews, low visibility')
  }
  if (lead.rating !== null && lead.rating < 3.8 && lead.reviewCount >= 10) {
    score -= 15
    reasons.push('low rating: marketing will not fix the service')
  }
  if (lead.phone) {
    score += 10
    reasons.push('phone number listed')
  }
  return { score: Math.max(0, Math.min(100, score)), reasons }
}

/** Leads with scores, best first, duplicates by placeId removed. */
export function rank(leads) {
  const seen = new Set()
  const out = []
  for (const lead of leads) {
    const key = lead.placeId || lead.name + '|' + lead.address
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ ...lead, ...scoreLead(lead) })
  }
  return out.sort((a, b) => b.score - a.score || b.reviewCount - a.reviewCount)
}

/** Whether an 11-digit Australian Business Number passes its checksum. */
export function validAbn(abn) {
  const digits = String(abn ?? '').replace(/\s/g, '')
  if (!/^\d{11}$/.test(digits)) return false
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
  let sum = 0
  for (let i = 0; i < 11; i++) sum += (Number(digits[i]) - (i === 0 ? 1 : 0)) * weights[i]
  return sum % 89 === 0
}

/** The object inside a JSONP reply such as callback({...}). */
export function parseJsonp(text) {
  const body = String(text ?? '').trim()
  const start = body.indexOf('(')
  const end = body.lastIndexOf(')')
  const json = start >= 0 && end > start ? body.slice(start + 1, end) : body
  return JSON.parse(json)
}

/** Reads --name value and --flag pairs from an argument list. */
export function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    const value = argv[i + 1]
    if (value === undefined || value.startsWith('--')) out[key] = true
    else {
      out[key] = value
      i += 1
    }
  }
  return out
}
