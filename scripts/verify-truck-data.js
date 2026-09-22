#!/usr/bin/env node
/**
 * Verifies whether the DB / backend actually provides everything the truck detail page shows,
 * or whether the page is filling gaps with hardcoded values and placeholders.
 *
 * Usage:
 *   node scripts/verify-truck-data.js                      # all trucks, DB only
 *   node scripts/verify-truck-data.js --ids 68,75          # specific trucks
 *   node scripts/verify-truck-data.js --api http://localhost:3000   # also check the Next.js API
 *   node scripts/verify-truck-data.js --out reports/my-report.txt
 *
 * Read-only: only SELECTs rows and lists storage. Writes the report to a .txt file.
 *
 * NOTE: the "hardcoded" rules below mirror app/truck/[id]/page.tsx and lib/truck-listing-images.ts.
 * If those files change, update HARDCODED_RULES / PLACEHOLDERS here.
 */
require('dotenv').config({ path: '.env.local' })
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const dns = require('dns').promises
const { createClient } = require('@supabase/supabase-js')

const BUCKET = 'truck-images'

// ---- CLI args ---------------------------------------------------------------
const args = process.argv.slice(2)
const arg = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const ids = arg('ids') ? arg('ids').split(',').map((n) => parseInt(n.trim(), 10)).filter(Boolean) : null
const apiBase = arg('api')?.replace(/\/$/, '')
const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16)
const outFile = arg('out') || path.join('reports', `truck-data-report-${stamp}.txt`)

// ---- What the detail page needs ---------------------------------------------
// [column, label shown on site, required?]
const FIELDS = [
  ['name', 'Name', true],
  ['manufacturer', 'Brand', true],
  ['model', 'Model', true],
  ['year', 'Year', true],
  ['kilometers', 'Odometer', true],
  ['horsepower', 'Power', true],
  ['price', 'Price', true],
  ['image_url', 'Card/hero image', true],
  ['certified', 'Certified (listed)', true],
  ['subtitle', 'Subtitle (also parsed for BS4/BS6/CNG)', false],
  ['state', 'State', false],
  ['city', 'City', false],
  ['location', 'Location', false],
  ['registration_number', 'Registration number', true],
  ['fuel_type', 'Fuel', true],
  ['transmission', 'Transmission', true],
  ['gearbox', 'Gearbox', true],
  ['rto', 'RTO', true],
  ['insurance_date', 'Insurance', true],
  ['ownership_number', 'Ownership', true],
  ['tyres', 'Tyres', true],
  ['payload_capacity_net', 'Load capacity (net)', true],
  ['payload_capacity_gross', 'Load capacity (gross)', true],
  ['payload_capacity_ft', 'Body length (ft)', true],
  ['legal_report_url', 'Legal report', true],
  ['inspection_report_url', 'Inspection report', true],
  // Filled by forms-API `list_draft_as_truck()` since 2026-09-21; read by the page since 2026-09-22
  ['manufactured_on', 'Registration month (MM/YYYY)', true],
  ['emission_norm', 'Emission norm', true],
  ['engine_capacity', 'Engine CC', true],
  ['gallery', 'Gallery images', true],
  ['videos', 'Videos', true],
  ['quality_scores', 'Quality report scores', true],
]

// Columns the DB has but app/truck/[id]/page.tsx doesn't read yet
// The site links only the legal and inspection reports; web_report_url isn't needed
const NOT_READ_BY_PAGE = []

// Data the page shows that has NO column/table at all (always hardcoded in code today)
const NO_DB_SOURCE = [
  ['Features / capabilities list', 'truckCapabilities const — identical for every truck; the form does not ask'],
  ['Highlights / advantages', 'truckHighlights / axleratorAdvantages consts — identical for every truck'],
  ['EMI interest rate', 'rateOfInterest = 10.5 hardcoded'],
]

// Placeholder the page shows when the DB value is empty (page.tsx ~2650-2800)
const PLACEHOLDERS = {
  rto: "'MH-14 (Pune)' (or location/city if set)",
  insurance_date: "'Valid till Dec 2025'",
  gearbox: "'6-Speed Manual'",
  ownership_number: "'First Owner'",
  fuel_type: "'Diesel (BS-VI)'",
}

// Name-based overrides that ignore the DB value (page.tsx rtoValue / insuranceValue / modelValue /
// emissionStandard / gearboxValue, getInspectionData, finance amount).
const lc = (s) => (s || '').toLowerCase()
const isTata = (t) => lc(t.name).includes('tata') || t.manufacturer === 'Tata Motors'
const HARDCODED_RULES = [
  { label: 'Ashok Leyland Ecomet 1415 HE', match: (t) => t.name === 'ASHOK LEYLAND ECOMET STAR 1415 HE', fields: ['rto', 'insurance_date'], inspection: true },
  { label: 'Ashok Leyland Ecomet 1615 HE', match: (t) => t.name === 'ASHOK LEYLAND ECOMET STAR 1615 HE', fields: ['rto', 'insurance_date', 'model'] },
  { label: 'Tata 1412 LPT', match: (t) => t.name === 'Tata 1412 LPT', fields: ['rto', 'insurance_date', 'fuel_type'], inspection: true },
  { label: 'SML Isuzu Samrat 4760gs', match: (t) => t.name === 'SML Isuzu Samrat 4760gs', fields: ['rto', 'insurance_date', 'fuel_type'], inspection: true },
  { label: 'Mahindra Bolero Maxitruck Plus', match: (t) => t.name === 'Mahindra Bolero Maxitruck Plus', fields: ['rto', 'insurance_date', 'fuel_type (unless DB fuel_type set)'], inspection: true },
  { label: 'Tata Ace Gold (7908)', match: (t) => lc(t.name).includes('tata ace gold') && t.name.includes('7908'), fields: ['rto', 'insurance_date', 'model', 'gearbox', 'fuel_type'], inspection: true },
  { label: 'Tata Ace Gold (plain)', match: (t) => t.name === 'Tata Ace Gold', fields: ['rto', 'insurance_date', 'model', 'gearbox', 'fuel_type'], inspection: true },
  { label: 'Tata 1512G LPT', match: (t) => lc(t.name).includes('1512') && t.name.includes('LPT') && lc(t.name).includes('tata'), fields: ['rto', 'insurance_date', 'model', 'gearbox', 'fuel_type'], inspection: true },
  { label: 'Tata 1212 LPT', match: (t) => lc(t.name).includes('1212') && lc(t.name).includes('lpt') && lc(t.name).includes('tata'), fields: ['rto', 'insurance_date', 'model', 'gearbox', 'fuel_type'] },
  { label: 'Tata 609G', match: (t) => lc(t.name).includes('609') && (lc(t.name).includes('609g') || lc(t.name).includes('609 g')) && isTata(t), fields: ['rto', 'insurance_date', 'model', 'gearbox', 'fuel_type'] },
  { label: 'Tata 709G LPT', match: (t) => (lc(t.name).includes('709g') || lc(t.name).includes('709 g')) && lc(t.name).includes('lpt') && isTata(t), fields: ['rto', 'insurance_date', 'model', 'gearbox', 'fuel_type'], inspection: true },
  { label: 'Tata 1109G LPT', match: (t) => lc(t.name).includes('1109') && lc(t.name).includes('lpt') && isTata(t), fields: ['gearbox', 'fuel_type'] },
  { label: 'Eicher 2059XP', match: (t) => lc(t.name).includes('2059') && (lc(t.name).includes('eicher') || (t.manufacturer === 'Eicher Motors' && lc(t.model).includes('2059'))), fields: ['rto', 'fuel_type'] },
  { label: 'Eicher Pro 2110L', match: (t) => lc(t.name).includes('2110') && (lc(t.name).includes('2110l') || (t.model || '').toUpperCase().includes('2110L')), fields: ['rto', 'insurance_date', 'model', 'gearbox', 'fuel_type'] },
  { label: 'Bajaj Maxima CNG', match: (t) => lc(t.name).includes('bajaj') && lc(t.name).includes('maxima') && lc(t.name).includes('cng'), fields: ['rto', 'insurance_date', 'model', 'gearbox', 'fuel_type'] },
]

// lib/truck-listing-images.ts overrides the card image for these
const HERO_OVERRIDE_HINTS = ['709g', 'zt54', '2110', 'maxima', '7908', '1512', '1075', '1212', '609g', '1412', 'bolero', 'hr 55 x 4498', 'hr 55 x 0253']

// ---- helpers ------------------------------------------------------------------
const lines = []
const out = (s = '') => lines.push(s)
const hr = (c = '-') => out(c.repeat(78))
const empty = (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0)
const show = (v) => {
  if (empty(v) || (Array.isArray(v) && v.length === 0)) return '(empty)'
  if (Array.isArray(v)) return `${v.length} item(s)`
  const str = typeof v === 'object' ? JSON.stringify(v) : String(v)
  return str.length > 60 ? str.slice(0, 57) + '...' : str
}
const pad = (s, n) => String(s).padEnd(n)

async function fetchJson(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
    const body = await res.json().catch(() => null)
    return { status: res.status, body }
  } catch (e) {
    return { status: 0, error: e.message }
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  hr('=')
  out('AXLERATOR — TRUCK DATA VERIFICATION REPORT')
  out(`Generated: ${new Date().toISOString()}`)
  out(`Trucks:    ${ids ? ids.join(', ') : 'all'}`)
  out(`API check: ${apiBase || 'skipped (pass --api http://localhost:3000)'}`)
  hr('=')
  out()
  out('LEGEND')
  out('  OK          value present in DB and the page uses it')
  out('  MISSING     DB value empty -> page shows a placeholder or hides the row')
  out('  HARDCODED   page ignores the DB and shows a value written in code')
  out('  NO COLUMN   the DB has no column for this at all')
  out('  NOT READ    the DB has it, the page does not use it yet')
  out()

  // 1. connectivity
  out('1. CONNECTIVITY')
  hr()
  out(`  Supabase URL:      ${url || 'NOT SET'}`)
  out(`  Service role key:  ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'NOT SET (using anon key; storage listing may fail)'}`)
  if (!url || !key) {
    out('  RESULT: FAIL — missing env vars in .env.local')
    return finish()
  }
  try {
    await dns.lookup(new URL(url).hostname)
    out('  DNS:               resolves')
  } catch (e) {
    out(`  DNS:               FAIL (${e.code}) — project deleted/renamed or URL in .env.local is stale`)
    out('  RESULT: FAIL — cannot continue')
    return finish()
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } })
  // Not a head request: a HEAD on a missing table returns 204 with no error
  const ping = await supabase.from('trucks').select('id', { count: 'exact' }).limit(1)
  if (ping.error) {
    out(`  Query trucks:      FAIL — ${ping.error.code || ping.status} ${ping.error.message}`)
    if (ping.error.code === 'PGRST205') {
      out('                     Table not visible to the API: project still starting after a restore,')
      out('                     schema not migrated, or this is a different/new project. Retry in a few minutes.')
    }
    return finish()
  }
  out(`  Query trucks:      OK (${ping.count} rows)`)
  out()

  // 2. schema
  out('2. SCHEMA — columns the page needs on `trucks`')
  hr()
  const missingColumns = []
  for (const [col, label] of FIELDS) {
    const { error } = await supabase.from('trucks').select(col).limit(1)
    if (error) missingColumns.push(col)
    out(`  ${error ? 'NO COLUMN' : 'OK       '}  ${pad(col, 24)} ${label}${error ? '  <- ' + error.message : ''}`)
  }
  out()
  out('  Shown on site but there is no DB source at all:')
  for (const [what, where] of NO_DB_SOURCE) out(`  NO COLUMN  ${pad(what, 44)} ${where}`)
  out()

  // 3. storage
  out(`3. STORAGE — bucket "${BUCKET}"`)
  hr()
  const { data: rootEntries, error: storageErr } = await supabase.storage.from(BUCKET).list('', { limit: 1000 })
  if (storageErr) out(`  FAIL — ${storageErr.message}`)
  else out(`  OK — ${rootEntries.length} top-level entries (folders: ${rootEntries.filter((e) => !e.id).length})`)
  out()

  // 4. per truck
  const selectCols = FIELDS.map((f) => f[0]).filter((c) => !missingColumns.includes(c))
  let q = supabase.from('trucks').select(['id', ...selectCols].join(',')).order('id')
  if (ids) q = q.in('id', ids)
  const { data: trucks, error: trucksErr } = await q
  if (trucksErr) {
    out(`4. TRUCKS — FAIL: ${trucksErr.message}`)
    return finish()
  }
  if (ids) {
    const found = new Set(trucks.map((t) => t.id))
    const notFound = ids.filter((i) => !found.has(i))
    if (notFound.length) out(`  WARNING: ids not in DB: ${notFound.join(', ')} (API may serve seed data for these)`)
  }

  out('4. PER-TRUCK DETAIL')
  hr()
  const summary = []
  for (const t of trucks) {
    const rules = HARDCODED_RULES.filter((r) => r.match(t))
    const hardFields = new Set(rules.flatMap((r) => r.fields.map((f) => f.split(' ')[0])))
    const counts = { ok: 0, missing: 0, hardcoded: 0, nocol: 0, unread: 0 }

    out()
    hr('=')
    out(`TRUCK #${t.id}  ${t.name}`)
    out(`  certified=${t.certified}  reg=${show(t.registration_number)}`)
    out(`  name-based overrides: ${rules.length ? rules.map((r) => r.label).join(', ') : 'none'}`)
    hr()
    for (const [col, label, required] of FIELDS) {
      let status
      let note = ''
      if (missingColumns.includes(col)) {
        status = 'NO COLUMN'
        if (PLACEHOLDERS[col]) note = `page shows placeholder ${PLACEHOLDERS[col]}`
        counts.nocol++
      } else if (hardFields.has(col)) {
        status = 'HARDCODED'
        note = empty(t[col]) ? 'DB empty; page shows code value' : 'DB value ignored by page'
        counts.hardcoded++
      } else if (empty(t[col])) {
        if (!required) { status = 'optional '; note = '' }
        else {
          status = 'MISSING  '
          note = PLACEHOLDERS[col] ? `page shows placeholder ${PLACEHOLDERS[col]}` : 'row hidden or blank on page'
          counts.missing++
        }
      } else if (NOT_READ_BY_PAGE.includes(col)) {
        status = 'NOT READ '
        note = 'in DB, but the page does not read it yet'
        counts.unread++
      } else {
        status = 'OK       '
        counts.ok++
      }
      if (col === 'image_url' && HERO_OVERRIDE_HINTS.some((h) => lc(t.name).includes(h))) {
        note = (note ? note + '; ' : '') + 'card image may be overridden in lib/truck-listing-images.ts'
      }
      out(`  ${status}  ${pad(label, 38)} ${pad(show(t[col]), 30)} ${note}`)
    }
    const hasOwnInspection = rules.some((r) => r.inspection)
    if (empty(t.quality_scores)) {
      out(`  HARDCODED  ${pad('Quality report (page)', 38)} ${hasOwnInspection ? 'per-truck values in code' : 'GENERIC default (same for all trucks)'}; no quality_scores`)
    } else {
      out(`  OK         ${pad('Quality report (page)', 38)} from quality_scores; parts counts are the default report's`)
    }
    out(`  HARDCODED  ${pad('Features / highlights', 38)} same list for every truck`)

    // API checks
    let apiNote = ''
    if (apiBase) {
      const d = await fetchJson(`${apiBase}/api/trucks/${t.id}`)
      if (d.status !== 200) {
        apiNote = `detail API ${d.status || 'ERR'} ${d.error || ''}`
        out(`  API FAIL   /api/trucks/${t.id} -> ${d.status || d.error}`)
      } else {
        const b = d.body
        const mismatches = []
        const map = { image_url: 'imageUrl' }
        for (const [col] of FIELDS) {
          if (missingColumns.includes(col) || col === 'image_url') continue
          const apiVal = b[map[col] || col]
          if (apiVal === undefined) { mismatches.push(`${col}: not returned by API`); continue }
          const a = empty(apiVal) ? null : String(apiVal)
          const db = empty(t[col]) ? null : String(t[col])
          if (col === 'price' ? Number(a) !== Number(db) : a !== db) mismatches.push(`${col}: db=${show(db)} api=${show(a)}`)
        }
        if (b.imageUrl !== t.image_url) mismatches.push(`imageUrl rewritten: api=${show(b.imageUrl)}`)
        out(`  API        /api/trucks/${t.id} -> 200, ${mismatches.length ? mismatches.length + ' difference(s):' : 'matches DB'}`)
        for (const m of mismatches) out(`               - ${m}`)
      }

      const qs = new URLSearchParams({ truckName: t.name })
      if (t.registration_number) qs.set('registrationNumber', t.registration_number)
      if (t.image_url) qs.set('imageUrl', t.image_url)
      const m = await fetchJson(`${apiBase}/api/truck-images?${qs}`)
      const imgs = m.body?.images || []
      const urls = imgs.map((i) => (typeof i === 'string' ? i : i.url || i.supabaseUrl || ''))
      const videos = urls.filter((u) => /\.(mp4|mov|webm)(\?|$)/i.test(u)).length
      const pdfs = urls.filter((u) => /\.pdf(\?|$)/i.test(u)).length
      const media = `${urls.length - videos - pdfs} images, ${videos} videos, ${pdfs} pdfs`
      const src = m.body?.source ? ` source=${m.body.source}` : ''
      const folder = m.body?.folder ? ` folder="${m.body.folder}"` : ''
      const bad = m.status !== 200 || urls.length === 0 || /mapping|unreachable/.test(m.body?.source || '')
      out(`  ${bad ? 'MEDIA WARN' : 'MEDIA OK  '} /api/truck-images -> ${m.status || m.error}: ${media}${folder}${src}`)
      apiNote = `${urls.length - videos - pdfs}img/${videos}vid`
    }

    summary.push({ t, counts, rules, apiNote })
  }

  // 5. summary
  out()
  out()
  out('5. SUMMARY')
  hr('=')
  out(`  ${pad('ID', 5)}${pad('Truck', 38)}${pad('OK', 4)}${pad('MISS', 6)}${pad('HARD', 6)}${pad('NOCOL', 7)}${pad('UNREAD', 8)}${apiBase ? 'Media' : ''}`)
  hr()
  for (const { t, counts, apiNote } of summary) {
    out(`  ${pad(t.id, 5)}${pad(show(t.name).slice(0, 36), 38)}${pad(counts.ok, 4)}${pad(counts.missing, 6)}${pad(counts.hardcoded, 6)}${pad(counts.nocol, 7)}${pad(counts.unread, 8)}${apiNote}`)
  }
  hr()
  const fullyDb = summary.filter((s) => !s.counts.missing && !s.counts.hardcoded && !s.counts.nocol && !s.counts.unread)
  out(`  Trucks fully backed by DB columns: ${fullyDb.length} / ${summary.length}`)
  out('  (Even these still use hardcoded quality report, features, EMI rate and name-resolved media.)')
  out()
  out('  VERDICT: DB/backend provides everything only when every truck has MISS=0, HARD=0, NOCOL=0, UNREAD=0,')
  out('  and the "no DB source" items in section 2 have tables/columns and the page reads them.')
  finish()
}

function finish() {
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, lines.join('\n') + '\n')
  console.log(lines.join('\n'))
  console.log(`\nReport written to ${outFile}`)
}

main().catch((e) => {
  out(`FATAL: ${e.stack || e.message}`)
  finish()
  process.exit(1)
})
