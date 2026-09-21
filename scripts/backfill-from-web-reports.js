#!/usr/bin/env node
/**
 * Fills the listing columns of the trucks entered before the inspection form
 * (ids 31-56) from their original WEB REPORT PDFs, so the page can read real
 * values from the DB instead of the constants hardcoded in app/truck/[id]/page.tsx.
 *
 *   node scripts/backfill-from-web-reports.js                 # dry run, prints the plan
 *   node scripts/backfill-from-web-reports.js --apply         # writes it
 *   node scripts/backfill-from-web-reports.js --dir "<Website Listing folder>"
 *
 * Rules (real data only, never invented):
 *   - a truck is matched to a report by registration number (the PDF's file name)
 *   - only EMPTY columns are filled; a value already in the DB is kept, and any
 *     disagreement with the report is listed for a person to decide
 *   - exception: an integer horsepower the report gives with decimals (143 vs 142.71)
 *     is replaced, since the column only became numeric on 2026-09-21
 *   - a field the report doesn't have stays empty and is listed as missing
 *   - trucks named by their plate (HR 38 W 2162 …) get registration_number from the name
 *   - the emission norm comes from the Legal Report beside the web report
 *     ("Emission Norms – Bharat Stage VI"); one of them is a Word file named .pdf
 *
 * Needs pdftotext (poppler-utils).
 */
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const { createClient } = require('@supabase/supabase-js')

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const dirArg = args.indexOf('--dir')
const DIR = dirArg >= 0
  ? args[dirArg + 1]
  : path.join(process.env.HOME, 'Personal/repos/axlerator/Website Listing-20260801T185045Z-1-001/Website Listing')

const GROUPS = ['Core Systems', 'Loading Systems', 'Cabin & Interiors', 'Exterior & Body', 'Safety & Brakes']
// jsonb reorders object keys, so compare with them sorted
const canonical = (v) => JSON.stringify(v, (k, x) =>
  x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort()) : x)
const plateKey = (s) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '')

function findReports(dir) {
  const found = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) found.push(...findReports(p))
    else if (/^web report .*\.pdf$/i.test(entry.name)) found.push(p)
  }
  return found
}

// Every label the reports use. Split on these only: a free-text pattern also
// swallows the word before a label ("1 reverse RTO:").
const LABELS = [
  'Price', 'Location', 'Model', 'Year of Manufacturing', 'Insurance', 'Gearbox', 'RTO',
  'Horsepower', 'Kms Driven', 'Fuel Type', 'Transmission', 'Ownership Number', 'Tyres',
  'Payload Capacity', 'Net Payload', 'Gross Payload', 'Payload in Ft',
  ...GROUPS,
  'Engine', 'Drivetrain', 'Hydraulics', 'Cargo Bed', 'Tipping Mechanism',
  'Seats & Upholstering', 'Dashboard & Controls', 'Body Panels', 'Paint & Finish',
  'Light & Mirrors', 'Brake System', 'ABS Module', 'Safety Features',
]
const esc = (l) => l.replace(/[.*+?^${}()|[\]\\&]/g, '\\$&').replace(/ /g, '\\s+')
const LABEL_RE = new RegExp(
  `(?:\\d\\.\\s*)?(${[...LABELS].sort((x, y) => y.length - x.length).map(esc).join('|')})\\b\\s*\\.?\\s*:?`,
  'gi')

/** `[label, value]` in reading order. pdftotext wraps some labels ("Fuel\nType:"), so the text is joined first. */
function pairs(text) {
  const flat = text.replace(/\s+/g, ' ')
  const hits = [...flat.matchAll(LABEL_RE)].filter((m) => m[0].includes(':') || /^payload capacity$/i.test(m[1]))
  return hits.map((m, i) => {
    const end = i + 1 < hits.length ? hits[i + 1].index : flat.length
    const label = LABELS.find((l) => l.toLowerCase() === m[1].replace(/\s+/g, ' ').toLowerCase())
    return [label.toLowerCase(), flat.slice(m.index + m[0].length, end).trim()]
  })
}

const num = (s) => {
  const d = String(s || '').replace(/,/g, '').match(/\d+(\.\d+)?/)
  return d ? Number(d[0]) : null
}

/** "01/01/27", "14.12.2023", "20/05/26" -> YYYY-MM-DD (day first, as the reports write it). */
function date(s) {
  const m = String(s || '').match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/)
  if (!m) return null
  const [, d, mo, y] = m
  const year = y.length === 2 ? 2000 + Number(y) : Number(y)
  if (Number(mo) > 12 || Number(d) > 31) return null
  return `${year}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
}

/** Text of a report that may really be a .docx saved with a .pdf name. */
function reportText(file) {
  const head = fs.readFileSync(file).subarray(0, 4).toString('latin1')
  if (head.startsWith('PK')) {
    const xml = execFileSync('unzip', ['-p', file, 'word/document.xml'], { encoding: 'utf8' })
    return xml.replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '')
  }
  return execFileSync('pdftotext', [file, '-'], { encoding: 'utf8' })
}

/** "Emission Norms – Bharat Stage VI" -> "BS-VI" */
function emissionFromLegal(webReport) {
  const dir = path.dirname(webReport)
  const legal = fs.readdirSync(dir).find((f) => /legal\s*report/i.test(f))
  if (!legal) return null
  const m = reportText(path.join(dir, legal)).replace(/\s+/g, ' ')
    .match(/Emission Norms?\s*[–:-]\s*(?:Bharat Stage|BS)[\s-]*(VI|IV|III|II|6|4|3)\b/i)
  return m ? 'BS-' + ({ 6: 'VI', 4: 'IV', 3: 'III' }[m[1]] || m[1].toUpperCase()) : null
}

function parseReport(file) {
  const text = execFileSync('pdftotext', [file, '-'], { encoding: 'utf8' })
  const kv = pairs(text)
  const firstGroup = kv.findIndex(([k]) => GROUPS.some((g) => g.toLowerCase() === k))
  const spec = firstGroup >= 0 ? kv.slice(0, firstGroup) : kv
  const get = (...labels) => spec.find(([k]) => labels.includes(k))?.[1] || null
  const r = {}

  const price = get('price')
  if (price) {
    const n = num(price)
    r.price = /lakh/i.test(price) ? Math.round(n * 100000) : n
  }
  r.model = get('model')
  r.location = get('location')
  const mfg = get('year of manufacturing')?.match(/(\d{1,2})\/(\d{4})/)
  r.manufactured_on = mfg ? `${mfg[1].padStart(2, '0')}/${mfg[2]}` : null
  r.insurance_date = date(get('insurance'))
  r.gearbox = get('gearbox')
  r.rto = get('rto')
  const hp = get('horsepower')
  // One report writes the engine capacity here ("3544 cc"); that is not a power figure
  if (hp && /cc/i.test(hp)) r.engine_capacity = num(hp)
  else r.horsepower = num(hp)
  r.kilometers = num(get('kms driven'))
  const fuel = get('fuel type')
  if (fuel) {
    const f = fuel.toLowerCase()
    r.fuel_type = f.includes('cng') ? 'CNG' : f.includes('diesel') ? 'Diesel' : f.includes('petrol') ? 'Petrol' : fuel
    const bs = fuel.match(/BS[\s-]*(VI|IV|6|4|III|3)\b/i)
    if (bs) r.emission_norm = 'BS-' + ({ 6: 'VI', 4: 'IV', 3: 'III' }[bs[1]] || bs[1].toUpperCase())
  }
  const tr = get('transmission')
  r.transmission = tr
  r.ownership_number = num(get('ownership number', 'ownership'))
  r.tyres = num(get('tyres'))
  r.payload_capacity_net = num(get('net payload'))
  r.payload_capacity_gross = num(get('gross payload'))
  r.payload_capacity_ft = num(get('payload in ft'))

  // Scores: a group header, then its items, in order
  const scores = []
  for (const [k, v] of firstGroup >= 0 ? kv.slice(firstGroup) : []) {
    const g = GROUPS.find((name) => name.toLowerCase() === k)
    const label = LABELS.find((l) => l.toLowerCase() === k)
    if (g) scores.push({ group: g, score: num(v), items: [] })
    else if (scores.length) scores[scores.length - 1].items.push({ name: label, score: num(v) })
  }
  r.quality_scores = scores.length === 5 ? scores : null
  if (!r.emission_norm) r.emission_norm = emissionFromLegal(file)
  return r
}

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
  // Uncertified rows are not touched
  const { data: trucks, error } = await supabase.from('trucks').select('*').is('inspection_id', null).eq('certified', true).order('id')
  if (error) throw error

  const byPlate = new Map(trucks.filter((t) => t.registration_number).map((t) => [plateKey(t.registration_number), t]))
  const reports = findReports(DIR)
  console.log(`${apply ? 'APPLY' : 'DRY RUN'} — ${reports.length} web reports in ${DIR}\n`)

  const updates = []
  const unmatched = []
  for (const file of reports) {
    const plate = plateKey(path.basename(file, '.pdf').replace(/^web report /i, ''))
    const truck = byPlate.get(plate)
    if (!truck) { unmatched.push(path.relative(DIR, file)); continue }
    const r = parseReport(file)
    const set = {}
    const conflicts = []
    const missing = []
    for (const [col, val] of Object.entries(r)) {
      if (col === 'location') continue // the site's location is "city + RTO"; the report's is informal
      if (val === null || val === undefined) { if (col in truck) missing.push(col); continue }
      if (!(col in truck)) continue
      const cur = truck[col]
      const same = cur !== null && cur !== undefined &&
        (typeof val === 'object' ? canonical(cur) === canonical(val)
          : typeof val === 'number' ? Number(cur) === val
          : String(cur).trim().toLowerCase() === String(val).trim().toLowerCase())
      if (same) continue
      if (cur === null || cur === undefined || cur === '') set[col] = val
      else if (col === 'horsepower' && Number.isInteger(Number(cur)) && Math.abs(Number(cur) - val) < 1 && !Number.isInteger(val)) set[col] = val
      else conflicts.push(`${col}: db=${JSON.stringify(cur)} report=${JSON.stringify(val)}`)
    }
    updates.push({ truck, set, conflicts, missing })
  }

  // Trucks named by their own plate
  for (const t of trucks) {
    if (!t.registration_number && /^[A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{1,4}$/i.test(t.name.trim())) {
      updates.push({ truck: t, set: { registration_number: plateKey(t.name) }, conflicts: [], missing: [], fromName: true })
    }
  }

  let written = 0
  for (const { truck, set, conflicts, missing, fromName } of updates) {
    console.log(`#${truck.id} ${truck.name} (${truck.registration_number || plateKey(truck.name)})${fromName ? ' — plate from name' : ''}`)
    for (const [k, v] of Object.entries(set)) console.log(`  fill      ${k} = ${k === 'quality_scores' ? v.map((g) => `${g.group}:${g.score}`).join(', ') : JSON.stringify(v)}`)
    for (const c of conflicts) console.log(`  CONFLICT  ${c}  (kept db value)`)
    if (missing.length) console.log(`  missing   ${missing.join(', ')} (not in report)`)
    if (apply && Object.keys(set).length) {
      const { error: e } = await supabase.from('trucks').update(set).eq('id', truck.id)
      if (e) console.log(`  ERROR     ${e.message}`)
      else written++
    }
  }
  if (unmatched.length) console.log(`\nNo truck with this plate: ${unmatched.join(', ')}`)
  console.log(`\n${updates.length} trucks, ${updates.reduce((n, u) => n + Object.keys(u.set).length, 0)} values to fill, ` +
    `${updates.reduce((n, u) => n + u.conflicts.length, 0)} conflicts${apply ? `, ${written} rows written` : ''}`)
}

module.exports = { parseReport }

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1) })
